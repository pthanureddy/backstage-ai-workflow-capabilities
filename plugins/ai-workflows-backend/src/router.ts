import { randomUUID } from 'node:crypto';
import express, { type Router } from 'express';
import {
  definitionFor,
  parseGitHubPullRequestUrl,
  validateRunRequest,
  workflowDefinitions,
  type WorkflowRun,
  type WorkflowRunRequest,
} from '@pthanureddy/ai-workflow-common';

export interface PluginLogger {
  info(message: string, metadata?: Record<string, string | number | string[]>): void;
  warn(message: string, metadata?: Record<string, string | number | string[]>): void;
}

export interface RouterOptions {
  logger: PluginLogger;
  now?: () => Date;
}

export async function createRouter(options: RouterOptions): Promise<Router> {
  const router = express.Router();
  const runs = new Map<string, WorkflowRun>();
  const now = options.now ?? (() => new Date());

  router.use(express.json({ limit: '32kb' }));

  router.get('/health', (_request, response) => {
    response.json({ status: 'ok', plugin: 'ai-workflows' });
  });

  router.get('/workflows', (_request, response) => {
    response.json({ items: workflowDefinitions });
  });

  router.post('/runs', (request, response) => {
    const validation = validateRunRequest(request.body);
    if (!validation.ok) {
      options.logger.warn('Rejected AI workflow request', { errors: validation.errors });
      response.status(400).json({ error: 'validation_failed', details: validation.errors });
      return;
    }

    const run = createRun(validation.value, now());
    runs.set(run.id, run);
    options.logger.info('Created AI workflow plan', {
      runId: run.id,
      workflowId: run.workflowId,
      entityRef: run.entityRef,
      status: run.status,
    });
    response.status(201).json(run);
  });

  router.get('/runs/:id', (request, response) => {
    const run = runs.get(request.params.id);
    if (!run) {
      response.status(404).json({ error: 'run_not_found' });
      return;
    }
    response.json(run);
  });

  return router;
}

function createRun(request: WorkflowRunRequest, createdAt: Date): WorkflowRun {
  const definition = definitionFor(request.workflowId);
  const pullRequest = request.githubPullRequestUrl
    ? parseGitHubPullRequestUrl(request.githubPullRequestUrl)
    : undefined;

  return {
    id: randomUUID(),
    workflowId: request.workflowId,
    entityRef: request.entityRef,
    requestedBy: request.requestedBy,
    ...(request.githubPullRequestUrl ? { githubPullRequestUrl: request.githubPullRequestUrl } : {}),
    status: definition.approvalRequired ? 'PENDING_APPROVAL' : 'READY_FOR_REVIEW',
    riskLevel: definition.riskLevel,
    approvalRequired: definition.approvalRequired,
    createdAt: createdAt.toISOString(),
    plan: planFor(request, pullRequest),
  };
}

function planFor(
  request: WorkflowRunRequest,
  pullRequest: ReturnType<typeof parseGitHubPullRequestUrl>,
): string[] {
  const source = pullRequest
    ? `Read GitHub pull request ${pullRequest.owner}/${pullRequest.repository}#${pullRequest.pullNumber} through an authorized integration.`
    : 'Use only the supplied non-sensitive context.';
  const common = [
    source,
    `Resolve Backstage ownership and metadata for ${request.entityRef}.`,
    'Generate a structured draft without changing source code or repository state.',
    'Attach assumptions, missing context and verification suggestions.',
  ];

  if (request.workflowId === 'generate-test-cases') {
    return [...common, 'Require human approval before exporting test cases to another system.'];
  }
  if (request.workflowId === 'summarize-pull-request') {
    return [...common, 'Return change, risk, rollout and test-summary sections for reviewer confirmation.'];
  }
  return [...common, 'Return setup, ownership, operations and troubleshooting documentation gaps.'];
}
