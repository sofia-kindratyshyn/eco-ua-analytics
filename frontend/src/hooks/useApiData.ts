import { useState, useEffect } from "react";
import { analyticsApi, alertsApi, stationsApi, regionsApi, airQualityApi } from "../services/api";
import type { AlertSeverity, Parameter, TopPollutedStation, HistoryPoint } from "../types/api";
import type { UIStation, UIAlert } from "../types/ui";
import { pm25ToAqi } from "../aqi";

function mapSeverity(s: AlertSeverity): "warning" | "danger" | "critical" {
  if (s === "hazardous") return "critical";
  if (s === "very_unhealthy" || s === "unhealthy") return "danger";
  return "warning";
}

function mergeStations(
  byParam: Record<Parameter, TopPollutedStation[]>
): UIStation[] {
  const map = new Map<number, UIStation>();

  for (const [param, list] of Object.entries(byParam) as [Parameter, TopPollutedStation[]][]) {
    for (const s of list) {
      if (!map.has(s.id)) {
        map.set(s.id, {
          id: String(s.id),
          name: s.name,
          city: s.name,
          region: s.region_name,
          lat: parseFloat(s.latitude as unknown as string),
          lng: parseFloat(s.longitude as unknown as string),
          aqi: Math.round(s.avg_aqi ?? 0),
          pm25: 0,
          pm10: 0,
          no2: 0,
          co: 0,
          o3: 0,
          so2: 0,
          lastUpdate: s.last_update,
          trend: "stable",
        });
      }
      const entry = map.get(s.id)!;
      const val = Math.round((s.avg_value ?? 0) * 10) / 10;
      if (param === "pm25") entry.pm25 = val;
      else if (param === "pm10") entry.pm10 = val;
      else if (param === "no2") entry.no2 = val;
      else if (param === "o3") entry.o3 = val;
      else if (param === "so2") entry.so2 = val;
      else if (param === "co") entry.co = val;
      const aqiVal = Math.round(s.avg_aqi ?? 0);
      if (aqiVal > entry.aqi) entry.aqi = aqiVal;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.aqi - a.aqi);
}

const STATIONS_INTERVAL = 60_000;
const ALERTS_INTERVAL = 30_000;
const STATS_INTERVAL = 60_000;
const DETAIL_INTERVAL = 60_000;

export function useStations() {
  const [stations, setStations] = useState<UIStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStations = (isInitial: boolean) => {
      if (isInitial) setLoading(true);

      Promise.all([
        analyticsApi.getTopPolluted(100, "pm25"),
        analyticsApi.getTopPolluted(100, "pm10"),
        analyticsApi.getTopPolluted(100, "no2"),
        analyticsApi.getTopPolluted(100, "o3"),
      ])
        .then(([pm25, pm10, no2, o3]) => {
          const merged = mergeStations({ pm25, pm10, no2, o3, co: [], so2: [] });
          if (merged.length > 0) {
            if (!cancelled) setStations(merged);
            return;
          }
          return Promise.all([stationsApi.getAll({ is_active: true }), regionsApi.getAll()]).then(
            ([raw, regions]) => {
              if (cancelled) return;
              const regionMap = new Map(regions.map((r) => [r.id, r.name]));
              setStations(
                raw.map((s) => ({
                  id: String(s.id),
                  name: s.name,
                  city: s.name,
                  region: regionMap.get(s.region_id) ?? String(s.region_id),
                  lat: parseFloat(s.latitude as unknown as string),
                  lng: parseFloat(s.longitude as unknown as string),
                  aqi: 0,
                  pm25: 0,
                  pm10: 0,
                  no2: 0,
                  co: 0,
                  o3: 0,
                  so2: 0,
                  lastUpdate: s.updated_at,
                  trend: "stable" as const,
                }))
              );
            }
          );
        })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled && isInitial) setLoading(false); });
    };

    fetchStations(true);
    const id = setInterval(() => fetchStations(false), STATIONS_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { stations, loading, error };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<UIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAlerts = (isInitial: boolean) => {
      if (isInitial) setLoading(true);

      alertsApi
        .getActive()
        .then((data) => {
          if (cancelled) return;
          setAlerts(
            data.map((a) => ({
              id: String(a.id ?? Math.random()),
              severity: mapSeverity(a.severity),
              city: a.station_name ?? "Unknown",
              region: a.region_name ?? "",
              message: a.message,
              timestamp: a.created_at ?? new Date().toISOString(),
              aqi: a.aqi,
            }))
          );
        })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled && isInitial) setLoading(false); });
    };

    fetchAlerts(true);
    const id = setInterval(() => fetchAlerts(false), ALERTS_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { alerts, loading, error };
}

export function useOverallStats() {
  const [stats, setStats] = useState<{
    totalRegions: number;
    activeStations: number;
    measurementsLast24h: number;
    latestUpdate: string | null;
    worstAQI: { station_name: string; aqi: number; region_name: string } | null;
    bestAQI: { station_name: string; aqi: number; region_name: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = (isInitial: boolean) => {
      if (isInitial) setLoading(true);

      analyticsApi
        .getOverallStats()
        .then((data) => { if (!cancelled) setStats(data); })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled && isInitial) setLoading(false); });
    };

    fetchStats(true);
    const id = setInterval(() => fetchStats(false), STATS_INTERVAL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { stats, loading, error };
}

interface LatestMeasurement {
  parameter: Parameter;
  value: number;
  unit: string;
  aqi: number | null;
}

export interface StationDetail {
  id: number;
  name: string;
  region_id: number;
  latitude: number;
  longitude: number;
  source: string;
  is_active: boolean;
  last_measured_at: string | null;
  latest_measurements: LatestMeasurement[] | null;
}

export interface HistoryChartPoint {
  date: string;
  aqi: number;
  aqiMin: number;
  aqiMax: number;
  pm25: number;
  pm25Min: number;
  pm25Max: number;
}

// Merges per-parameter history arrays into daily HistoryChartPoints.
// AQI is taken from the backend when non-zero; otherwise computed from PM2.5
// via the EPA formula so we always show a meaningful curve.
function buildHistory(
  pm25H: HistoryPoint[],
  pm10H: HistoryPoint[],
  no2H: HistoryPoint[],
  o3H: HistoryPoint[],
): HistoryChartPoint[] {
  // Index every parameter's points by date string for O(1) lookup
  const byDate = new Map<string, {
    pm25?: HistoryPoint; pm10?: HistoryPoint;
    no2?: HistoryPoint;  o3?: HistoryPoint;
  }>();

  const upsert = (points: HistoryPoint[], key: "pm25" | "pm10" | "no2" | "o3") => {
    for (const p of points) {
      const day = p.time.slice(0, 10); // normalise to YYYY-MM-DD
      const entry = byDate.get(day) ?? {};
      entry[key] = p;
      byDate.set(day, entry);
    }
  };
  upsert(pm25H, "pm25");
  upsert(pm10H, "pm10");
  upsert(no2H,  "no2");
  upsert(o3H,   "o3");

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, pts]) => {
      const pm25Avg = pts.pm25?.avg_value ?? 0;
      const pm25Min = pts.pm25?.min_value ?? pm25Avg;
      const pm25Max = pts.pm25?.max_value ?? pm25Avg;

      // Use backend AQI if the backend provides it (non-zero), otherwise
      // compute it from PM2.5 concentration with the EPA formula.
      const backendAqi = Math.max(
        pts.pm25?.avg_aqi ?? 0,
        pts.pm10?.avg_aqi ?? 0,
        pts.no2?.avg_aqi  ?? 0,
        pts.o3?.avg_aqi   ?? 0,
      );
      const aqi    = backendAqi > 0 ? Math.round(backendAqi) : pm25ToAqi(pm25Avg);
      const aqiMin = backendAqi > 0 ? Math.round(Math.min(
        pts.pm25?.avg_aqi ?? backendAqi,
        pts.pm10?.avg_aqi ?? backendAqi,
        pts.no2?.avg_aqi  ?? backendAqi,
        pts.o3?.avg_aqi   ?? backendAqi,
      )) : pm25ToAqi(pm25Min);
      const aqiMax = backendAqi > 0 ? Math.round(Math.max(
        pts.pm25?.avg_aqi ?? backendAqi,
        pts.pm10?.avg_aqi ?? backendAqi,
        pts.no2?.avg_aqi  ?? backendAqi,
        pts.o3?.avg_aqi   ?? backendAqi,
      )) : pm25ToAqi(pm25Max);

      return {
        date: day,
        aqi,
        aqiMin,
        aqiMax,
        pm25:    Math.round(pm25Avg * 10) / 10,
        pm25Min: Math.round(pm25Min * 10) / 10,
        pm25Max: Math.round(pm25Max * 10) / 10,
      };
    });
}

export function useStationDetail(id: string | undefined) {
  const [station, setStation] = useState<StationDetail | null>(null);
  const [history, setHistory] = useState<HistoryChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    if (isNaN(numId)) {
      setError("Invalid station ID");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDetail = (isInitial: boolean) => {
      if (isInitial) setLoading(true);

      Promise.all([
        stationsApi.getById(numId),
        // Fetch history for four parameters to compute real overall AQI
        analyticsApi.getHistory(numId, "pm25", 7),
        analyticsApi.getHistory(numId, "pm10", 7),
        analyticsApi.getHistory(numId, "no2", 7),
        analyticsApi.getHistory(numId, "o3", 7),
      ])
        .then(async ([stationData, pm25H, pm10H, no2H, o3H]) => {
          if (cancelled) return;
          let detail = stationData as unknown as StationDetail;

          if (!detail.latest_measurements?.length) {
            try {
              const raw = await airQualityApi.getLatestByStation(numId);
              if (!cancelled) {
                detail = {
                  ...detail,
                  latest_measurements: raw.map((m) => ({
                    parameter: m.parameter,
                    value: parseFloat(m.value as unknown as string),
                    unit: m.unit,
                    aqi: m.aqi ?? null,
                  })),
                };
              }
            } catch {
              // keep empty measurements
            }
          }

          if (!cancelled) {
            setStation(detail);
            setHistory(buildHistory(pm25H, pm10H, no2H, o3H));
          }
        })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled && isInitial) setLoading(false); });
    };

    fetchDetail(true);
    const intervalId = setInterval(() => fetchDetail(false), DETAIL_INTERVAL);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [id]);

  return { station, history, loading, error };
}

export function getMeasurementValue(
  measurements: LatestMeasurement[] | null | undefined,
  param: Parameter
): number | null {
  const m = measurements?.find((m) => m.parameter === param);
  return m != null ? m.value : null;
}

export function getOverallAqi(
  measurements: LatestMeasurement[] | null | undefined
): number {
  if (!measurements?.length) return 0;
  const aqis = measurements.map((m) => m.aqi ?? 0).filter((v) => v > 0);
  return aqis.length ? Math.round(Math.max(...aqis)) : 0;
}
