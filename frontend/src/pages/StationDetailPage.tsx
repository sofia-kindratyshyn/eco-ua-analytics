import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Check,
  Download,
  Share2,
  MapPin,
  Clock,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { getAQILevel } from "../aqi";
import { AQIBadge } from "../components/AQIBadge";
import { SEOMeta } from "../components/SEOMeta";
import { useDateLocale } from "../hooks/useDateLocale";
import {
  useStationDetail,
  getMeasurementValue,
  getOverallAqi,
} from "../hooks/useApiData";

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StationDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { station, history, loading, error } = useStationDetail(id);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        {t("station.loading")}
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl mb-4">{error ?? t("station.not_found")}</h1>
        <Link to="/" className="text-primary hover:underline">
          {t("station.return_home")}
        </Link>
      </div>
    );
  }

  const s = station;
  const measurements = s.latest_measurements;
  const aqi = getOverallAqi(measurements);
  const aqiLevel = getAQILevel(aqi);

  const pollutants = [
    {
      name: "PM2.5",
      value: getMeasurementValue(measurements, "pm25"),
      unit: "µg/m³",
      color: "#3b82f6",
    },
    {
      name: "PM10",
      value: getMeasurementValue(measurements, "pm10"),
      unit: "µg/m³",
      color: "#8b5cf6",
    },
    {
      name: "NO₂",
      value: getMeasurementValue(measurements, "no2"),
      unit: "µg/m³",
      color: "#f59e0b",
    },
    {
      name: "CO",
      value: getMeasurementValue(measurements, "co"),
      unit: "ppm",
      color: "#ef4444",
    },
    {
      name: "O₃",
      value: getMeasurementValue(measurements, "o3"),
      unit: "µg/m³",
      color: "#10b981",
    },
    {
      name: "SO₂",
      value: getMeasurementValue(measurements, "so2"),
      unit: "µg/m³",
      color: "#6366f1",
    },
  ];

  function handleExport() {
    const rows: (string | number)[][] = [
      ["Station Report", s.name],
      ["Generated", new Date().toISOString()],
      [],
      ["Station Info"],
      ["ID", s.id],
      ["Source", s.source],
      ["Latitude", s.latitude],
      ["Longitude", s.longitude],
      ["Status", s.is_active ? "Active" : "Inactive"],
      [],
      ["Current Measurements"],
      ["AQI", aqi],
      ["PM2.5 (µg/m³)", getMeasurementValue(measurements, "pm25") ?? ""],
      ["PM10 (µg/m³)", getMeasurementValue(measurements, "pm10") ?? ""],
      ["NO2 (µg/m³)", getMeasurementValue(measurements, "no2") ?? ""],
      ["CO (ppm)", getMeasurementValue(measurements, "co") ?? ""],
      ["O3 (µg/m³)", getMeasurementValue(measurements, "o3") ?? ""],
      ["SO2 (µg/m³)", getMeasurementValue(measurements, "so2") ?? ""],
    ];
    if (history.length > 0) {
      rows.push([], ["7-Day History"], ["Date", "AQI", "PM2.5"]);
      history.forEach((h) => rows.push([h.date, h.aqi, h.pm25]));
    }
    downloadCSV(
      `station-${s.id}-report.csv`,
      rows.map((r) => r.join(",")).join("\n")
    );
  }

  async function handleShare() {
    const url = window.location.href;
    const title = `Air Quality — ${s.name}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOMeta
        title={`${s.name} — ${t("seo.home.title").split(" ")[0]} ${
          t("seo.home.title").split(" ")[1]
        }`}
        description={`${s.name}. AQI: ${aqi > 0 ? aqi : "N/A"} (${
          aqiLevel.label
        }). PM2.5, PM10, NO₂, CO, O₃, SO₂.`}
        path={`/station/${s.id}`}
        schema={{
          "@type": "Dataset",
          name: `Air Quality Data — ${s.name}`,
          description: `Real-time and historical air quality measurements from ${s.name}`,
          url: `https://airquality.ua/station/${s.id}`,
          spatialCoverage: {
            "@type": "Place",
            name: s.name,
            geo: {
              "@type": "GeoCoordinates",
              latitude: s.latitude,
              longitude: s.longitude,
            },
          },
          variableMeasured: ["AQI", "PM2.5", "PM10", "NO2", "CO", "O3", "SO2"],
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("station.back")}
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl mb-2">{s.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {Number(s.latitude).toFixed(4)},{" "}
                  {Number(s.longitude).toFixed(4)}
                </span>
                {s.last_measured_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {t("station.updated")}{" "}
                    {formatDistanceToNow(new Date(s.last_measured_at), {
                      addSuffix: true,
                      locale,
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? t("station.copied") : t("station.share")}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t("station.export")}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            {t("station.aqi_section.title")}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="text-6xl" style={{ fontWeight: 700 }}>
              {aqi > 0 ? aqi : "—"}
            </div>
            {aqi > 0 && <AQIBadge aqi={aqi} size="xl" />}
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>
              {t("station.aqi_section.health_rec")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {aqi > 0
                ? aqiLevel.healthAdvice
                : t("station.aqi_section.no_measurements")}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl mb-4">{t("station.pollutants_title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pollutants.map((p) => (
              <div
                key={p.name}
                className="bg-card rounded-lg border border-border p-4 text-center"
              >
                <div
                  className="text-2xl mb-1"
                  style={{ fontWeight: 600, color: p.color }}
                >
                  {p.value != null ? p.value : "—"}
                </div>
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.unit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl mb-4">{t("station.trend_title")}</h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("station.no_history")}
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={history}>
                  <defs>
                    <linearGradient id="aqiRange" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#2E75B6"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#2E75B6"
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                    <linearGradient id="pm25Range" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#34A853"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="#34A853"
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--card-foreground)",
                    }}
                    formatter={(value, name) => {
                      if (name === "AQI range" || name === "PM2.5 range")
                        return null;
                      if (value === undefined || value === null)
                        return ["—", name];
                      return [value, name];
                    }}
                  />
                  <Legend
                    formatter={(v) =>
                      v === "AQI range" || v === "PM2.5 range" ? null : v
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="aqiMax"
                    stroke="none"
                    fill="url(#aqiRange)"
                    legendType="none"
                    name="AQI range"
                    tooltipType="none"
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqiMin"
                    stroke="none"
                    fill="white"
                    fillOpacity={1}
                    legendType="none"
                    name="AQI range"
                    tooltipType="none"
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="pm25Max"
                    stroke="none"
                    fill="url(#pm25Range)"
                    legendType="none"
                    name="PM2.5 range"
                    tooltipType="none"
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="pm25Min"
                    stroke="none"
                    fill="white"
                    fillOpacity={1}
                    legendType="none"
                    name="PM2.5 range"
                    tooltipType="none"
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#2E75B6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={
                      t("station.aqi_section.title").split(" ").pop() ?? "AQI"
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    stroke="#34A853"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="PM2.5 (µg/m³)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg mb-3">{t("station.info.title")}</h3>
            <dl className="space-y-2 text-sm">
              {(
                [
                  ["id", String(s.id)],
                  ["source", s.source],
                  [
                    "coordinates",
                    `${Number(s.latitude).toFixed(4)}, ${Number(
                      s.longitude
                    ).toFixed(4)}`,
                  ],
                ] as [string, string][]
              ).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t(`station.info.${key}`)}
                  </dt>
                  <dd style={{ fontWeight: 500 }}>{val}</dd>
                </div>
              ))}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("station.info.status")}
                </dt>
                <dd>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {s.is_active
                      ? t("station.info.active")
                      : t("station.info.inactive")}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg text-blue-900 dark:text-blue-200 mb-3">
              {t("station.about_aqi.title")}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t("station.about_aqi.text")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
