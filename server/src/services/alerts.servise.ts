import { query } from "../config/database";
import { logger } from "../utils/logger";
import { cache } from "../config/redis";

interface Alert {
  id?: number;
  station_id: number;
  station_name?: string;
  region_name?: string;
  aqi: number;
  parameter: string;
  value: number;
  severity:
    | "moderate"
    | "unhealthy_sensitive"
    | "unhealthy"
    | "very_unhealthy"
    | "hazardous";
  message: string;
  created_at?: Date;
}

export class AlertsService {
  static async checkAlerts(): Promise<Alert[]> {
    try {
      // Get latest measurements with high AQI
      const result = await query(
        `SELECT 
          m.id,
          m.station_id,
          s.name as station_name,
          r.name as region_name,
          m.aqi,
          m.parameter,
          m.value,
          m.measured_at
        FROM measurements m
        JOIN stations s ON s.id = m.station_id
        JOIN regions r ON r.id = s.region_id
        WHERE m.measured_at >= NOW() - INTERVAL '1 hour'
          AND m.aqi >= 100
        ORDER BY m.aqi DESC`
      );

      const alerts: Alert[] = [];

      for (const row of result.rows) {
        const alert = this.createAlert(row);
        if (alert) {
          alerts.push(alert);

          // Store alert in database
          await this.saveAlert(alert);

          logger.warn("Air quality alert", {
            station: row.station_name,
            region: row.region_name,
            aqi: row.aqi,
            severity: alert.severity,
          });
        }
      }

      return alerts;
    } catch (error: any) {
      logger.error("Alerts check error", { error: error.message });
      return [];
    }
  }

  //Create alert object from measurement
  private static createAlert(measurement: any): Alert | null {
    const aqi = measurement.aqi;
    let severity: Alert["severity"];
    let message: string;

    if (aqi >= 301) {
      severity = "hazardous";
      message = `НЕБЕЗПЕЧНО! AQI ${aqi} в ${measurement.station_name}. Залишайтесь вдома!`;
    } else if (aqi >= 201) {
      severity = "very_unhealthy";
      message = `Дуже нездорово! AQI ${aqi} в ${measurement.station_name}. Уникайте виходу на вулицю.`;
    } else if (aqi >= 151) {
      severity = "unhealthy";
      message = `Нездорово! AQI ${aqi} в ${measurement.station_name}. Обмежте активності на відкритому повітрі.`;
    } else if (aqi >= 101) {
      severity = "unhealthy_sensitive";
      message = `Нездорово для чутливих груп. AQI ${aqi} в ${measurement.station_name}.`;
    } else {
      return null;
    }

    return {
      station_id: measurement.station_id,
      station_name: measurement.station_name,
      region_name: measurement.region_name,
      aqi,
      parameter: measurement.parameter,
      value: measurement.value,
      severity,
      message,
    };
  }

  private static async saveAlert(alert: Alert): Promise<void> {
    try {
      // Create alerts table if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
          aqi INTEGER NOT NULL,
          parameter VARCHAR(50) NOT NULL,
          value NUMERIC(10, 2) NOT NULL,
          severity VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          resolved_at TIMESTAMP
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_alerts_station_active 
        ON alerts(station_id, is_active, created_at DESC)
      `);

      // Check if similar alert exists in last hour
      const existing = await query(
        `SELECT id FROM alerts 
         WHERE station_id = $1 
           AND severity = $2 
           AND is_active = true
           AND created_at >= NOW() - INTERVAL '1 hour'
         LIMIT 1`,
        [alert.station_id, alert.severity]
      );

      // Only insert if no similar active alert
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO alerts 
            (station_id, aqi, parameter, value, severity, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            alert.station_id,
            alert.aqi,
            alert.parameter,
            alert.value,
            alert.severity,
            alert.message,
          ]
        );
      }
    } catch (error: any) {
      logger.error("Save alert error", { error: error.message });
    }
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    try {
      const cacheKey = "alerts:active";

      const cached = await cache.get<Alert[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await query(
        `SELECT 
          a.*,
          s.name as station_name,
          r.name as region_name
        FROM alerts a
        JOIN stations s ON s.id = a.station_id
        JOIN regions r ON r.id = s.region_id
        WHERE a.is_active = true
          AND a.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY a.aqi DESC, a.created_at DESC`
      );

      await cache.set(cacheKey, result.rows, 300); // 5 min cache

      return result.rows;
    } catch (error: any) {
      logger.error("Get active alerts error", { error: error.message });
      return [];
    }
  }

  //Resolve alerts when AQI improves

  static async resolveAlerts(): Promise<void> {
    try {
      await query(`
        UPDATE alerts a
        SET is_active = false, resolved_at = NOW()
        WHERE a.is_active = true
          AND EXISTS (
            SELECT 1 FROM measurements m
            WHERE m.station_id = a.station_id
              AND m.measured_at >= NOW() - INTERVAL '1 hour'
              AND m.aqi < 100
          )
      `);
    } catch (error: any) {
      logger.error("Resolve alerts error", { error: error.message });
    }
  }

  static async getAlertStats(): Promise<any> {
    try {
      const result = await query(`
        SELECT 
          severity,
          COUNT(*) as count,
          AVG(aqi) as avg_aqi,
          MAX(aqi) as max_aqi
        FROM alerts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY severity
        ORDER BY 
          CASE severity
            WHEN 'hazardous' THEN 1
            WHEN 'very_unhealthy' THEN 2
            WHEN 'unhealthy' THEN 3
            WHEN 'unhealthy_sensitive' THEN 4
            ELSE 5
          END
      `);

      return result.rows;
    } catch (error: any) {
      logger.error("Alert stats error", { error: error.message });
      return [];
    }
  }
}
