import { Request, Response } from "express";
import { query } from "../config/database";

export class ExportController {
  //Export measurements as CSV
  static async exportCSV(req: Request, res: Response): Promise<void> {
    const { station_id, parameter, days = "7" } = req.query;

    if (!station_id) {
      res.status(400).json({
        success: false,
        error: "station_id is required",
      });
      return;
    }

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    let sql = `
      SELECT 
        m.measured_at,
        s.name as station_name,
        r.name as region_name,
        m.parameter,
        m.value,
        m.unit,
        m.aqi,
        m.source
      FROM measurements m
      JOIN stations s ON s.id = m.station_id
      JOIN regions r ON r.id = s.region_id
      WHERE m.station_id = $1
        AND m.measured_at >= $2
    `;

    const params: any[] = [station_id, startDate];

    if (parameter) {
      sql += ` AND m.parameter = $3`;
      params.push(parameter);
    }

    sql += ` ORDER BY m.measured_at DESC`;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "No data found",
      });
      return;
    }

    // Generate CSV
    const headers = [
      "timestamp",
      "station",
      "region",
      "parameter",
      "value",
      "unit",
      "aqi",
      "source",
    ];

    const csvRows = [headers.join(",")];

    for (const row of result.rows) {
      const values = [
        row.measured_at,
        `"${row.station_name}"`,
        `"${row.region_name}"`,
        row.parameter,
        row.value,
        row.unit,
        row.aqi || "",
        row.source,
      ];
      csvRows.push(values.join(","));
    }

    const csv = csvRows.join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=air-quality-${station_id}-${days}days.csv`
    );

    res.send(csv);
  }

  //Export station report as JSON
  static async exportStationReport(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { days = "30" } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get station info
    const stationResult = await query(
      `SELECT s.*, r.name as region_name, r.name_ua as region_name_ua
       FROM stations s
       JOIN regions r ON r.id = s.region_id
       WHERE s.id = $1`,
      [id]
    );

    if (stationResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: "Station not found",
      });
      return;
    }

    const station = stationResult.rows[0];

    // Get statistics
    const statsResult = await query(
      `SELECT 
        parameter,
        COUNT(*) as measurements_count,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        AVG(aqi) as avg_aqi,
        MIN(aqi) as min_aqi,
        MAX(aqi) as max_aqi
      FROM measurements
      WHERE station_id = $1
        AND measured_at >= $2
      GROUP BY parameter`,
      [id, startDate]
    );

    // Get daily averages
    const dailyResult = await query(
      `SELECT 
        DATE(measured_at) as date,
        parameter,
        AVG(value) as avg_value,
        AVG(aqi) as avg_aqi
      FROM measurements
      WHERE station_id = $1
        AND measured_at >= $2
      GROUP BY DATE(measured_at), parameter
      ORDER BY date DESC`,
      [id, startDate]
    );

    const report = {
      station: {
        id: station.id,
        name: station.name,
        region: station.region_name,
        region_ua: station.region_name_ua,
        coordinates: {
          latitude: parseFloat(station.latitude),
          longitude: parseFloat(station.longitude),
        },
        source: station.source,
      },
      period: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days: daysNum,
      },
      statistics: statsResult.rows,
      daily_data: dailyResult.rows,
      generated_at: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=station-${id}-report.json`
    );

    res.json(report);
  }

  //Export regional comparison as JSON
  static async exportRegionalComparison(
    req: Request,
    res: Response
  ): Promise<void> {
    const { parameter = "pm25", days = "7" } = req.query;

    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const result = await query(
      `SELECT 
        r.id,
        r.name,
        r.name_ua,
        r.code,
        COUNT(DISTINCT s.id) as stations_count,
        COUNT(m.id) as measurements_count,
        AVG(m.value) as avg_value,
        MIN(m.value) as min_value,
        MAX(m.value) as max_value,
        AVG(m.aqi) as avg_aqi
      FROM regions r
      LEFT JOIN stations s ON s.region_id = r.id AND s.is_active = true
      LEFT JOIN measurements m ON m.station_id = s.id 
        AND m.parameter = $1
        AND m.measured_at >= $2
      GROUP BY r.id, r.name, r.name_ua, r.code
      HAVING COUNT(m.id) > 0
      ORDER BY avg_aqi DESC NULLS LAST`,
      [parameter, startDate]
    );

    const comparison = {
      parameter,
      period: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days: daysNum,
      },
      regions: result.rows,
      generated_at: new Date().toISOString(),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=regional-comparison-${parameter}.json`
    );

    res.json(comparison);
  }
}
