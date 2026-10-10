/**
 * Express Application Setup
 * 
 * Configures middleware, routes, and error handling for the Email Threads API.
 * Supports both InMemoryRepository (default, for testing/dev) and
 * PrismaThreadRepository (for production, when DATABASE_URL is set).
 */

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { InMemoryThreadRepository, PrismaThreadRepository, ThreadRepository } from "./repositories";
import { ThreadService } from "./services/thread.service";
import { ThreadController } from "./controllers/thread.controller";
import { createThreadRoutes } from "./routes/thread.routes";
import { createAuthMiddleware, setAuthMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { setupSwagger } from "./config/swagger.config";

// Load environment variables
dotenv.config();

/**
 * Create and configure the Express application.
 * 
 * Repository selection:
 * - If DATABASE_URL is set, uses PrismaThreadRepository (PostgreSQL)
 * - Otherwise, uses InMemoryThreadRepository (for testing/development)
 */
export async function createApp(): Promise<Application> {
  const app: Application = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Logging
  app.use(morgan("dev"));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize repository based on environment
  let repo: ThreadRepository;
  let prismaClient: any = null;

  if (process.env.DATABASE_URL) {
    console.log("Using PrismaThreadRepository (PostgreSQL)");
    const { PrismaClient } = await import("@prisma/client");
    prismaClient = new PrismaClient();
    await prismaClient.$connect();
    repo = new PrismaThreadRepository(prismaClient);
  } else {
    console.log("Using InMemoryThreadRepository (development/testing)");
    console.log("Set DATABASE_URL to enable PostgreSQL persistence");
    repo = new InMemoryThreadRepository();
  }

  // Initialize service and controller
  const threadService = new ThreadService({ repo });
  const threadController = new ThreadController(threadService);

  // Setup auth middleware
  const authMiddleware = createAuthMiddleware(repo);
  setAuthMiddleware(authMiddleware);

  // Setup Swagger
  setupSwagger(app);

  // API routes
  app.use("/api/v1", createThreadRoutes(threadController));

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      repository: process.env.DATABASE_URL ? "prisma-postgresql" : "in-memory",
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use(notFoundMiddleware);

  // Global error handler
  app.use(errorMiddleware);

  // Graceful shutdown for Prisma
  if (prismaClient) {
    process.on("SIGTERM", async () => {
      await prismaClient.$disconnect();
      process.exit(0);
    });
    process.on("SIGINT", async () => {
      await prismaClient.$disconnect();
      process.exit(0);
    });
  }

  return app;
}
