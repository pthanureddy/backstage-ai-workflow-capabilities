import {
  createApiRef,
  type DiscoveryApi,
  type FetchApi,
} from '@backstage/core-plugin-api';
import type {
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunRequest,
} from '@pthanureddy/ai-workflow-common';

export interface WorkflowApi {
  listWorkflows(): Promise<WorkflowDefinition[]>;
  createRun(request: WorkflowRunRequest): Promise<WorkflowRun>;
  getRun(id: string): Promise<WorkflowRun>;
}

export const workflowApiRef = createApiRef<WorkflowApi>({
  id: 'plugin.ai-workflows.service',
});

export class WorkflowClient implements WorkflowApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async listWorkflows(): Promise<WorkflowDefinition[]> {
    const response = await this.request('/workflows');
    const body = await response.json() as { items: WorkflowDefinition[] };
    return body.items;
  }

  async createRun(request: WorkflowRunRequest): Promise<WorkflowRun> {
    const response = await this.request('/runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json() as Promise<WorkflowRun>;
  }

  async getRun(id: string): Promise<WorkflowRun> {
    const response = await this.request(`/runs/${encodeURIComponent(id)}`);
    return response.json() as Promise<WorkflowRun>;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = await this.discoveryApi.getBaseUrl('ai-workflows');
    const response = await this.fetchApi.fetch(`${baseUrl}${path}`, init);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AI workflow request failed (${response.status}): ${body}`);
    }
    return response;
  }
}
