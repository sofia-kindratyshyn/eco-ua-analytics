import { Request, Response } from "express";
import { MeasurementModel } from "../models";
import { cache } from "../config/redis";
import { Parameter } from "../types";
import { logger } from "../utils/logger";

export class AirQualityController {
  /**
   * Get air quality measurements with filters
   * GET /api/v1/air-quality?station_id=1&parameter=pm25&start_date=2024-01-01&limit=100
   */
  static async getMeasurements(req: Request, res: Response): Promise<void> {
    const {
      station_id,
      region_id,
      parameter,
      start_date,
      end_date,
      limit = "100",
      offset = "0",
    } = req.query;

    const filters: any = {
      limit: Math.min(Number(limit), 1000), // Max 1000 records
      offset: Number(offset),
    };

    if (station_id) filters.station_id = Number(station_id);
    if (region_id) filters.region_id = Number(region_id);
    if (parameter) filters.parameter = parameter as Parameter;
    if (start_date) filters.start_date = new Date(start_date as string);
    if (end_date) filters.end_date = new Date(end_date as string);

    const cacheKey = `measurements:${JSON.stringify(filters)}`;

    // Try cache (5 min TTL for measurements)
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: {
          source: "cache",
          count: cached.length,
          limit: filters.limit,
          offset: filters.offset,
        },
      });
      return;
    }

    const measurements = await MeasurementModel.find(filters);

    // Cache for 5 minutes
    await cache.set(cacheKey, measurements, 300);

    res.json({
      success: true,
      data: measurements,
      meta: {
        source: "database",
        count: measurements.length,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  }

  /**
   * Get latest measurements for a station
   * GET /api/v1/stations/:stationId/air-quality/latest
   */
  static async getLatestByStation(req: Request, res: Response): Promise<void> {
    const { stationId } = req.params;
    const { parameter } = req.query;

    const cacheKey = `station:${stationId}:latest:${parameter || "all"}`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const measurements = await MeasurementModel.getLatestByStation(
      Number(stationId),
      parameter as Parameter | undefined
    );

    // Cache for 10 minutes
    await cache.set(cacheKey, measurements, 600);

    res.json({
      success: true,
      data: measurements,
      meta: { source: "database", count: measurements.length },
    });
  }

  /**
   * Get latest measurements for a region
   * GET /api/v1/regions/:regionId/air-quality/latest
   */
  static async getLatestByRegion(req: Request, res: Response): Promise<void> {
    const { regionId } = req.params;
    const { parameter } = req.query;

    const cacheKey = `region:${regionId}:latest:${parameter || "all"}`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const measurements = await MeasurementModel.getLatestByRegion(
      Number(regionId),
      parameter as Parameter | undefined
    );

    // Cache for 10 minutes
    await cache.set(cacheKey, measurements, 600);

    res.json({
      success: true,
      data: measurements,
      meta: { source: "database", count: measurements.length },
    });
  }

  /**
   * Get average measurements over time
   * GET /api/v1/air-quality/averages?region_id=1&parameter=pm25&start_date=2024-01-01&end_date=2024-01-31&group_by=day
   */
  static async getAverages(req: Request, res: Response): Promise<void> {
    const {
      station_id,
      region_id,
      parameter,
      start_date,
      end_date,
      group_by = "day",
    } = req.query;

    if (!start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: "start_date and end_date are required",
      });
      return;
    }

    const filters: any = {
      start_date: new Date(start_date as string),
      end_date: new Date(end_date as string),
      group_by: group_by as "hour" | "day" | "week" | "month",
    };

    if (station_id) filters.station_id = Number(station_id);
    if (region_id) filters.region_id = Number(region_id);
    if (parameter) filters.parameter = parameter as Parameter;

    const cacheKey = `averages:${JSON.stringify(filters)}`;

    // Try cache (15 min TTL)
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const averages = await MeasurementModel.getAverages(filters);

    // Cache for 15 minutes
    await cache.set(cacheKey, averages, 900);

    res.json({
      success: true,
      data: averages,
      meta: {
        source: "database",
        count: averages.length,
        group_by: filters.group_by,
      },
    });
  }

  /**
   * Get current air quality summary for all regions
   * GET /api/v1/air-quality/summary
   */
  static async getSummary(_req: Request, res: Response): Promise<void> {
    const cacheKey = "air-quality:summary";

    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    // This would aggregate data across all regions
    // For now, we'll return a placeholder that you can expand
    const summary = {
      message: "Summary endpoint - implement as needed",
      timestamp: new Date(),
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, summary, 600);

    res.json({
      success: true,
      data: summary,
      meta: { source: "database" },
    });
  }

  /**
   * Create bulk measurements (used by sync jobs)
   * POST /api/v1/air-quality/bulk
   */
  static async createBulk(req: Request, res: Response): Promise<void> {
    const { measurements } = req.body;

    if (!Array.isArray(measurements) || measurements.length === 0) {
      res.status(400).json({
        success: false,
        error: "measurements array is required",
      });
      return;
    }

    const created = await MeasurementModel.createMany(measurements);

    // Invalidate relevant caches
    await cache.deletePattern("measurements:*");
    await cache.deletePattern("station:*:latest*");
    await cache.deletePattern("region:*:latest*");
    await cache.deletePattern("averages:*");

    logger.info("Bulk measurements created:", {
      count: created,
      total: measurements.length,
    });

    res.status(201).json({
      success: true,
      data: { created, total: measurements.length },
      message: `${created} measurements created successfully`,
    });
  }
}
