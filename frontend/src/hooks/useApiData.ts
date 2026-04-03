import { useState, useEffect } from "react";
import { analyticsApi, alertsApi, stationsApi, regionsApi } from "../services/api";
import type { AlertSeverity, Parameter, TopPollutedStation } from "../types/api";
import type { UIStation, UIAlert } from "../types/ui";

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
      // keep the highest aqi across parameters
      const aqiVal = Math.round(s.avg_aqi ?? 0);
      if (aqiVal > entry.aqi) entry.aqi = aqiVal;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.aqi - a.aqi);
}

export function useStations() {
  const [stations, setStations] = useState<UIStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      analyticsApi.getTopPolluted(100, "pm25"),
      analyticsApi.getTopPolluted(100, "pm10"),
      analyticsApi.getTopPolluted(100, "no2"),
      analyticsApi.getTopPolluted(100, "o3"),
    ])
      .then(([pm25, pm10, no2, o3]) => {
        const merged = mergeStations({ pm25, pm10, no2, o3, co: [], so2: [] });
        if (merged.length > 0) {
          setStations(merged);
          return;
        }
        return Promise.all([stationsApi.getAll({ is_active: true }), regionsApi.getAll()]).then(
          ([raw, regions]) => {
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
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stations, loading, error };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<UIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    alertsApi
      .getActive()
      .then((data) => {
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
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
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
    analyticsApi
      .getOverallStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
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
  pm25: number;
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
    Promise.all([
      stationsApi.getById(numId),
      analyticsApi.getHistory(numId, "pm25", 7),
    ])
      .then(([stationData, historyData]) => {
        setStation(stationData as unknown as StationDetail);
        setHistory(
          historyData.map((h) => ({
            date: h.time,
            aqi: Math.round(h.avg_aqi ?? 0),
            pm25: Math.round((h.avg_value ?? 0) * 10) / 10,
          }))
        );
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { station, history, loading, error };
}

export function getMeasurementValue(
  measurements: LatestMeasurement[] | null | undefined,
  param: Parameter
): number {
  return measurements?.find((m) => m.parameter === param)?.value ?? 0;
}

export function getOverallAqi(
  measurements: LatestMeasurement[] | null | undefined
): number {
  if (!measurements?.length) return 0;
  return Math.round(Math.max(...measurements.map((m) => m.aqi ?? 0)));
}
