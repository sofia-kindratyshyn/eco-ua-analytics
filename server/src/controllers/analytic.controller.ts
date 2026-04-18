import { Request, Response } from "express";
import { query } from "../config/database";
import { cache } from "../config/redis";

export class AnalyticsController {
  static async getHistory(req: Request, res: Response): Promise<void> {
    const { station_id, parameter, days = "7" } = req.query;

    if (!station_id || !parameter) {
      res.status(400).json({
        success: false,
        error: "station_id and parameter are required",
      });
      return;
    }

    const cacheKey = `history:${station_id}:${parameter}:${days}`;

    // Try cache (15 min)
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const result = await query(
      `SELECT 
        date_trunc('hour', measured_at) as time,
        parameter,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        AVG(aqi) as avg_aqi,
        COUNT(*) as count
      FROM measurements
      WHERE station_id = $1 
        AND parameter = $2
        AND measured_at >= $3
      GROUP BY date_trunc('hour', measured_at), parameter
      ORDER BY time ASC`,
      [station_id, parameter, startDate]
    );

    // Cache for 15 minutes
    await cache.set(cacheKey, result.rows, 900);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        station_id,
        parameter,
        days: daysNum,
        points: result.rows.length,
      },
    });
  }

  static async compareRegions(req: Request, res: Response): Promise<void> {
    const { regions, parameter = "pm25" } = req.query;

    if (!regions) {
      res.status(400).json({
        success: false,
        error: "regions parameter is required (comma-separated IDs)",
      });
      return;
    }

    const regionIds = (regions as string).split(",").map(Number);
    const cacheKey = `compare:${regionIds.join("-")}:${parameter}`;

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
        r.id as region_id,
        r.name as region_name,
        r.name_ua as region_name_ua,
        AVG(m.value) as avg_value,
        MIN(m.value) as min_value,
        MAX(m.value) as max_value,
        AVG(m.aqi) as avg_aqi,
        COUNT(DISTINCT s.id) as stations_count,
        COUNT(m.id) as measurements_count,
        MAX(m.measured_at) as last_measurement
      FROM regions r
      LEFT JOIN stations s ON s.region_id = r.id AND s.is_active = true
      LEFT JOIN measurements m ON m.station_id = s.id AND m.parameter = $1
      WHERE r.id = ANY($2)
        AND m.measured_at >= NOW() - INTERVAL '24 hours'
      GROUP BY r.id, r.name, r.name_ua
      ORDER BY avg_aqi DESC NULLS LAST`,
      [parameter, regionIds]
    );

    await cache.set(cacheKey, result.rows, 900);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        regions: regionIds.length,
        parameter,
      },
    });
  }

  static async getRecommendations(req: Request, res: Response): Promise<void> {
    const { aqi } = req.query;

    if (!aqi) {
      res.status(400).json({
        success: false,
        error: "aqi parameter is required",
      });
      return;
    }

    const aqiNum = parseInt(aqi as string);
    let category: string;
    let level: string;
    let color: string;
    let recommendations: string[];
    let healthEffects: string;

    if (aqiNum <= 50) {
      category = "good";
      level = "Відмінно";
      color = "#00e400";
      healthEffects =
        "Якість повітря задовільна, забруднення не становить ризику.";
      recommendations = [
        "Чудовий день для активностей на свіжому повітрі",
        "Всі групи населення можуть насолоджуватись звичайними заняттями",
      ];
    } else if (aqiNum <= 100) {
      category = "moderate";
      level = "Помірно";
      color = "#ffff00";
      healthEffects =
        "Прийнятна якість повітря. Можливий незначний вплив на чутливих людей.";
      recommendations = [
        "Більшість людей можуть займатись звичайними справами",
        "Чутливі особи можуть відчувати легкий дискомфорт",
        "Розгляньте можливість скорочення тривалих або інтенсивних занять на відкритому повітрі",
      ];
    } else if (aqiNum <= 150) {
      category = "unhealthy_sensitive";
      level = "Нездорово для чутливих груп";
      color = "#ff7e00";
      healthEffects = "Чутливі групи можуть відчувати вплив на здоров'я.";
      recommendations = [
        "Діти, літні люди та особи з респіраторними захворюваннями повинні обмежити тривале перебування на відкритому повітрі",
        "Загальна популяція може продовжувати звичайні заняття",
        "Розгляньте перенесення інтенсивних активностей у приміщення",
      ];
    } else if (aqiNum <= 200) {
      category = "unhealthy";
      level = "Нездорово";
      color = "#ff0000";
      healthEffects = "Кожен може почати відчувати вплив на здоров'я.";
      recommendations = [
        "Усім слід скоротити тривалі або інтенсивні фізичні навантаження на відкритому повітрі",
        "Чутливі групи повинні уникати будь-яких активностей на відкритому повітрі",
        "Закрийте вікна та двері",
        "Використовуйте очисники повітря вдома",
      ];
    } else if (aqiNum <= 300) {
      category = "very_unhealthy";
      level = "Дуже нездорово";
      color = "#8f3f97";
      healthEffects =
        "Попередження про вплив на здоров'я. Ризик для всього населення.";
      recommendations = [
        "Уникайте будь-яких фізичних навантажень на відкритому повітрі",
        "Залишайтесь у приміщенні з закритими вікнами",
        "Використовуйте маски N95/FFP2 при необхідності виходу на вулицю",
        "Увімкніть очисники повітря",
        "Чутливі групи повинні залишатись вдома",
      ];
    } else {
      category = "hazardous";
      level = "Небезпечно";
      color = "#7e0023";
      healthEffects = "Надзвичайна ситуація для здоров'я. Вплив на всіх.";
      recommendations = [
        "ЗАЛИШАЙТЕСЬ ВДОМА",
        "Уникайте будь-якої діяльності на відкритому повітрі",
        "Тримайте вікна та двері закритими",
        "Використовуйте очисники повітря на максимальній потужності",
        "Зверніться до лікаря при появі симптомів",
        "Людям з серцевими або легеневими захворюваннями слід негайно звернутись до лікаря",
      ];
    }

    res.json({
      success: true,
      data: {
        aqi: aqiNum,
        category,
        level,
        color,
        healthEffects,
        recommendations,
      },
    });
  }

  static async getOverallStats(_req: Request, res: Response): Promise<void> {
    const cacheKey = "analytics:overall-stats";

    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: cached,
        meta: { source: "cache" },
      });
      return;
    }

    const [
      regionsResult,
      stationsResult,
      measurementsResult,
      latestResult,
      worstResult,
      bestResult,
    ] = await Promise.all([
      // Total regions
      query("SELECT COUNT(*) as count FROM regions"),

      // Active stations
      query("SELECT COUNT(*) as count FROM stations WHERE is_active = true"),

      // Measurements in last 24 hours
      query(
        "SELECT COUNT(*) as count FROM measurements WHERE measured_at >= NOW() - INTERVAL '24 hours'"
      ),

      // Latest measurement time
      query("SELECT MAX(measured_at) as latest FROM measurements"),

      query(`
        SELECT 
          s.name as station_name,
          m.aqi,
          r.name as region_name
        FROM measurements m
        JOIN stations s ON s.id = m.station_id
        JOIN regions r ON r.id = s.region_id
        WHERE m.measured_at >= NOW() - INTERVAL '3 hours'
          AND m.aqi IS NOT NULL
        ORDER BY m.aqi DESC
        LIMIT 1
      `),

      // Best AQI currently
      query(`
        SELECT 
          s.name as station_name,
          m.aqi,
          r.name as region_name
        FROM measurements m
        JOIN stations s ON s.id = m.station_id
        JOIN regions r ON r.id = s.region_id
        WHERE m.measured_at >= NOW() - INTERVAL '3 hours'
          AND m.aqi IS NOT NULL
        ORDER BY m.aqi ASC
        LIMIT 1
      `),
    ]);

    const stats = {
      totalRegions: parseInt(regionsResult.rows[0]?.count || "0"),
      activeStations: parseInt(stationsResult.rows[0]?.count || "0"),
      measurementsLast24h: parseInt(measurementsResult.rows[0]?.count || "0"),
      latestUpdate: latestResult.rows[0]?.latest,
      worstAQI: worstResult.rows[0] || null,
      bestAQI: bestResult.rows[0] || null,
    };

    await cache.set(cacheKey, stats, 300); // 5 min cache

    res.json({
      success: true,
      data: stats,
      meta: { source: "database" },
    });
  }

  static async getTopPolluted(req: Request, res: Response): Promise<void> {
    const { limit = "10", parameter = "pm25" } = req.query;

    const cacheKey = `analytics:top-polluted:${parameter}:${limit}`;

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
        r.name as region_name,
        r.name_ua as region_name_ua,
        s.latitude,
        s.longitude,
        AVG(m.value) as avg_value,
        AVG(m.aqi) as avg_aqi,
        MAX(m.measured_at) as last_update
      FROM stations s
      JOIN regions r ON r.id = s.region_id
      JOIN measurements m ON m.station_id = s.id
      WHERE s.is_active = true
        AND m.parameter = $1
        AND m.measured_at >= NOW() - INTERVAL '24 hours'
      GROUP BY s.id, s.name, r.name, r.name_ua, s.latitude, s.longitude
      ORDER BY avg_aqi DESC NULLS LAST
      LIMIT $2`,
      [parameter, limit]
    );

    await cache.set(cacheKey, result.rows, 300);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        source: "database",
        parameter,
        limit: parseInt(limit as string),
      },
    });
  }
}
