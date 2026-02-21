import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { corsOptions } from "./middleware/cors";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import routes from "./routes";

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.http(`${req.method} ${req.url}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    });
    next();
  });

  // Rate limiting (all routes except health)
  app.use(apiLimiter);

  app.use(routes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
