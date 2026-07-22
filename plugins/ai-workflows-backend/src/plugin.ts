import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router.js';

export const aiWorkflowsPlugin = createBackendPlugin({
  pluginId: 'ai-workflows',
  register(environment) {
    environment.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ httpRouter, logger }) {
        httpRouter.use(await createRouter({ logger }));
        httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' });
      },
    });
  },
});
