/**
 * Swagger/OpenAPI Configuration
 * 
 * OpenAPI 3.0 specification setup for the Email Threads API.
 */

import swaggerJsdoc from "swagger-jsdoc";
import { Application } from "express";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Email Threads API",
      version: "1.0.0",
      description:
        "A thread-first Email Threads API for listing, opening, searching, and managing email conversation threads.",
      contact: {
        name: "BHOS-AF",
        url: "https://github.com/bhos/open-bounties/issues/4",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        EmailAddress: {
          type: "object",
          properties: {
            local: { type: "string" },
            domain: { type: "string" },
            name: { type: "string", nullable: true },
          },
          required: ["local", "domain"],
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            threadId: { type: "string" },
            from: { $ref: "#/components/schemas/EmailAddress" },
            subject: { type: "string" },
            body: { type: "string" },
            recipients: {
              type: "object",
              properties: {
                to: { type: "array", items: { $ref: "#/components/schemas/EmailAddress" } },
                cc: { type: "array", items: { $ref: "#/components/schemas/EmailAddress" } },
                bcc: { type: "array", items: { $ref: "#/components/schemas/EmailAddress" } },
              },
            },
            authorId: { type: "string" },
            isDraft: { type: "boolean" },
            createdAt: { type: "integer" },
            updatedAt: { type: "integer" },
          },
          required: ["id", "threadId", "from", "subject", "body", "recipients", "authorId", "isDraft"],
        },
        ThreadSummary: {
          type: "object",
          properties: {
            id: { type: "string" },
            subject: { type: "string" },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/EmailAddress" },
            },
            lastActivityAt: { type: "integer" },
            messageCount: { type: "integer" },
            draftCount: { type: "integer" },
            snippet: { type: "string" },
            hasOwnDraft: { type: "boolean" },
            matchedMessageIds: {
              type: "array",
              items: { type: "string" },
              nullable: true,
            },
          },
          required: ["id", "subject", "participants", "lastActivityAt", "messageCount", "draftCount", "snippet", "hasOwnDraft"],
        },
        ThreadDetail: {
          allOf: [
            {
              type: "object",
              properties: {
                id: { type: "string" },
                subject: { type: "string" },
                participantIds: { type: "array", items: { type: "string" } },
                participants: {
                  type: "array",
                  items: { $ref: "#/components/schemas/EmailAddress" },
                },
                lastActivityAt: { type: "integer" },
                messageCount: { type: "integer" },
                draftCount: { type: "integer" },
                createdAt: { type: "integer" },
              },
            },
            {
              type: "object",
              properties: {
                messages: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Message" },
                },
              },
              required: ["messages"],
            },
          ],
        },
      },
      responses: {
        Unauthorized: {
          description: "Authentication required or token invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        Forbidden: {
          description: "Access denied",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/controllers/*.ts", "./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger docs available at /api-docs");
}
