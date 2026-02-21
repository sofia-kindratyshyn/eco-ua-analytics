import { query } from "../config/database";
import { Region, CreateRegionDto } from "../types";

export class RegionModel {
  /**
   * Get all regions
   */
  static async findAll(): Promise<Region[]> {
    const result = await query(`SELECT * FROM regions ORDER BY name`);
    return result.rows;
  }

  /**
   * Get region by ID
   */
  static async findById(id: number): Promise<Region | null> {
    const result = await query(`SELECT * FROM regions WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get region by code
   */
  static async findByCode(code: string): Promise<Region | null> {
    const result = await query(`SELECT * FROM regions WHERE code = $1`, [code]);
    return result.rows[0] || null;
  }

  /**
   * Create new region
   */
  static async create(data: CreateRegionDto): Promise<Region> {
    const result = await query(
      `INSERT INTO regions (name, name_ua, code, geometry, population)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.name_ua,
        data.code,
        data.geometry ? JSON.stringify(data.geometry) : null,
        data.population,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update region
   */
  static async update(
    id: number,
    data: Partial<CreateRegionDto>
  ): Promise<Region | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.name_ua !== undefined) {
      fields.push(`name_ua = $${paramCount++}`);
      values.push(data.name_ua);
    }
    if (data.code !== undefined) {
      fields.push(`code = $${paramCount++}`);
      values.push(data.code);
    }
    if (data.geometry !== undefined) {
      fields.push(`geometry = $${paramCount++}`);
      values.push(JSON.stringify(data.geometry));
    }
    if (data.population !== undefined) {
      fields.push(`population = $${paramCount++}`);
      values.push(data.population);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE regions SET ${fields.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete region
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query(`DELETE FROM regions WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get region with statistics
   */
  static async findByIdWithStats(id: number): Promise<any> {
    const result = await query(
      `SELECT 
        r.*,
        COUNT(DISTINCT s.id) as station_count,
        COUNT(DISTINCT m.id) as measurement_count
       FROM regions r
       LEFT JOIN stations s ON s.region_id = r.id
       LEFT JOIN measurements m ON m.station_id = s.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );
    return result.rows[0] || null;
  }
}
