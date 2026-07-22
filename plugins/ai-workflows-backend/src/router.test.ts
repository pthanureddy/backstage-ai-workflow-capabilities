import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, type PluginLogger } from './router.js';

const logger: PluginLogger = {
  info: vi.fn(),
  warn: vi.fn(),
};

async function app() {
  const server = express();
  server.use('/api/ai-workflows', await createRouter({
    logger,
    now: () => new Date('2026-07-22T10:00:00Z'),
  }));
  return server;
}

const validRequest = {
  workflowId: 'summarize-pull-request',
  entityRef: 'component:default/catalog-api',
  prompt: 'Summarize the change, test evidence, rollout risk and review questions.',
  requestedBy: 'thanu.reddy',
  githubPullRequestUrl: 'https://github.com/backstage/backstage/pull/30000',
};

describe('AI workflows backend router', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports plugin health', async () => {
    const response = await request(await app()).get('/api/ai-workflows/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', plugin: 'ai-workflows' });
  });

  it('lists the three governed workflows', async () => {
    const response = await request(await app()).get('/api/ai-workflows/workflows');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
  });

  it('creates a review-ready pull request summary plan', async () => {
    const response = await request(await app()).post('/api/ai-workflows/runs').send(validRequest);
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('READY_FOR_REVIEW');
    expect(response.body.plan[0]).toContain('backstage/backstage#30000');
    expect(response.body.createdAt).toBe('2026-07-22T10:00:00.000Z');
  });

  it('requires approval for generated test cases', async () => {
    const response = await request(await app()).post('/api/ai-workflows/runs').send({
      ...validRequest,
      workflowId: 'generate-test-cases',
      githubPullRequestUrl: undefined,
    });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING_APPROVAL');
    expect(response.body.approvalRequired).toBe(true);
  });

  it('returns a created run by identifier', async () => {
    const server = await app();
    const created = await request(server).post('/api/ai-workflows/runs').send(validRequest);
    const response = await request(server).get(`/api/ai-workflows/runs/${created.body.id}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
  });

  it('returns 404 for an unknown run', async () => {
    const response = await request(await app()).get('/api/ai-workflows/runs/missing');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('run_not_found');
  });

  it('rejects an unsupported workflow', async () => {
    const response = await request(await app()).post('/api/ai-workflows/runs').send({
      ...validRequest,
      workflowId: 'unrestricted-agent',
    });
    expect(response.status).toBe(400);
    expect(response.body.details).toContain('workflowId is not supported');
  });

  it('rejects prompts that contain credentials', async () => {
    const response = await request(await app()).post('/api/ai-workflows/runs').send({
      ...validRequest,
      prompt: 'Summarize this request using access_token=secret-value and include rollout risks.',
    });
    expect(response.status).toBe(400);
    expect(response.body.details).toContain('prompt appears to contain a credential or private key');
    expect(logger.warn).toHaveBeenCalled();
  });
});
