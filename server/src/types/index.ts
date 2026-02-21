// Region Types
export interface Region {
  id: number;
  name: string;
  name_ua: string;
  code: string;
  geometry?: any; // GeoJSON
  population?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRegionDto {
  name: string;
  name_ua: string;
  code: string;
  geometry?: any;
  population?: number;
}

// Station Types
export interface Station {
  id: number;
  external_id?: string;
  name: string;
  region_id: number;
  latitude: number;
  longitude: number;
  source: "saveecobot" | "openaq" | "waqi";
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStationDto {
  external_id?: string;
  name: string;
  region_id: number;
  latitude: number;
  longitude: number;
  source: "saveecobot" | "openaq" | "waqi";
  is_active?: boolean;
  metadata?: Record<string, any>;
}

// Measurement Types
export type Parameter = "pm25" | "pm10" | "no2" | "co" | "o3" | "so2";

export interface Measurement {
  id: number;
  station_id: number;
  measured_at: Date;
  parameter: Parameter;
  value: number;
  unit: string;
  aqi?: number | null;
  source: string;
  created_at: Date;
}

export interface CreateMeasurementDto {
  station_id: number;
  measured_at: Date;
  parameter: Parameter;
  value: number;
  unit: string;
  aqi?: number | null;
  source: string;
}

// Regional Aggregate Types
export interface RegionalAggregate {
  id: number;
  region_id: number;
  date: Date;
  parameter: Parameter;
  avg_value?: number;
  min_value?: number;
  max_value?: number;
  avg_aqi?: number;
  measurement_count?: number;
  created_at: Date;
}

export interface CreateRegionalAggregateDto {
  region_id: number;
  date: Date;
  parameter: Parameter;
  avg_value?: number;
  min_value?: number;
  max_value?: number;
  avg_aqi?: number;
  measurement_count?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface AirQualityQueryParams extends PaginationParams {
  region_id?: number;
  station_id?: number;
  parameter?: Parameter;
  start_date?: string;
  end_date?: string;
}

// External API Response Types
export interface SaveEcoBotStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  pollutants: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    co?: number;
    o3?: number;
  };
  timestamp: string;
}

export interface OpenAQMeasurement {
  locationId: number;
  location: string;
  parameter: string;
  value: number;
  unit: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  date: {
    utc: string;
    local: string;
  };
}

export interface WAQIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    city: {
      name: string;
      geo: [number, number];
    };
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      no2?: { v: number };
      co?: { v: number };
      o3?: { v: number };
    };
    time: {
      s: string;
      tz: string;
    };
  };
}
