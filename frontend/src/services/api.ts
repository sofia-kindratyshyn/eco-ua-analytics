import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  ApiResponse,
  Region,
  RegionWithStats,
  Station,
  StationWithMeasurements,
  Measurement,
  HistoryPoint,
  RegionComparison,
  AqiRecommendation,
  OverallStats,
  TopPollutedStation,
  Alert,
  AlertStats,
  AirQualityQueryParams,
  AveragesQueryParams,
  Parameter,
} from "../types/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function handleError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<ApiResponse>;
    const status = axiosErr.response?.status ?? 0;
    const message =
      axiosErr.response?.data?.error ??
      axiosErr.message ??
      "Unknown error";
    throw new ApiError(status, message, axiosErr.response?.data);
  }
  throw err;
}

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const res = await http.get<ApiResponse<T>>(path, { params });
    return res.data.data as T;
  } catch (err) {
    return handleError(err);
  }
}


export const regionsApi = {
  getAll: () => get<Region[]>("/regions"),
  getById: (id: number) => get<RegionWithStats>(`/regions/${id}`),
};


export const stationsApi = {
  getAll: (filters?: { region_id?: number; is_active?: boolean; source?: string }) =>
    get<Station[]>("/stations", filters as Record<string, unknown>),
  getById: (id: number) => get<StationWithMeasurements>(`/stations/${id}`),
  getByRegion: (regionId: number) =>
    get<Station[]>(`/regions/${regionId}/stations`),
};


export const airQualityApi = {
  getMeasurements: (params?: AirQualityQueryParams) =>
    get<Measurement[]>("/air-quality", params as Record<string, unknown>),
  getLatestByStation: (stationId: number, parameter?: Parameter) =>
    get<Measurement[]>(`/stations/${stationId}/air-quality/latest`, {
      parameter,
    }),
  getLatestByRegion: (regionId: number, parameter?: Parameter) =>
    get<Measurement[]>(`/regions/${regionId}/air-quality/latest`, {
      parameter,
    }),
  getAverages: (params: AveragesQueryParams) =>
    get<Measurement[]>("/air-quality/averages", params as unknown as Record<string, unknown>),
  getSummary: () => get<unknown>("/air-quality/summary"),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const analyticsApi = {
  getHistory: (stationId: number, parameter: Parameter, days = 7) =>
    get<HistoryPoint[]>("/analytics/history", {
      station_id: stationId,
      parameter,
      days,
    }),
  compareRegions: (regionIds: number[], parameter: Parameter = "pm25") =>
    get<RegionComparison[]>("/analytics/compare", {
      regions: regionIds.join(","),
      parameter,
    }),
  getRecommendations: (aqi: number) =>
    get<AqiRecommendation>("/analytics/recommendations", { aqi }),
  getOverallStats: () => get<OverallStats>("/analytics/stats"),
  getTopPolluted: (limit = 10, parameter: Parameter = "pm25") =>
    get<TopPollutedStation[]>("/analytics/top-polluted", { limit, parameter }),
};


export const alertsApi = {
  getActive: () => get<Alert[]>("/alerts"),
  getStats: () => get<AlertStats[]>("/alerts/stats"),
};

export default { regionsApi, stationsApi, airQualityApi, analyticsApi, alertsApi };
