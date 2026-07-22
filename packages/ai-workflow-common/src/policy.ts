import type {
  GitHubPullRequestReference,
  ValidationResult,
  WorkflowDefinition,
  WorkflowId,
  WorkflowRunRequest,
} from './contracts.js';

export const workflowDefinitions: readonly WorkflowDefinition[] = [
  {
    id: 'generate-test-cases',
    title: 'Generate test cases',
    description: 'Turn acceptance criteria into reviewable happy-path, edge and failure test ideas.',
    riskLevel: 'MEDIUM',
    approvalRequired: true,
    expectedInputs: ['entityRef', 'acceptance criteria', 'optional GitHub pull request'],
  },
  {
    id: 'summarize-pull-request',
    title: 'Summarize pull request',
    description: 'Prepare a concise change, risk and verification summary for human review.',
    riskLevel: 'LOW',
    approvalRequired: false,
    expectedInputs: ['entityRef', 'GitHub pull request URL', 'review focus'],
  },
  {
    id: 'review-documentation',
    title: 'Review documentation',
    description: 'Check developer documentation for setup, operations and ownership gaps.',
    riskLevel: 'LOW',
    approvalRequired: false,
    expectedInputs: ['entityRef', 'documentation excerpt', 'review focus'],
  },
] as const;

const workflowIds = new Set<WorkflowId>(workflowDefinitions.map(item => item.id));
const sensitivePatterns = [
  /\b(api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*\S+/i,
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
];

export function validateRunRequest(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ['request body must be an object'] };
  }

  const workflowId = asTrimmedString(input.workflowId);
  const entityRef = asTrimmedString(input.entityRef);
  const prompt = asTrimmedString(input.prompt);
  const requestedBy = asTrimmedString(input.requestedBy);
  const githubPullRequestUrl = input.githubPullRequestUrl === undefined
    ? undefined
    : asTrimmedString(input.githubPullRequestUrl);

  if (!workflowIds.has(workflowId as WorkflowId)) {
    errors.push('workflowId is not supported');
  }
  if (!/^(component|system|resource|api):[a-z0-9._/-]+$/i.test(entityRef)) {
    errors.push('entityRef must use a Backstage entity reference such as component:default/catalog-api');
  }
  if (prompt.length < 20 || prompt.length > 2000) {
    errors.push('prompt must contain 20 to 2000 characters');
  }
  if (containsSensitiveData(prompt)) {
    errors.push('prompt appears to contain a credential or private key');
  }
  if (requestedBy.length < 3 || requestedBy.length > 120) {
    errors.push('requestedBy must contain 3 to 120 characters');
  }
  if (githubPullRequestUrl && !parseGitHubPullRequestUrl(githubPullRequestUrl)) {
    errors.push('githubPullRequestUrl must be an HTTPS github.com pull request URL');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      workflowId: workflowId as WorkflowId,
      entityRef,
      prompt,
      requestedBy,
      ...(githubPullRequestUrl ? { githubPullRequestUrl } : {}),
    },
  };
}

export function containsSensitiveData(value: string): boolean {
  return sensitivePatterns.some(pattern => pattern.test(value));
}

export function parseGitHubPullRequestUrl(value: string): GitHubPullRequestReference | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
      return undefined;
    }
    const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
    if (!match) {
      return undefined;
    }
    const pullNumber = Number(match[3]);
    if (!Number.isSafeInteger(pullNumber) || pullNumber < 1) {
      return undefined;
    }
    return { owner: match[1]!, repository: match[2]!, pullNumber };
  } catch {
    return undefined;
  }
}

export function definitionFor(id: WorkflowId): WorkflowDefinition {
  const definition = workflowDefinitions.find(item => item.id === id);
  if (!definition) {
    throw new Error(`Unknown workflow: ${id}`);
  }
  return definition;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
