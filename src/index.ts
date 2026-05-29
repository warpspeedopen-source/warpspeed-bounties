import express from 'express';
import swaggerUi from 'swagger-ui-express';
import threadsRouter from './routes/threads';

export const app = express();
app.use(express.json());

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Email Threads API',
    version: '1.0.0',
    description: 'Thread-first Email Threads API for warpSpeed app',
  },
  paths: {
    '/api/threads': {
      get: {
        summary: 'List email threads',
        parameters: [
          { in: 'header', name: 'x-user-id', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'search', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Success' },
        },
      },
    },
    '/api/threads/{id}': {
      get: {
        summary: 'Get a specific thread by ID',
        parameters: [
          { in: 'header', name: 'x-user-id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Success' },
        },
      },
    },
    '/api/threads/{id}/drafts': {
      post: {
        summary: 'Create a draft in a thread',
        parameters: [
          { in: 'header', name: 'x-user-id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { body: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/threads', threadsRouter);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
