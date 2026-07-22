import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import type {
  WorkflowDefinition,
  WorkflowId,
  WorkflowRun,
} from '@pthanureddy/ai-workflow-common';
import { workflowApiRef, type WorkflowApi } from '../api.js';

export function WorkflowPage() {
  const api = useApi(workflowApiRef);
  return <WorkflowPageView api={api} />;
}

export interface WorkflowPageViewProps {
  api: WorkflowApi;
}

export function WorkflowPageView({ api }: WorkflowPageViewProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [workflowId, setWorkflowId] = useState<WorkflowId>('summarize-pull-request');
  const [entityRef, setEntityRef] = useState('component:default/catalog-api');
  const [prompt, setPrompt] = useState('Summarize the change, test evidence, rollout risk and review questions.');
  const [githubPullRequestUrl, setGithubPullRequestUrl] = useState('');
  const [run, setRun] = useState<WorkflowRun>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api.listWorkflows()
      .then(items => {
        if (active) setWorkflows(items);
      })
      .catch(reason => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load workflows');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const selected = useMemo(
    () => workflows.find(item => item.id === workflowId),
    [workflowId, workflows],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setRun(undefined);
    try {
      setRun(await api.createRun({
        workflowId,
        entityRef,
        prompt,
        requestedBy: 'backstage-user',
        ...(githubPullRequestUrl.trim() ? { githubPullRequestUrl: githubPullRequestUrl.trim() } : {}),
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create workflow plan');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p role="status">Loading AI-assisted workflows...</p>;

  return (
    <main aria-labelledby="ai-workflows-title" style={{ maxWidth: 880, margin: '0 auto', padding: 24 }}>
      <h1 id="ai-workflows-title">AI-assisted workflows</h1>
      <p>Create a reviewable plan. This plugin does not change repositories or send prompts to an LLM.</p>

      {error && <p role="alert" style={{ color: '#a40000' }}>{error}</p>}

      <form onSubmit={submit} aria-label="AI workflow request">
        <label>
          Workflow
          <select value={workflowId} onChange={event => setWorkflowId(event.target.value as WorkflowId)}>
            {workflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>{workflow.title}</option>
            ))}
          </select>
        </label>
        {selected && (
          <p>
            Risk: <strong>{selected.riskLevel}</strong>.{' '}
            {selected.approvalRequired ? 'Human approval required.' : 'Human review required.'}
          </p>
        )}

        <label>
          Backstage entity reference
          <input value={entityRef} onChange={event => setEntityRef(event.target.value)} />
        </label>

        <label>
          GitHub pull request URL (optional)
          <input value={githubPullRequestUrl} onChange={event => setGithubPullRequestUrl(event.target.value)} />
        </label>

        <label>
          Review instructions
          <textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={5} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating plan...' : 'Create review plan'}
        </button>
      </form>

      {run && (
        <section aria-labelledby="workflow-result-title">
          <h2 id="workflow-result-title">Workflow plan</h2>
          <p>Status: <strong>{run.status}</strong></p>
          <ol>{run.plan.map(step => <li key={step}>{step}</li>)}</ol>
        </section>
      )}
    </main>
  );
}
