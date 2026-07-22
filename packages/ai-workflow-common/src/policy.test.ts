import { describe, expect, it } from 'vitest';
import {
  containsSensitiveData,
  definitionFor,
  parseGitHubPullRequestUrl,
  validateRunRequest,
} from './policy.js';

const validRequest = {
  workflowId: 'generate-test-cases',
  entityRef: 'component:default/catalog-api',
  prompt: 'Generate test cases for the supplied acceptance criteria and failure modes.',
  requestedBy: 'thanu.reddy',
};

describe('workflow policy', () => {
  it('accepts a complete Backstage workflow request', () => {
    expect(validateRunRequest(validRequest)).toEqual({ ok: true, value: validRequest });
  });

  it('rejects unknown workflows and malformed entity references', () => {
    const result = validateRunRequest({ ...validRequest, workflowId: 'free-chat', entityRef: 'catalog-api' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(2);
  });

  it('rejects prompts outside the documented length boundary', () => {
    expect(validateRunRequest({ ...validRequest, prompt: 'short' }).ok).toBe(false);
    expect(validateRunRequest({ ...validRequest, prompt: 'x'.repeat(2001) }).ok).toBe(false);
  });

  it('detects common credential formats', () => {
    expect(containsSensitiveData('password=hunter2')).toBe(true);
    expect(containsSensitiveData('access_token: secret-value')).toBe(true);
    expect(containsSensitiveData('Review public documentation only')).toBe(false);
  });

  it('parses a GitHub pull request URL', () => {
    expect(parseGitHubPullRequestUrl('https://github.com/backstage/backstage/pull/30000')).toEqual({
      owner: 'backstage', repository: 'backstage', pullNumber: 30000,
    });
  });

  it('rejects non-GitHub and non-pull-request URLs', () => {
    expect(parseGitHubPullRequestUrl('https://example.com/org/repo/pull/1')).toBeUndefined();
    expect(parseGitHubPullRequestUrl('https://github.com/org/repo/issues/1')).toBeUndefined();
  });

  it('requires a valid optional pull request URL', () => {
    const result = validateRunRequest({ ...validRequest, githubPullRequestUrl: 'http://github.com/o/r/pull/1' });
    expect(result.ok).toBe(false);
  });

  it('marks test generation as a human-approval workflow', () => {
    expect(definitionFor('generate-test-cases').approvalRequired).toBe(true);
  });
});
