# Backstage Integration

## Backend

Install the backend package in an existing Backstage monorepo and add it to the backend:

```ts
backend.add(import('@pthanureddy/backstage-plugin-ai-workflows-backend'));
```

The backend system mounts the router under `/api/ai-workflows`. The package uses `createBackendPlugin`, `coreServices.httpRouter` and `coreServices.logger`.

## Frontend

Install the frontend package and add its routable extension to the app route tree:

```tsx
import { AiWorkflowsPage } from '@pthanureddy/backstage-plugin-ai-workflows';

<Route path="/ai-workflows" element={<AiWorkflowsPage />} />
```

The client resolves the backend URL through Backstage `DiscoveryApi` and sends requests through `FetchApi`, preserving the host application's authenticated fetch boundary.

## GitHub boundary

The current project validates and parses GitHub pull-request URLs so workflow plans can identify an intended source. It does not call the GitHub API. A production module would use an approved Backstage integration or credentials provider and request only the scopes needed to read pull-request metadata.

## Extension work

1. Add durable database storage through the Backstage database service.
2. Add permission checks for workflow creation and approval.
3. Add an authorized GitHub reader.
4. Add a provider interface for approved LLM deployments.
5. Persist prompt metadata, approval, output hashes and evaluation results without storing secrets.
