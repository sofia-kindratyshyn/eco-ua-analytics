import cron from "node-cron";
import { query } from "../config/database";
import { logger } from "../utils/logger";

export class AggregationJob {
  // Start the aggregation job
  static start(): void {
    // Run every hour at minute 5
    cron.schedule("5 * * * *", async () => {
      await this.runAggregation();
    });

    logger.info("📊 Aggregation job started (hourly at :05)");

    // Run immediately on startup
    setTimeout(() => this.runAggregation(), 10000);
  }

  private static async runAggregation(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info("Starting data aggregation...");

      await Promise.all([
        this.aggregateRegionalData(),
        this.aggregateHourlyData(),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Aggregation completed in ${duration}s`);
    } catch (error: any) {
      logger.error("❌ Aggregation failed", { error: error.message });
    }
  }

  private static async aggregateRegionalData(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      const result = await query(
        `INSERT INTO regional_aggregates 
          (region_id, date, parameter, avg_value, min_value, max_value, avg_aqi, measurement_count)
        SELECT 
          s.region_id,
          DATE($1) as date,
          m.parameter,
          AVG(m.value) as avg_value,
          MIN(m.value) as min_value,
          MAX(m.value) as max_value,
          AVG(m.aqi) as avg_aqi,
          COUNT(*) as measurement_count
        FROM measurements m
        JOIN stations s ON s.id = m.station_id
        WHERE m.measured_at >= $1 
          AND m.measured_at < $2
        GROUP BY s.region_id, DATE($1), m.parameter
        ON CONFLICT (region_id, date, parameter) 
        DO UPDATE SET
          avg_value = EXCLUDED.avg_value,
          min_value = EXCLUDED.min_value,
          max_value = EXCLUDED.max_value,
          avg_aqi = EXCLUDED.avg_aqi,
          measurement_count = EXCLUDED.measurement_count,
          updated_at = NOW()`,
        [yesterday, today]
      );

      logger.info(`📊 Regional aggregation: ${result.rowCount} records`);
    } catch (error: any) {
      logger.error("Regional aggregation error", { error: error.message });
    }
  }

  private static async aggregateHourlyData(): Promise<void> {
    try {
      // Create hourly aggregates table if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS hourly_aggregates (
          id SERIAL PRIMARY KEY,
          station_id INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
          hour TIMESTAMP NOT NULL,
          parameter VARCHAR(50) NOT NULL,
          avg_value NUMERIC(10, 2),
          min_value NUMERIC(10, 2),
          max_value NUMERIC(10, 2),
          avg_aqi INTEGER,
          measurement_count INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(station_id, hour, parameter)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_hourly_aggregates_station_hour 
        ON hourly_aggregates(station_id, hour DESC)
      `);

      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1, 0, 0, 0);

      const thisHour = new Date(lastHour);
      thisHour.setHours(thisHour.getHours() + 1);

      // Aggregate last hour
      const result = await query(
        `INSERT INTO hourly_aggregates 
          (station_id, hour, parameter, avg_value, min_value, max_value, avg_aqi, measurement_count)
        SELECT 
          station_id,
          date_trunc('hour', measured_at::timestamp) as hour,
          parameter,
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          AVG(aqi) as avg_aqi,
          COUNT(*) as measurement_count
        FROM measurements
        WHERE measured_at >= $1 
          AND measured_at < $2
        GROUP BY station_id, date_trunc('hour', measured_at::timestamp), parameter
        ON CONFLICT (station_id, hour, parameter) 
        DO UPDATE SET
          avg_value = EXCLUDED.avg_value,
          min_value = EXCLUDED.min_value,
          max_value = EXCLUDED.max_value,
          avg_aqi = EXCLUDED.avg_aqi,
          measurement_count = EXCLUDED.measurement_count,
          updated_at = NOW()`,
        [lastHour, thisHour]
      );

      logger.info(`📊 Hourly aggregation: ${result.rowCount} records`);
    } catch (error: any) {
      logger.error("Hourly aggregation error", { error: error.message });
    }
  }

  static async cleanOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const [regionalResult, hourlyResult] = await Promise.all([
        query("DELETE FROM regional_aggregates WHERE date < $1", [cutoffDate]),
        query("DELETE FROM hourly_aggregates WHERE hour < $1", [cutoffDate]),
      ]);

      logger.info(
        `🗑️ Cleaned old aggregates: ${regionalResult.rowCount} regional, ${hourlyResult.rowCount} hourly`
      );
    } catch (error: any) {
      logger.error("Cleanup error", { error: error.message });
    }
  }
}
