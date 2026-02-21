import { Request, Response } from "express";
import { RegionModel } from "../models";
import { cache } from "../config/redis";
import { logger } from "../utils/logger";
import { NotFoundError } from "../utils/errors";

export class RegionsController {
  /**
   * Get all regions
   * GET /api/v1/regions
   */
  static async getAll(_req: Request, res: Response): Promise<void> {
    const cacheKey = "regions:all";

    // Try cache first
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug("Regions retrieved from cache");
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    // Get from database
    const regions = await RegionModel.findAll();

    // Cache for 1 hour (regions don't change often)
    await cache.set(cacheKey, regions, 3600);

    res.json({
      success: true,
      data: regions,
      meta: { source: "database", count: regions.length },
    });
  }

  /**
   * Get region by ID
   * GET /api/v1/regions/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const cacheKey = `region:${id}`;

    // Try cache first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const region = await RegionModel.findById(Number(id));

    if (!region) {
      throw new NotFoundError("Region");
    }

    // Cache for 1 hour
    await cache.set(cacheKey, region, 3600);

    res.json({
      success: true,
      data: region,
      meta: { source: "database" },
    });
  }

  /**
   * Get region by code
   * GET /api/v1/regions/code/:code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    const { code } = req.params;
    const regionCode = Array.isArray(code) ? code[0] : code;
    const cacheKey = `region:code:${regionCode}`;

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const region = await RegionModel.findByCode(regionCode);

    if (!region) {
      throw new NotFoundError("Region");
    }

    await cache.set(cacheKey, region, 3600);

    res.json({
      success: true,
      data: region,
      meta: { source: "database" },
    });
  }

  /**
   * Get region with statistics
   * GET /api/v1/regions/:id/stats
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const cacheKey = `region:${id}:stats`;

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const regionStats = await RegionModel.findByIdWithStats(Number(id));

    if (!regionStats) {
      throw new NotFoundError("Region");
    }

    // Cache stats for 15 minutes
    await cache.set(cacheKey, regionStats, 900);

    res.json({
      success: true,
      data: regionStats,
      meta: { source: "database" },
    });
  }

  /**
   * Create new region (admin only - for future use)
   * POST /api/v1/regions
   */
  static async create(req: Request, res: Response): Promise<void> {
    const region = await RegionModel.create(req.body);

    // Invalidate cache
    await cache.deletePattern("regions:*");

    logger.info("Region created:", { id: region.id, name: region.name });

    res.status(201).json({
      success: true,
      data: region,
      message: "Region created successfully",
    });
  }

  /**
   * Update region (admin only - for future use)
   * PUT /api/v1/regions/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const region = await RegionModel.update(Number(id), req.body);

    if (!region) {
      throw new NotFoundError("Region");
    }

    // Invalidate cache
    await cache.deletePattern("regions:*");
    await cache.delete(`region:${id}`);
    await cache.delete(`region:${id}:stats`);
    if (region.code) {
      await cache.delete(`region:code:${region.code}`);
    }

    logger.info("Region updated:", { id: region.id, name: region.name });

    res.json({
      success: true,
      data: region,
      message: "Region updated successfully",
    });
  }

  /**
   * Delete region (admin only - for future use)
   * DELETE /api/v1/regions/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const deleted = await RegionModel.delete(Number(id));

    if (!deleted) {
      throw new NotFoundError("Region");
    }

    // Invalidate cache
    await cache.deletePattern("regions:*");
    await cache.delete(`region:${id}`);
    await cache.delete(`region:${id}:stats`);

    logger.info("Region deleted:", { id });

    res.json({
      success: true,
      message: "Region deleted successfully",
    });
  }
}
