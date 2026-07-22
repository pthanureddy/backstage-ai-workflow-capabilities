import express from 'express';
import { createRouter, type PluginLogger } from './router.js';

const logger: PluginLogger = {
  info(message, metadata) {
    console.info(JSON.stringify({ level: 'info', message, ...metadata }));
  },
  warn(message, metadata) {
    console.warn(JSON.stringify({ level: 'warn', message, ...metadata }));
  },
};

const port = Number(process.env.PORT ?? 7007);
const app = express();
app.use('/api/ai-workflows', await createRouter({ logger }));
app.listen(port, '0.0.0.0', () => {
  logger.info('Standalone plugin host started', { port });
});
