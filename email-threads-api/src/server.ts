/**
 * Server Entry Point
 * 
 * Starts the Express application and listens for incoming requests.
 */

import { createApp } from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

async function startServer(): Promise<void> {
  try {
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║          Email Threads API - Server Started               ║
╠══════════════════════════════════════════════════════════╣
║  Environment: ${NODE_ENV.padEnd(42)}║
║  Port:        ${String(PORT).padEnd(42)}║
║  API Base:    http://localhost:${PORT}/api/v1${"".padEnd(19)}║
║  Swagger:     http://localhost:${PORT}/api-docs${"".padEnd(16)}║
║  Health:      http://localhost:${PORT}/health${"".padEnd(18)}║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
