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
import { getAQILevel } from "../aqi";
import { AQIBadge } from "../components/AQIBadge";
import { SEOMeta } from "../components/SEOMeta";
import {
  useStationDetail,
  getMeasurementValue,
  getOverallAqi,
} from "../hooks/useApiData";

function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StationDetailPage() {
  const { id } = useParams();
  const { station, history, loading, error } = useStationDetail(id);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading station data…
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl mb-4">{error ?? "Station not found"}</h1>
        <Link to="/" className="text-primary hover:underline">
          Return to home
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

  const lastUpdate = s.last_measured_at;

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
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadCSV(`station-${s.id}-report.csv`, csv);
  }

  async function handleShare() {
    const url = window.location.href;
    const title = `Air Quality — ${s.name}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
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
        title={`${s.name} — Air Quality`}
        description={`Live air quality data for ${s.name}. Current AQI: ${
          aqi > 0 ? aqi : "N/A"
        } (${
          aqiLevel.label
        }). Measurements include PM2.5, PM10, NO₂, CO, O₃ and SO₂ with a 7-day historical trend.`}
        path={`/station/${s.id}`}
        schema={{
          "@type": "Dataset",
          name: `Air Quality Data — ${s.name}`,
          description: `Real-time and historical air quality measurements from ${s.name} monitoring station`,
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
            Back to home
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
                {lastUpdate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated{" "}
                    {formatDistanceToNow(new Date(lastUpdate), {
                      addSuffix: true,
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
                {copied ? "Copied!" : "Share"}
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            Current Air Quality Index
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="text-6xl" style={{ fontWeight: 700 }}>
              {aqi > 0 ? aqi : "—"}
            </div>
            {aqi > 0 && <AQIBadge aqi={aqi} size="xl" />}
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>
              Health Recommendation
            </h3>
            <p className="text-sm text-muted-foreground">
              {aqi > 0
                ? aqiLevel.healthAdvice
                : "No current measurements available."}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl mb-4">Air Pollutant Levels</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pollutants.map((pollutant) => (
              <div
                key={pollutant.name}
                className="bg-card rounded-lg border border-border p-4 text-center"
              >
                <div
                  className="text-2xl mb-1"
                  style={{ fontWeight: 600, color: pollutant.color }}
                >
                  {pollutant.value != null ? pollutant.value : "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {pollutant.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pollutant.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl mb-4">7-Day Trend</h2>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No historical data available
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
                    tickFormatter={(value) => {
                      const d = new Date(value);
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
                    formatter={(value) =>
                      value === "AQI range" || value === "PM2.5 range"
                        ? null
                        : value
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
                  {/* Mean lines */}
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#2E75B6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="AQI"
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
            <h3 className="text-lg mb-3">Station Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Station ID</dt>
                <dd style={{ fontWeight: 500 }}>{s.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source</dt>
                <dd style={{ fontWeight: 500 }}>{s.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coordinates</dt>
                <dd style={{ fontWeight: 500 }}>
                  {Number(s.latitude).toFixed(4)},{" "}
                  {Number(s.longitude).toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg text-blue-900 dark:text-blue-200 mb-3">
              About Air Quality Index
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              The AQI is calculated based on the concentration of major air
              pollutants including particulate matter (PM2.5, PM10), nitrogen
              dioxide (NO₂), carbon monoxide (CO), ozone (O₃), and sulfur
              dioxide (SO₂). Each pollutant is measured and converted to a
              standardized scale, with the highest value determining the overall
              AQI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
