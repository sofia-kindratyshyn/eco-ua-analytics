import { query } from "../config/database";
import { Station, CreateStationDto } from "../types";

export class StationModel {
  /**
   * Get all stations
   */
  static async findAll(filters?: {
    region_id?: number;
    is_active?: boolean;
    source?: string;
  }): Promise<Station[]> {
    let sql = `SELECT * FROM stations WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.region_id) {
      sql += ` AND region_id = $${paramCount++}`;
      params.push(filters.region_id);
    }

    if (filters?.is_active !== undefined) {
      sql += ` AND is_active = $${paramCount++}`;
      params.push(filters.is_active);
    }

    if (filters?.source) {
      sql += ` AND source = $${paramCount++}`;
      params.push(filters.source);
    }

    sql += ` ORDER BY name`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get station by ID
   */
  static async findById(id: number): Promise<Station | null> {
    const result = await query(`SELECT * FROM stations WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get station by external ID
   */
  static async findByExternalId(
    externalId: string,
    source: string
  ): Promise<Station | null> {
    const result = await query(
      `SELECT * FROM stations WHERE external_id = $1 AND source = $2`,
      [externalId, source]
    );
    return result.rows[0] || null;
  }

  /**
   * Get stations by region
   */
  static async findByRegion(regionId: number): Promise<Station[]> {
    const result = await query(
      `SELECT * FROM stations WHERE region_id = $1 AND is_active = true ORDER BY name`,
      [regionId]
    );
    return result.rows;
  }

  /**
   * Create new station
   */
  static async create(data: CreateStationDto): Promise<Station> {
    const result = await query(
      `INSERT INTO stations 
       (external_id, name, region_id, latitude, longitude, source, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.external_id,
        data.name,
        data.region_id,
        data.latitude,
        data.longitude,
        data.source,
        data.is_active ?? true,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update station
   */
  static async update(
    id: number,
    data: Partial<CreateStationDto>
  ): Promise<Station | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.region_id !== undefined) {
      fields.push(`region_id = $${paramCount++}`);
      values.push(data.region_id);
    }
    if (data.latitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push(`longitude = $${paramCount++}`);
      values.push(data.longitude);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.metadata !== undefined) {
      fields.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE stations SET ${fields.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete station
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM stations WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Upsert station (insert or update based on external_id and source)
   */
  static async upsert(data: CreateStationDto): Promise<Station> {
    if (!data.external_id) {
      return this.create(data);
    }

    const existing = await this.findByExternalId(data.external_id, data.source);
    if (existing) {
      return (await this.update(existing.id, data))!;
    }
    return this.create(data);
  }

  /**
   * Get station with latest measurement
   */
  static async findByIdWithLatestMeasurement(id: number): Promise<any> {
    const result = await query(
      `SELECT 
        s.*,
        m.measured_at as last_measured_at,
        json_agg(
          json_build_object(
            'parameter', m.parameter,
            'value', m.value,
            'unit', m.unit,
            'aqi', m.aqi
          )
        ) FILTER (WHERE m.id IS NOT NULL) as latest_measurements
       FROM stations s
       LEFT JOIN LATERAL (
         SELECT DISTINCT ON (parameter) *
         FROM measurements
         WHERE station_id = s.id
         ORDER BY parameter, measured_at DESC
       ) m ON true
       WHERE s.id = $1
       GROUP BY s.id, m.measured_at`,
      [id]
    );
    return result.rows[0] || null;
  }
}
