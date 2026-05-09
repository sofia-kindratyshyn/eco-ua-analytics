export type Parameter = "pm25" | "pm10" | "no2" | "co" | "o3" | "so2";
export type StationSource = "saveecobot" | "openaq" | "waqi";
export type AlertSeverity =
  | "moderate"
  | "unhealthy_sensitive"
  | "unhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    count?: number;
    source?: string;
    [key: string]: unknown;
  };
}

export interface Region {
  id: number;
  name: string;
  name_ua: string;
  code: string;
  geometry?: unknown;
  population?: number;
  created_at: string;
  updated_at: string;
}

export interface RegionWithStats extends Region {
  station_count: number;
  measurement_count: number;
}

export interface Station {
  id: number;
  external_id?: string;
  name: string;
  region_id: number;
  latitude: number;
  longitude: number;
  source: StationSource;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StationWithMeasurements extends Station {
  last_measured_at: string | null;
  latest_measurements: Array<{
    parameter: Parameter;
    value: number;
    unit: string;
    aqi: number | null;
  }> | null;
}

export interface Measurement {
  id: number;
  station_id: number;
  measured_at: string;
  parameter: Parameter;
  value: string;
  unit: string;
  aqi?: number | null;
  source: string;
  created_at: string;
}

export interface HistoryPoint {
  time: string;
  parameter: Parameter;
  avg_value: number;
  min_value: number;
  max_value: number;
  avg_aqi: number;
  count: number;
}

export interface RegionComparison {
  region_id: number;
  region_name: string;
  region_name_ua: string;
  avg_value: number | null;
  min_value: number | null;
  max_value: number | null;
  avg_aqi: number | null;
  stations_count: number;
  measurements_count: number;
  last_measurement: string | null;
}

export interface AqiRecommendation {
  aqi: number;
  category: string;
  level: string;
  color: string;
  healthEffects: string;
  recommendations: string[];
}

export interface OverallStats {
  totalRegions: number;
  activeStations: number;
  measurementsLast24h: number;
  latestUpdate: string | null;
  worstAQI: { station_name: string; aqi: number; region_name: string } | null;
  bestAQI: { station_name: string; aqi: number; region_name: string } | null;
}

export interface TopPollutedStation {
  id: number;
  name: string;
  region_name: string;
  region_name_ua: string;
  latitude: number;
  longitude: number;
  avg_value: number;
  avg_aqi: number;
  last_update: string;
}

export interface Alert {
  id?: number;
  station_id: number;
  station_name?: string;
  region_name?: string;
  aqi: number;
  parameter: string;
  value: number;
  severity: AlertSeverity;
  message: string;
  is_active?: boolean;
  created_at?: string;
  resolved_at?: string | null;
}

export interface AlertStats {
  severity: AlertSeverity;
  count: number;
  avg_aqi: number;
  max_aqi: number;
}

export interface AirQualityQueryParams {
  station_id?: number;
  region_id?: number;
  parameter?: Parameter;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface AveragesQueryParams {
  station_id?: number;
  region_id?: number;
  parameter?: Parameter;
  start_date: string;
  end_date: string;
  group_by?: "hour" | "day" | "week" | "month";
}
