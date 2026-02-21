import cron from "node-cron";
import { StationModel, MeasurementModel } from "../models";
import { logger } from "../utils/logger";
import { cache } from "../config/redis";
import { WAQIService } from "../services/dataSources/waqi.service";
import { OpenAQService } from "../services/dataSources/openAQ.service";

export class AirQualitySyncJob {
  private static isRunning = false;

  /**
   * Start the sync job (runs every 30 minutes)
   */
  static start(): void {
    const interval = process.env.SYNC_INTERVAL_MINUTES || "30";

    // Run every 30 minutes: */30 * * * *
    cron.schedule(`*/${interval} * * * *`, async () => {
      await this.runSync();
    });

    logger.info(`🕐 Air quality sync job started (every ${interval} minutes)`);

    // Run immediately on startup
    setTimeout(() => this.runSync(), 5000);
  }

  /**
   * Run the sync process
   */
  static async runSync(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Sync already running, skipping...");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info("🔄 Starting air quality data sync...");

      // Sync from both sources
      await Promise.all([this.syncWAQIData(), this.syncOpenAQData()]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Sync completed in ${duration}s`);

      // Invalidate cache
      await this.invalidateCache();
    } catch (error: any) {
      logger.error("❌ Sync failed", { error: error.message });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync data from WAQI
   */
  private static async syncWAQIData(): Promise<void> {
    try {
      logger.info("📡 Syncing WAQI data...");

      const citiesData = await WAQIService.getUkraineCitiesData();
      let totalMeasurements = 0;

      for (const [cityName, data] of citiesData.entries()) {
        // Upsert station
        const station = await StationModel.upsert({
          external_id: data.data.idx.toString(),
          name: data.data.city.name,
          region_id: 1, // TODO: Map to correct region
          latitude: data.data.city.geo[0],
          longitude: data.data.city.geo[1],
          source: "waqi",
          is_active: true,
          metadata: {
            city: cityName,
            url: data.data.city.url,
            dominentpol: data.data.dominentpol,
          },
        });

        // Parse and insert measurements
        const measurements = WAQIService.parseToMeasurements(data, station.id);
        if (measurements.length > 0) {
          const created = await MeasurementModel.createMany(measurements);
          totalMeasurements += created;
        }
      }

      logger.info(
        `✅ WAQI sync: ${citiesData.size} cities, ${totalMeasurements} measurements`
      );
    } catch (error: any) {
      logger.error("WAQI sync error", { error: error.message });
    }
  }

  /**
   * Sync data from OpenAQ
   */
  private static async syncOpenAQData(): Promise<void> {
    try {
      logger.info("📡 Syncing OpenAQ data...");

      const locations = await OpenAQService.getUkraineLocations();
      let totalMeasurements = 0;

      for (const location of locations) {
        // Upsert station
        const stationData = OpenAQService.parseLocationToStation(location);
        const station = await StationModel.upsert(stationData);

        // Get latest measurements for each sensor
        for (const sensor of location.sensors) {
          const latest = await OpenAQService.getSensorLatest(sensor.id);

          if (latest) {
            const measurement = OpenAQService.parseMeasurementToOurFormat(
              latest,
              station.id
            ) as any;

            // Calculate AQI if PM2.5
            if (measurement.parameter === "pm25") {
              measurement.aqi = OpenAQService.calculateAQI(measurement.value);
            }

            const created = await MeasurementModel.createMany([measurement]);
            totalMeasurements += created;
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info(
        `✅ OpenAQ sync: ${locations.length} locations, ${totalMeasurements} measurements`
      );
    } catch (error: any) {
      logger.error("OpenAQ sync error", { error: error.message });
    }
  }

  /**
   * Invalidate relevant caches after sync
   */
  private static async invalidateCache(): Promise<void> {
    try {
      await cache.deletePattern("stations:*");
      await cache.deletePattern("measurements:*");
      await cache.deletePattern("station:*:latest*");
      await cache.deletePattern("region:*:latest*");
      await cache.deletePattern("averages:*");
      await cache.deletePattern("air-quality:*");

      logger.info("🗑️  Cache invalidated");
    } catch (error: any) {
      logger.error("Cache invalidation error", { error: error.message });
    }
  }

  /**
   * Run sync manually (for testing)
   */
  static async runManualSync(): Promise<void> {
    logger.info("🔧 Manual sync triggered");
    await this.runSync();
  }
}
