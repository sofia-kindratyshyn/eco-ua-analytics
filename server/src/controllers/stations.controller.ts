import { Request, Response } from "express";
import { StationModel } from "../models";
import { cache } from "../config/redis";
import { logger } from "../utils/logger";
import { NotFoundError } from "../utils/errors";

export class StationsController {
  /**
   * Get all stations with optional filters
   * GET /api/v1/stations?region_id=1&is_active=true&source=saveecobot
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    const { region_id, is_active, source } = req.query;

    const filters: any = {};
    if (region_id) filters.region_id = Number(region_id);
    if (is_active !== undefined) filters.is_active = is_active === "true";
    if (source) filters.source = source as string;

    const cacheKey = `stations:${JSON.stringify(filters)}`;

    // Try cache
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache", count: cached.length },
      });
      return;
    }

    const stations = await StationModel.findAll(filters);

    // Cache for 30 minutes
    await cache.set(cacheKey, stations, 1800);

    res.json({
      success: true,
      data: stations,
      meta: { source: "database", count: stations.length },
    });
  }

  /**
   * Get station by ID
   * GET /api/v1/stations/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const cacheKey = `station:${id}`;

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const station = await StationModel.findById(Number(id));

    if (!station) {
      throw new NotFoundError("Station");
    }

    // Cache for 30 minutes
    await cache.set(cacheKey, station, 1800);

    res.json({
      success: true,
      data: station,
      meta: { source: "database" },
    });
  }

  /**
   * Get stations by region
   * GET /api/v1/regions/:regionId/stations
   */
  static async getByRegion(req: Request, res: Response): Promise<void> {
    const { regionId } = req.params;
    const cacheKey = `region:${regionId}:stations`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache", count: cached.length },
      });
      return;
    }

    const stations = await StationModel.findByRegion(Number(regionId));

    // Cache for 30 minutes
    await cache.set(cacheKey, stations, 1800);

    res.json({
      success: true,
      data: stations,
      meta: { source: "database", count: stations.length },
    });
  }

  /**
   * Get station with latest measurements
   * GET /api/v1/stations/:id/latest
   */
  static async getWithLatestMeasurements(
    req: Request,
    res: Response
  ): Promise<void> {
    const { id } = req.params;
    const cacheKey = `station:${id}:latest`;

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const station = await StationModel.findByIdWithLatestMeasurement(
      Number(id)
    );

    if (!station) {
      throw new NotFoundError("Station");
    }

    // Cache for 10 minutes (fresher data)
    await cache.set(cacheKey, station, 600);

    res.json({
      success: true,
      data: station,
      meta: { source: "database" },
    });
  }

  /**
   * Create new station
   * POST /api/v1/stations
   */
  static async create(req: Request, res: Response): Promise<void> {
    const station = await StationModel.create(req.body);

    // Invalidate cache
    await cache.deletePattern("stations:*");
    if (req.body.region_id) {
      await cache.delete(`region:${req.body.region_id}:stations`);
    }

    logger.info("Station created:", { id: station.id, name: station.name });

    res.status(201).json({
      success: true,
      data: station,
      message: "Station created successfully",
    });
  }

  /**
   * Update station
   * PUT /api/v1/stations/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const station = await StationModel.update(Number(id), req.body);

    if (!station) {
      throw new NotFoundError("Station");
    }

    // Invalidate cache
    await cache.deletePattern("stations:*");
    await cache.delete(`station:${id}`);
    await cache.delete(`station:${id}:latest`);
    if (station.region_id) {
      await cache.delete(`region:${station.region_id}:stations`);
    }

    logger.info("Station updated:", { id: station.id, name: station.name });

    res.json({
      success: true,
      data: station,
      message: "Station updated successfully",
    });
  }

  /**
   * Delete station
   * DELETE /api/v1/stations/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Get station first to know region_id
    const station = await StationModel.findById(Number(id));
    if (!station) {
      throw new NotFoundError("Station");
    }

    //const deleted = await StationModel.delete(Number(id));

    // Invalidate cache
    await cache.deletePattern("stations:*");
    await cache.delete(`station:${id}`);
    await cache.delete(`station:${id}:latest`);
    if (station.region_id) {
      await cache.delete(`region:${station.region_id}:stations`);
    }

    logger.info("Station deleted:", { id });

    res.json({
      success: true,
      message: "Station deleted successfully",
    });
  }
}
