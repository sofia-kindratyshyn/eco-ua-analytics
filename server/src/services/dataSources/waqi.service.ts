import { CreateMeasurementDto } from "@/types";
import { logger } from "../../utils/logger";
import axios from "axios";

const WAQI_API_URL = process.env.WAQI_API_URL || "https://api.waqi.info";
const WAQI_API_KEY = process.env.WAQI_API_KEY || "";

interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    city: {
      geo: [number, number];
      name: string;
      url: string;
    };
    dominentpol: string;
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      co?: { v: number };
      o3?: { v: number };
      so2?: { v: number };
      h?: { v: number };
      t?: { v: number };
      p?: { v: number };
      w?: { v: number };
    };
    time: {
      s: string;
      tz: string;
      v: number;
    };
    forecast?: {
      daily?: {
        pm25?: Array<{ avg: number; day: string; max: number; min: number }>;
        pm10?: Array<{ avg: number; day: string; max: number; min: number }>;
      };
    };
  };
}

interface WAQIMapStation {
  lat: number;
  lon: number;
  uid: number;
  aqi: string;
  station: {
    name: string;
    time: string;
  };
}

interface WAQIMapResponse {
  status: string;
  data: WAQIMapStation[];
}

export class WAQIService {
  /**
   * Get air quality data for a specific city
   */
  static async getCityData(cityName: string): Promise<WAQIResponse | null> {
    try {
      const url = `${WAQI_API_URL}/feed/${cityName}/?token=${WAQI_API_KEY}`;
      const response = await axios.get<WAQIResponse>(url);

      if (response.data.status === "ok") {
        logger.info(`WAQI: Fetched data for ${cityName}`, {
          aqi: response.data.data.aqi,
        });
        return response.data;
      }

      logger.warn(`WAQI: No data for ${cityName}`, {
        status: response.data.status,
      });
      return null;
    } catch (error: any) {
      logger.error(`WAQI: Error fetching ${cityName}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get air quality data by geo coordinates
   */
  static async getByCoordinates(
    lat: number,
    lng: number
  ): Promise<WAQIResponse | null> {
    try {
      const url = `${WAQI_API_URL}/feed/geo:${lat};${lng}/?token=${WAQI_API_KEY}`;
      const response = await axios.get<WAQIResponse>(url);

      if (response.data.status === "ok") {
        logger.info(`WAQI: Fetched data for coordinates ${lat},${lng}`, {
          aqi: response.data.data.aqi,
        });
        return response.data;
      }

      return null;
    } catch (error: any) {
      logger.error(`WAQI: Error fetching coordinates ${lat},${lng}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get all stations within map bounds (Ukraine)
   */
  static async getStationsInBounds(
    latMin: number,
    lngMin: number,
    latMax: number,
    lngMax: number
  ): Promise<WAQIMapStation[]> {
    try {
      const url = `${WAQI_API_URL}/map/bounds/?latlng=${latMin},${lngMin},${latMax},${lngMax}&token=${WAQI_API_KEY}`;
      const response = await axios.get<WAQIMapResponse>(url);

      if (response.data.status === "ok") {
        logger.info(
          `WAQI: Fetched ${response.data.data.length} stations in bounds`
        );
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      logger.error("WAQI: Error fetching stations in bounds", {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get data for all major Ukrainian cities
   */
  static async getUkraineCitiesData(): Promise<Map<string, WAQIResponse>> {
    const cities = [
      "kyiv",
      "lviv",
      "odessa",
      "dnipro",
      "zaporizhzhia",
      "kharkiv",
      "donetsk",
      "kryvyi-rih",
      // "mariupol",
      "vinnytsia",
      "mykolaiv",
      "chernihiv",
      "poltava",
      "sumy",
      "zhytomyr",
      "cherkasy",
      "khmelnytskyi",
      "rivne",
      "ivano-frankivsk",
      "ternopil",
      "lutsk",
      "uzhhorod",
      "chernivtsi",
    ];

    const results = new Map<string, WAQIResponse>();

    for (const city of cities) {
      const data = await this.getCityData(city);
      if (data) {
        results.set(city, data);
      }
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    logger.info(
      `WAQI: Fetched data for ${results.size}/${cities.length} cities`
    );
    return results;
  }

  /**
   * Get Ukraine stations (approximate bounds)
   */
  static async getUkraineStations(): Promise<WAQIMapStation[]> {
    // Ukraine approximate bounds
    const bounds = {
      latMin: 44,
      lngMin: 22,
      latMax: 52,
      lngMax: 40,
    };

    return this.getStationsInBounds(
      bounds.latMin,
      bounds.lngMin,
      bounds.latMax,
      bounds.lngMax
    );
  }

  /**
   * Parse WAQI data to our format
   */
  static parseToMeasurements(data: any, stationId: number): CreateMeasurementDto[] {
    const measurements: CreateMeasurementDto[] = [];
    const timestamp = new Date();
   
    const aqiRaw = data.data.aqi;
    let aqi: number | null = null;
    
    if (typeof aqiRaw === 'number') {
      aqi = aqiRaw;
    } else if (typeof aqiRaw === 'string') {
      const parsed = parseInt(aqiRaw, 10);
      if (!isNaN(parsed)) {
        aqi = parsed;
      }
    }
   
    // PM2.5
    if (data.data.iaqi?.pm25?.v !== undefined) {
      measurements.push({
        station_id: stationId,
        measured_at: timestamp,
        parameter: 'pm25',
        value: data.data.iaqi.pm25.v,
        unit: 'µg/m³',
        aqi: aqi,
        source: 'waqi',
      });
    }
   
    // PM10
    if (data.data.iaqi?.pm10?.v !== undefined) {
      measurements.push({
        station_id: stationId,
        measured_at: timestamp,
        parameter: 'pm10',
        value: data.data.iaqi.pm10.v,
        unit: 'µg/m³',
        aqi: aqi,
        source: 'waqi',
      });
    }
   
    return measurements;
  }
}
