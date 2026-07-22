import { describe, expect, it, vi } from 'vitest';
import { WorkflowClient } from './api.js';

describe('WorkflowClient', () => {
  it('uses Backstage discovery and fetch APIs to list workflows', async () => {
    const discoveryApi = { getBaseUrl: vi.fn().mockResolvedValue('http://backstage/api/ai-workflows') };
    const fetchApi = {
      fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: 'review-documentation' }] }), {
        status: 200,
      })),
    };
    const client = new WorkflowClient(discoveryApi, fetchApi);
    const items = await client.listWorkflows();
    expect(items[0]?.id).toBe('review-documentation');
    expect(fetchApi.fetch).toHaveBeenCalledWith('http://backstage/api/ai-workflows/workflows', undefined);
  });

  it('sends typed JSON when creating a run', async () => {
    const discoveryApi = { getBaseUrl: vi.fn().mockResolvedValue('http://backstage/api/ai-workflows') };
    const fetchApi = {
      fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'run-1' }), { status: 201 })),
    };
    const client = new WorkflowClient(discoveryApi, fetchApi);
    await client.createRun({
      workflowId: 'review-documentation',
      entityRef: 'component:default/docs',
      prompt: 'Review the setup and operations instructions for missing context.',
      requestedBy: 'backstage-user',
    });
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      'http://backstage/api/ai-workflows/runs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces backend errors with status and response body', async () => {
    const discoveryApi = { getBaseUrl: vi.fn().mockResolvedValue('http://backstage/api/ai-workflows') };
    const fetchApi = { fetch: vi.fn().mockResolvedValue(new Response('invalid request', { status: 400 })) };
    const client = new WorkflowClient(discoveryApi, fetchApi);
    await expect(client.listWorkflows()).rejects.toThrow('AI workflow request failed (400): invalid request');
  });
});
