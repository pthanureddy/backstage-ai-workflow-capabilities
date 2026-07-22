import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { WorkflowApi } from '../api.js';
import { WorkflowPageView } from './WorkflowPage.js';

const workflows = [
  {
    id: 'summarize-pull-request' as const,
    title: 'Summarize pull request',
    description: 'Prepare a review summary.',
    riskLevel: 'LOW' as const,
    approvalRequired: false,
    expectedInputs: ['entityRef'],
  },
  {
    id: 'generate-test-cases' as const,
    title: 'Generate test cases',
    description: 'Create reviewable test ideas.',
    riskLevel: 'MEDIUM' as const,
    approvalRequired: true,
    expectedInputs: ['entityRef'],
  },
];

function api(overrides: Partial<WorkflowApi> = {}): WorkflowApi {
  return {
    listWorkflows: vi.fn().mockResolvedValue(workflows),
    createRun: vi.fn().mockResolvedValue({
      id: 'run-1',
      workflowId: 'summarize-pull-request',
      entityRef: 'component:default/catalog-api',
      requestedBy: 'backstage-user',
      status: 'READY_FOR_REVIEW',
      riskLevel: 'LOW',
      approvalRequired: false,
      createdAt: '2026-07-22T10:00:00Z',
      plan: ['Read the pull request.', 'Return review questions.'],
    }),
    getRun: vi.fn(),
    ...overrides,
  };
}

describe('WorkflowPageView', () => {
  it('loads and displays the governed workflow catalog', async () => {
    render(<WorkflowPageView api={api()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByRole('heading', { name: 'AI-assisted workflows' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Generate test cases' })).toBeVisible();
  });

  it('creates and renders a review plan', async () => {
    const client = api();
    render(<WorkflowPageView api={client} />);
    await screen.findByRole('heading', { name: 'AI-assisted workflows' });
    await userEvent.click(screen.getByRole('button', { name: 'Create review plan' }));
    expect(await screen.findByText('READY_FOR_REVIEW')).toBeVisible();
    expect(screen.getByText('Read the pull request.')).toBeVisible();
    expect(client.createRun).toHaveBeenCalledWith(expect.objectContaining({
      workflowId: 'summarize-pull-request',
      entityRef: 'component:default/catalog-api',
    }));
  });

  it('shows approval guidance when a higher-risk workflow is selected', async () => {
    render(<WorkflowPageView api={api()} />);
    await screen.findByRole('heading', { name: 'AI-assisted workflows' });
    await userEvent.selectOptions(screen.getByLabelText('Workflow'), 'generate-test-cases');
    expect(screen.getByText((_, node) => (
      node?.tagName === 'P' && node.textContent?.includes('Human approval required.') === true
    ))).toBeVisible();
  });

  it('shows a backend error without losing the form', async () => {
    const client = api({ createRun: vi.fn().mockRejectedValue(new Error('validation failed')) });
    render(<WorkflowPageView api={client} />);
    await screen.findByRole('heading', { name: 'AI-assisted workflows' });
    await userEvent.click(screen.getByRole('button', { name: 'Create review plan' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('validation failed'));
    expect(screen.getByRole('form', { name: 'AI workflow request' })).toBeVisible();
  });
});
