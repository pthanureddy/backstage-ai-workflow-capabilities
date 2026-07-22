export type WorkflowId =
  | 'generate-test-cases'
  | 'summarize-pull-request'
  | 'review-documentation';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RunStatus = 'READY_FOR_REVIEW' | 'PENDING_APPROVAL';

export interface WorkflowDefinition {
  id: WorkflowId;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  expectedInputs: string[];
}

export interface WorkflowRunRequest {
  workflowId: WorkflowId;
  entityRef: string;
  prompt: string;
  requestedBy: string;
  githubPullRequestUrl?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: WorkflowId;
  entityRef: string;
  requestedBy: string;
  githubPullRequestUrl?: string;
  status: RunStatus;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  createdAt: string;
  plan: string[];
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export interface ValidationSuccess {
  ok: true;
  value: WorkflowRunRequest;
}

export type ValidationResult = ValidationFailure | ValidationSuccess;

export interface GitHubPullRequestReference {
  owner: string;
  repository: string;
  pullNumber: number;
}
