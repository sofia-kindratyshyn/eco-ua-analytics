import { Request, Response } from "express";
import { query } from "../config/database";
import { cache } from "../config/redis";

export class GeoController {
  static async findNearby(req: Request, res: Response): Promise<void> {
    const { lat, lng, radius = "50" } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        error: "lat and lng parameters are required",
      });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    const cacheKey = `geo:nearby:${lat}:${lng}:${radius}`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    // Haversine formula for distance calculation
    const result = await query(
      `SELECT 
        s.*,
        r.name as region_name,
        r.name_ua as region_name_ua,
        (
          6371 * acos(
            cos(radians($1)) * 
            cos(radians(CAST(s.latitude AS DOUBLE PRECISION))) * 
            cos(radians(CAST(s.longitude AS DOUBLE PRECISION)) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(CAST(s.latitude AS DOUBLE PRECISION)))
          )
        ) AS distance_km
      FROM stations s
      JOIN regions r ON r.id = s.region_id
      WHERE s.is_active = true
        AND (
          6371 * acos(
            cos(radians($1)) * 
            cos(radians(CAST(s.latitude AS DOUBLE PRECISION))) * 
            cos(radians(CAST(s.longitude AS DOUBLE PRECISION)) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(CAST(s.latitude AS DOUBLE PRECISION)))
          )
        ) <= $3
      ORDER BY distance_km ASC
      LIMIT 20`,
      [latitude, longitude, radiusKm]
    );

    await cache.set(cacheKey, result.rows, 1800); // 30 min cache

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        center: { lat: latitude, lng: longitude },
        radius_km: radiusKm,
        found: result.rows.length,
      },
    });
  }

  static async findInBounds(req: Request, res: Response): Promise<void> {
    const { north, south, east, west } = req.query;

    if (!north || !south || !east || !west) {
      res.status(400).json({
        success: false,
        error: "north, south, east, west parameters are required",
      });
      return;
    }

    const cacheKey = `geo:bounds:${north}:${south}:${east}:${west}`;

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const result = await query(
      `SELECT 
        s.*,
        r.name as region_name,
        r.name_ua as region_name_ua,
        (
          SELECT json_agg(json_build_object(
            'parameter', m.parameter,
            'value', m.value,
            'aqi', m.aqi,
            'measured_at', m.measured_at
          ))
          FROM (
            SELECT DISTINCT ON (parameter) *
            FROM measurements
            WHERE station_id = s.id
              AND measured_at >= NOW() - INTERVAL '3 hours'
            ORDER BY parameter, measured_at DESC
          ) m
        ) as latest_measurements
      FROM stations s
      JOIN regions r ON r.id = s.region_id
      WHERE s.is_active = true
        AND CAST(s.latitude AS DOUBLE PRECISION) BETWEEN $2 AND $1
        AND CAST(s.longitude AS DOUBLE PRECISION) BETWEEN $4 AND $3`,
      [north, south, east, west]
    );

    await cache.set(cacheKey, result.rows, 600); // 10 min cache

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        bounds: {
          north: parseFloat(north as string),
          south: parseFloat(south as string),
          east: parseFloat(east as string),
          west: parseFloat(west as string),
        },
        found: result.rows.length,
      },
    });
  }

  static async getOverview(_req: Request, res: Response): Promise<void> {
    const cacheKey = "geo:overview";

    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const result = await query(
      `SELECT 
        s.id,
        s.name,
        s.latitude,
        s.longitude,
        s.source,
        r.name as region_name,
        r.name_ua as region_name_ua,
        r.code as region_code,
        (
          SELECT json_build_object(
            'pm25', MAX(CASE WHEN parameter = 'pm25' THEN value END),
            'pm10', MAX(CASE WHEN parameter = 'pm10' THEN value END),
            'aqi', MAX(aqi),
            'measured_at', MAX(measured_at)
          )
          FROM measurements
          WHERE station_id = s.id
            AND measured_at >= NOW() - INTERVAL '3 hours'
        ) as latest
      FROM stations s
      JOIN regions r ON r.id = s.region_id
      WHERE s.is_active = true
      ORDER BY r.name, s.name`
    );

    await cache.set(cacheKey, result.rows, 300); // 5 min cache

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        total: result.rows.length,
      },
    });
  }
}
