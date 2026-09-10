# Backstage AI Workflow Capabilities

Full-stack Backstage plugin packages for governed AI-assisted developer workflows. The React frontend lets an engineer select an allowlisted workflow, provide a Backstage entity reference and optional GitHub pull-request URL, and request a review plan. The TypeScript backend validates the request and returns deterministic steps with risk and approval metadata.

This is an independent portfolio project. It is not connected to an employer or customer, does not use internal data and does not claim deployment to an enterprise Backstage portal.

## What it demonstrates

- TypeScript monorepo with shared contracts, frontend plugin and backend plugin packages.
- React page registered through Backstage `createPlugin` and `createRoutableExtension`.
- Backstage API client using `DiscoveryApi` and `FetchApi`.
- Backend registered through `createBackendPlugin`, `coreServices.httpRouter` and `coreServices.logger`.
- REST routes for workflow discovery, run creation and run lookup.
- Allowlisted workflows, Backstage entity-reference validation, prompt limits, credential-pattern checks and human-approval states.
- Optional GitHub pull-request URL validation and parsing without claiming GitHub API access.
- 23 automated tests across shared policy, backend routes, API client and React behavior.
- Docker, Kubernetes/Helm, Azure Bicep and GitHub Actions assets.
- Documentation for architecture, Backstage installation, AI-assisted development and contribution workflow.

## Packages

```text
packages/ai-workflow-common/       Shared contracts and policy
plugins/ai-workflows/              React Backstage frontend plugin
plugins/ai-workflows-backend/      Backstage backend plugin and REST router
deploy/helm/                       Kubernetes Helm chart
deploy/azure/                      Azure Container Apps Bicep
docs/                              Architecture and working agreements
```

## Local verification

Use Node 22 or 24 and pnpm:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm audit --audit-level=moderate
pnpm check
```

Start the standalone validation host after the build:

```bash
pnpm start:backend
curl http://127.0.0.1:7007/api/ai-workflows/health
```

The standalone host exists for API and deployment validation. Real Backstage installation instructions are in [docs/backstage-integration.md](docs/backstage-integration.md).

## Test inventory

- 8 shared policy tests.
- 8 backend router tests.
- 3 frontend API-client tests.
- 4 React interaction tests.

Total: 23 automated tests.

## Deployment validation

```bash
docker build -t backstage-ai-workflow-capabilities:local .
helm lint deploy/helm/ai-workflow-capabilities
helm template portfolio deploy/helm/ai-workflow-capabilities
```

The Azure Bicep file is a reviewable deployment descriptor, not evidence of a live Azure deployment.

## AI boundary and limitations

- No LLM call is made; the backend creates a deterministic plan for an approved provider integration.
- Run records are in memory and are lost on restart.
- No authentication, permission policy, provider credentials, durable audit store or rate limiting is included.
- GitHub pull-request URLs are validated but the GitHub API is not called.
- The React page uses plain semantic elements so the repository remains focused on plugin architecture rather than a design system.
- A full `pnpm audit` reports two moderate React Router 6 advisories and no high or critical findings. The Backstage frontend API packages require `react-router-dom` 6, while the advisories identify React Router 7.18.0 as the first patched release. The workspace names those two temporary exceptions explicitly, and CI rejects any other moderate-or-higher finding.
- This is not a production deployment or evidence of work in an organization's internal portal.

## Resume-safe description

Built TypeScript/React frontend and backend Backstage plugins for governed AI-assisted developer workflows, using Backstage discovery/fetch APIs, REST validation, GitHub pull-request references, 23 automated tests, GitHub Actions, Docker, Kubernetes/Helm and Azure Bicep deployment assets.
