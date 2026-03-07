import { createApp } from "./app";
import { connectRedis, closeRedisConnection } from "./config/redis";
import { logger } from "./utils/logger";
import { AirQualitySyncJob } from "./jobs/airQualitySync.job";
import {
  closeDatabaseConnection,
  testDatabaseConnection,
} from "./config/database";
import cron from "node-cron";
import { AlertsService } from "./services/alerts.servise";
import { AggregationJob } from "./jobs/aggregation.jobs";

const PORT = process.env.PORT || 3000;

let server: any;
const app = createApp();

async function startServer() {
  try {
    logger.info("Starting UA Environment Dashboard API...");

    await testDatabaseConnection();

    try {
      await connectRedis();
    } catch (error) {
      logger.warn("Application will continue without Redis caching");
    }

    AirQualitySyncJob.start();
    AggregationJob.start();

    // Start alerts checking (every 15 minutes)
    cron.schedule("*/15 * * * *", async () => {
      await AlertsService.checkAlerts();
      await AlertsService.resolveAlerts();
    });
    logger.info("Alerts checking started (every 15 minutes)");

    // Cleanup old data daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      await AggregationJob.cleanOldData();
    });
    logger.info("Daily cleanup job scheduled (2:00 AM)");

    server = app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}/api/v1`);
      logger.info("");
      logger.info("Available endpoints:");
      logger.info("   - GET  /api/v1/regions");
      logger.info("   - GET  /api/v1/stations");
      logger.info("   - GET  /api/v1/air-quality");
      logger.info("   - GET  /api/v1/analytics/history");
      logger.info("   - GET  /api/v1/analytics/compare");
      logger.info("   - GET  /api/v1/analytics/recommendations");
      logger.info("   - GET  /api/v1/analytics/stats");
      logger.info("   - GET  /api/v1/analytics/top-polluted");
      logger.info("   - GET  /api/v1/geo/nearby");
      logger.info("   - GET  /api/v1/geo/bounds");
      logger.info("   - GET  /api/v1/geo/overview");
      logger.info("   - GET  /api/v1/export/measurements/csv");
      logger.info("   - GET  /api/v1/export/station-report/:id");
      logger.info("   - GET  /api/v1/export/regional-comparison");
      logger.info("   - GET  /api/v1/alerts");
      logger.info("   - GET  /api/v1/alerts/stats");
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

startServer();
