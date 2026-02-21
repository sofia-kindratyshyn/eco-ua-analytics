import { createApp } from "./app";
import { connectRedis, closeRedisConnection } from "./config/redis";
import { logger } from "./utils/logger";
import { AirQualitySyncJob } from "./jobs/airQualitySync.job";
import {
  closeDatabaseConnection,
  testDatabaseConnection,
} from "./config/database";

const PORT = process.env.PORT || 3000;

let server: any;
const app = createApp();

async function startServer() {
  try {
    logger.info("🚀 Starting UA Environment Dashboard API...");

    // Connect to database
    await testDatabaseConnection();

    // Connect to Redis
    try {
      await connectRedis();
    } catch (error) {
      logger.warn("⚠️  Application will continue without Redis caching");
    }

    // Start background sync job
    AirQualitySyncJob.start();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`\n${signal} received. Closing server gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed");

      await closeDatabaseConnection();
      await closeRedisConnection();

      logger.info("✅ Graceful shutdown completed");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Start the server
startServer();
