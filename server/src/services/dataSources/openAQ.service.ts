import { logger } from "../../utils/logger";
import axios from "axios";

const OPENAQ_API_URL =
  process.env.OPENAQ_API_URL || "https://api.openaq.org/v3";
const OPENAQ_API_KEY = process.env.OPENAQ_API_KEY || "";

interface OpenAQLocation {
  id: number;
  name: string;
  locality: string | null;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  country: {
    id: number;
    code: string;
    name: string;
  };
  sensors: Array<{
    id: number;
    name: string;
    parameter: {
      id: number;
      name: string;
      units: string;
      displayName: string;
    };
  }>;
  datetimeFirst: {
    utc: string;
    local: string;
  };
  datetimeLast: {
    utc: string;
    local: string;
  };
}

interface OpenAQMeasurement {
  value: number;
  parameter: {
    id: number;
    name: string;
    units: string;
  };
  period: {
    label: string;
    datetime_from: {
      utc: string;
      local: string;
    };
    datetime_to: {
      utc: string;
      local: string;
    };
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  summary: {
    min: number;
    q02: number;
    q25: number;
    median: number;
    q75: number;
    q98: number;
    max: number;
    sd: number;
  };
}

interface OpenAQResponse<T> {
  meta: {
    name: string;
    website: string;
    page: number;
    limit: number;
    found: number;
  };
  results: T[];
}

export class OpenAQService {
  private static headers = {
    "X-API-Key": OPENAQ_API_KEY,
  };

  /**
   * Get all locations in Ukraine
   */
  static async getUkraineLocations(): Promise<OpenAQLocation[]> {
    try {
      const url = `${OPENAQ_API_URL}/locations?countries_id=34&limit=100`;
      const response = await axios.get<OpenAQResponse<OpenAQLocation>>(url, {
        headers: this.headers,
      });

      logger.info(
        `OpenAQ: Fetched ${response.data.results.length} locations in Ukraine`
      );
      return response.data.results;
    } catch (error: any) {
      logger.error("OpenAQ: Error fetching Ukraine locations", {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get location by ID
   */
  static async getLocation(locationId: number): Promise<OpenAQLocation | null> {
    try {
      const url = `${OPENAQ_API_URL}/locations/${locationId}`;
      const response = await axios.get<OpenAQResponse<OpenAQLocation>>(url, {
        headers: this.headers,
      });

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error: any) {
      logger.error(`OpenAQ: Error fetching location ${locationId}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get sensors for a location
   */
  static async getLocationSensors(locationId: number): Promise<any[]> {
    try {
      const url = `${OPENAQ_API_URL}/locations/${locationId}/sensors`;
      const response = await axios.get(url, {
        headers: this.headers,
      });

      return response.data.results || [];
    } catch (error: any) {
      logger.error(
        `OpenAQ: Error fetching sensors for location ${locationId}`,
        {
          error: error.message,
        }
      );
      return [];
    }
  }

  /**
   * Get latest measurements for a sensor
   */
  static async getSensorLatest(
    sensorId: number
  ): Promise<OpenAQMeasurement | null> {
    try {
      const url = `${OPENAQ_API_URL}/sensors/${sensorId}/measurements/latest`;
      const response = await axios.get<OpenAQResponse<OpenAQMeasurement>>(url, {
        headers: this.headers,
      });

      if (response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error: any) {
      logger.error(`OpenAQ: Error fetching latest for sensor ${sensorId}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get measurements for a sensor (with date range)
   */
  static async getSensorMeasurements(
    sensorId: number,
    dateFrom?: string,
    dateTo?: string,
    limit: number = 100
  ): Promise<OpenAQMeasurement[]> {
    try {
      let url = `${OPENAQ_API_URL}/sensors/${sensorId}/measurements?limit=${limit}`;

      if (dateFrom) {
        url += `&date_from=${dateFrom}`;
      }
      if (dateTo) {
        url += `&date_to=${dateTo}`;
      }

      const response = await axios.get<OpenAQResponse<OpenAQMeasurement>>(url, {
        headers: this.headers,
      });

      return response.data.results;
    } catch (error: any) {
      logger.error(
        `OpenAQ: Error fetching measurements for sensor ${sensorId}`,
        {
          error: error.message,
        }
      );
      return [];
    }
  }

  /**
   * Parse OpenAQ location to station format
   */
  static parseLocationToStation(location: OpenAQLocation) {
    // Find region by coordinates (approximate)
    const regionId = this.getRegionIdByCoordinates(
      location.coordinates.latitude,
      location.coordinates.longitude
    );

    return {
      external_id: location.id.toString(),
      name: location.name,
      region_id: regionId,
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      source: "openaq" as const,
      is_active: true,
      metadata: {
        timezone: location.timezone,
        locality: location.locality,
        country: location.country,
        sensors: location.sensors.map((s) => ({
          id: s.id,
          parameter: s.parameter.name,
          units: s.parameter.units,
        })),
        datetimeFirst: location.datetimeFirst,
        datetimeLast: location.datetimeLast,
      },
    };
  }

  /**
   * Parse OpenAQ measurement to our format
   */
  static parseMeasurementToOurFormat(
    measurement: OpenAQMeasurement,
    stationId: number
  ) {
    return {
      station_id: stationId,
      measured_at: new Date(measurement.period.datetime_to.utc),
      parameter: measurement.parameter.name,
      value: measurement.value,
      unit: measurement.parameter.units,
      aqi: null, // OpenAQ doesn't provide AQI, calculate separately
      source: "openaq",
    };
  }

  /**
   * Get region ID by coordinates (approximate mapping)
   */
  private static getRegionIdByCoordinates(lat: number, lng: number): number {
    // Kyiv region (approximate)
    if (lat >= 50.0 && lat <= 51.0 && lng >= 30.0 && lng <= 31.0) {
      return 1; // Assuming Kyiv is region ID 1
    }

    // Default to Kyiv region if unsure
    return 1;
  }

  /**
   * Calculate AQI from PM2.5 value (US EPA standard)
   */
  static calculateAQI(pm25: number): number {
    const breakpoints = [
      { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
      { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
      { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
      { cLow: 250.5, cHigh: 500, iLow: 301, iHigh: 500 },
    ];

    for (const bp of breakpoints) {
      if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
        const aqi =
          ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) +
          bp.iLow;
        return Math.round(aqi);
      }
    }

    return 500; // Beyond scale
  }
}
