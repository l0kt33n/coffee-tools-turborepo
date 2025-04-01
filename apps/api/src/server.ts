import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';

interface MessageParams {
  name: string;
}

export const createServer = (): FastifyInstance => {
  const app = fastify({ logger: { level: 'info' } });

  // Register plugins
  app.register(cors);

  // Define routes
  app.get<{ Params: MessageParams }>('/message/:name', async (request: FastifyRequest<{ Params: MessageParams }>) => {
    const { name } = request.params;
    return { message: `hello ${name}` };
  });

  app.get('/status', async () => {
    return { ok: true };
  });

  return app;
};
