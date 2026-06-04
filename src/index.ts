import express from 'express';
import swaggerUi from 'swagger-ui-express';
import threadsRouter from './routes/threads';

export const app = express();
app.use(express.json());

/**
 * OpenAPI 3.0 specification for the Email Threads API.
 * This is the canonical documentation contract — paths, headers,
 * response shapes, and error codes must match the implementation.
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Email Threads API — warpSpeed',
    version: '1.0.0',
    description:
      'Thread-first email API that groups messages into conversations. ' +
      'Supports Gmail, Outlook, and IMAP sync with draft recency, ' +
      'search/filter grouping, and proper access control.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Development' }],
  paths: {
    '/api/threads': {
      get: {
        summary: 'List email threads for the authenticated user',
        parameters: [
          {
            in: 'header',
            name: 'x-user-id',
            required: true,
            schema: { type: 'string' },
            description: 'Authenticated user ID (from warpSpeed session)',
          },
          {
            in: 'query',
            name: 'search',
            required: false,
            schema: { type: 'string' },
            description: 'Search across subject, body, and participants',
          },
          {
            in: 'query',
            name: 'folder',
            required: false,
            schema: { type: 'string', enum: ['inbox', 'drafts', 'archived', 'deleted', 'all'], default: 'inbox' },
            description: 'Filter by folder',
          },
          {
            in: 'query',
            name: 'page',
            required: false,
            schema: { type: 'integer', default: 1 },
          },
          {
            in: 'query',
            name: 'limit',
            required: false,
            schema: { type: 'integer', default: 20, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of threads with latest message preview',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    threads: { type: 'array', items: { $ref: '#/components/schemas/ThreadSummary' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/threads/{id}': {
      get: {
        summary: 'Get a single thread with all messages',
        parameters: [
          { in: 'header', name: 'x-user-id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Thread with messages' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
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
                required: ['body'],
                properties: {
                  body: { type: 'string', description: 'Draft body text' },
                  subject: { type: 'string', description: 'Optional subject override' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Draft created' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/threads/{id}/drafts/{draftId}/send': {
      post: {
        summary: 'Send a draft (convert to sent message)',
        parameters: [
          { in: 'header', name: 'x-user-id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'draftId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Draft sent' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/threads/provider/sync': {
      post: {
        summary: 'Import a message from Gmail/Outlook/IMAP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerId', 'subject', 'body', 'senderEmail', 'receivedAt', 'provider'],
                properties: {
                  providerId: { type: 'string' },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                  senderEmail: { type: 'string' },
                  senderName: { type: 'string' },
                  receivedAt: { type: 'string', format: 'date-time' },
                  provider: { type: 'string', enum: ['gmail', 'outlook', 'imap'] },
                  threadId: { type: 'string' },
                  inReplyTo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Message imported and threaded' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    schemas: {
      ThreadSummary: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          subject: { type: 'string' },
          lastActivity: { type: 'string', format: 'date-time' },
          isArchived: { type: 'boolean' },
          isDeleted: { type: 'boolean' },
          messageCount: { type: 'integer' },
          latestMessage: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              body: { type: 'string' },
              senderId: { type: 'string' },
              isDraft: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid authentication',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Invalid input',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
};

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/api/threads', threadsRouter);

// Start server (only when run directly, not during tests)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Email Threads API running on http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  });
}
