import {
  createApiFactory,
  createPlugin,
  createRouteRef,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { WorkflowClient, workflowApiRef } from './api.js';

export const rootRouteRef = createRouteRef({ id: 'ai-workflows' });

export const aiWorkflowsPlugin = createPlugin({
  id: 'ai-workflows',
  routes: { root: rootRouteRef },
  apis: [
    createApiFactory({
      api: workflowApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) => new WorkflowClient(discoveryApi, fetchApi),
    }),
  ],
});

export const AiWorkflowsPage = aiWorkflowsPlugin.provide(
  createRoutableExtension({
    name: 'AiWorkflowsPage',
    component: () => import('./components/index.js').then(module => module.WorkflowPage),
    mountPoint: rootRouteRef,
  }),
);
