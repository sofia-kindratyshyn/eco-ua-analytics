import { Request, Response } from "express";
import { pool } from "../config/database";
import { redisClient } from "../config/redis";
import { env } from "../config/env";

export class HealthController {
  /**
   * Basic health check
   * GET /health
   */
  static async healthCheck(_req: Request, res: Response) {
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  }

  /**
   * Detailed health check with dependencies
   * GET /health/detailed
   */
  static async detailedHealthCheck(_req: Request, res: Response) {
    const health: any = {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      services: {},
    };

    // Check Database
    try {
      const dbResult = await pool.query("SELECT NOW()");
      health.services.database = {
        status: "healthy",
        responseTime: "connected",
        timestamp: dbResult.rows[0].now,
      };
    } catch (error) {
      health.success = false;
      health.status = "degraded";
      health.services.database = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Check Redis
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        health.services.redis = {
          status: "healthy",
          connected: true,
        };
      } else {
        health.services.redis = {
          status: "disconnected",
          connected: false,
        };
      }
    } catch (error) {
      health.services.redis = {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    health.memory = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  }

  /**
   * Readiness check (for Kubernetes/Docker)
   * GET /health/ready
   */
  static async readinessCheck(_req: Request, res: Response) {
    try {
      // Check if database is accessible
      await pool.query("SELECT 1");

      res.json({
        success: true,
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        ready: false,
        error: error instanceof Error ? error.message : "Service not ready",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Liveness check (for Kubernetes/Docker)
   * GET /health/live
   */
  static async livenessCheck(_req: Request, res: Response) {
    res.json({
      success: true,
      alive: true,
      timestamp: new Date().toISOString(),
    });
  }
}
