import { logger } from "../utils/logger";
import { query } from "../config/database";
import { Measurement, CreateMeasurementDto, Parameter } from "../types";

export class MeasurementModel {
  /**
   * Create new measurement
   */
  static async create(data: CreateMeasurementDto): Promise<Measurement> {
    const result = await query(
      `INSERT INTO measurements 
       (station_id, measured_at, parameter, value, unit, aqi, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.station_id,
        data.measured_at,
        data.parameter,
        data.value,
        data.unit,
        data.aqi,
        data.source,
      ]
    );
    return result.rows[0];
  }

  /**
   * Bulk create measurements
   */
  static async createMany(measurements: CreateMeasurementDto[]): Promise<number> {
    if (!measurements || measurements.length === 0) {
      logger.debug('No measurements to insert');
      return 0;
    }
 
    try {
      // Build VALUES clause: ($1, $2, ...), ($8, $9, ...), ...
      const valuesClauses: string[] = [];
      const params: any[] = [];
      
      measurements.forEach((m, index) => {
        const base = index * 7;
        valuesClauses.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
        );
        
        // Add parameters in order
        params.push(
          m.station_id,
          m.measured_at,
          m.parameter,
          m.value,
          m.unit,
          m.aqi,
          m.source
        );
      });
 
      const sql = `
        INSERT INTO measurements 
          (station_id, measured_at, parameter, value, unit, aqi, source)
        VALUES ${valuesClauses.join(', ')}
        ON CONFLICT (station_id, measured_at, parameter) 
        DO UPDATE SET
          value = EXCLUDED.value,
          aqi = EXCLUDED.aqi,
          unit = EXCLUDED.unit
      `;
 
      logger.debug(`Inserting ${measurements.length} measurements`);
      
      const result = await query(sql, params);
      
      logger.debug(`Inserted/updated ${result.rowCount} measurements`);
      
      return result.rowCount || 0;
      
    } catch (error: any) {
      logger.error('Error creating measurements', { 
        error: error.message,
        count: measurements.length,
        firstMeasurement: measurements[0]
      });
      throw error;
    }
  }

  /**
   * Get measurements with filters
   */
  static async find(filters: {
    station_id?: number;
    region_id?: number;
    parameter?: Parameter;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Measurement[]> {
    let sql = `
      SELECT m.* 
      FROM measurements m
    `;

    const params: any[] = [];
    const conditions: string[] = [];
    let paramCount = 1;

    // Join with stations if region_id filter is present
    if (filters.region_id) {
      sql += ` INNER JOIN stations s ON s.id = m.station_id`;
      conditions.push(`s.region_id = $${paramCount++}`);
      params.push(filters.region_id);
    }

    if (filters.station_id) {
      conditions.push(`m.station_id = $${paramCount++}`);
      params.push(filters.station_id);
    }

    if (filters.parameter) {
      conditions.push(`m.parameter = $${paramCount++}`);
      params.push(filters.parameter);
    }

    if (filters.start_date) {
      conditions.push(`m.measured_at >= $${paramCount++}`);
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push(`m.measured_at <= $${paramCount++}`);
      params.push(filters.end_date);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY m.measured_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get latest measurements for a station
   */
  static async getLatestByStation(
    stationId: number,
    parameter?: Parameter
  ): Promise<Measurement[]> {
    let sql = `
      SELECT DISTINCT ON (parameter) *
      FROM measurements
      WHERE station_id = $1
    `;
    const params: any[] = [stationId];

    if (parameter) {
      sql += ` AND parameter = $2`;
      params.push(parameter);
    }

    sql += ` ORDER BY parameter, measured_at DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get latest measurements for a region
   */
  static async getLatestByRegion(
    regionId: number,
    parameter?: Parameter
  ): Promise<any[]> {
    let sql = `
      SELECT 
        s.id as station_id,
        s.name as station_name,
        s.latitude,
        s.longitude,
        m.parameter,
        m.value,
        m.unit,
        m.aqi,
        m.measured_at
      FROM (
        SELECT DISTINCT ON (station_id, parameter) *
        FROM measurements
        WHERE station_id IN (
          SELECT id FROM stations WHERE region_id = $1 AND is_active = true
        )
    `;

    const params: any[] = [regionId];

    if (parameter) {
      sql += ` AND parameter = $2`;
      params.push(parameter);
    }

    sql += `
        ORDER BY station_id, parameter, measured_at DESC
      ) m
      INNER JOIN stations s ON s.id = m.station_id
      ORDER BY s.name, m.parameter
    `;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get average measurements for time range
   */
  static async getAverages(filters: {
    station_id?: number;
    region_id?: number;
    parameter?: Parameter;
    start_date: Date;
    end_date: Date;
    group_by?: "hour" | "day" | "week" | "month";
  }): Promise<any[]> {
    const groupByClause = filters.group_by || "day";
    const dateGrouping = {
      hour: `date_trunc('hour', m.measured_at)`,
      day: `date_trunc('day', m.measured_at)`,
      week: `date_trunc('week', m.measured_at)`,
      month: `date_trunc('month', m.measured_at)`,
    }[groupByClause];

    let sql = `
      SELECT 
        ${dateGrouping} as time_bucket,
        m.parameter,
        AVG(m.value) as avg_value,
        MIN(m.value) as min_value,
        MAX(m.value) as max_value,
        AVG(m.aqi) as avg_aqi,
        COUNT(*) as measurement_count
      FROM measurements m
    `;

    const params: any[] = [];
    const conditions: string[] = [];
    let paramCount = 1;

    if (filters.region_id) {
      sql += ` INNER JOIN stations s ON s.id = m.station_id`;
      conditions.push(`s.region_id = $${paramCount++}`);
      params.push(filters.region_id);
    }

    if (filters.station_id) {
      conditions.push(`m.station_id = $${paramCount++}`);
      params.push(filters.station_id);
    }

    if (filters.parameter) {
      conditions.push(`m.parameter = $${paramCount++}`);
      params.push(filters.parameter);
    }

    conditions.push(`m.measured_at >= $${paramCount++}`);
    params.push(filters.start_date);

    conditions.push(`m.measured_at <= $${paramCount++}`);
    params.push(filters.end_date);

    sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += ` GROUP BY time_bucket, m.parameter`;
    sql += ` ORDER BY time_bucket DESC, m.parameter`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Delete old measurements (for cleanup)
   */
  static async deleteOlderThan(date: Date): Promise<number> {
    const result = await query(
      `DELETE FROM measurements WHERE measured_at < $1`,
      [date]
    );
    return result.rowCount ?? 0;
  }
}
