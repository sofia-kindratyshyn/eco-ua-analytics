import { useParams, Link } from "react-router";
import { ArrowLeft, Download, Share2, MapPin, Clock } from "lucide-react";
import {
  LineChart,
  Line,
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
import {
  useStationDetail,
  getMeasurementValue,
  getOverallAqi,
} from "../hooks/useApiData";

export function StationDetailPage() {
  const { id } = useParams();
  const { station, history, loading, error } = useStationDetail(id);

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
        <h1 className="text-2xl mb-4">
          {error ?? "Station not found"}
        </h1>
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const measurements = station.latest_measurements;
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
      unit: "ppb",
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
      unit: "ppb",
      color: "#10b981",
    },
    {
      name: "SO₂",
      value: getMeasurementValue(measurements, "so2"),
      unit: "ppb",
      color: "#6366f1",
    },
  ];

  const lastUpdate = station.last_measured_at;

  return (
    <div className="min-h-screen bg-muted/30">
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
              <h1 className="text-3xl mb-2">{station.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
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
              <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-2">
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
              {aqi || "—"}
            </div>
            {aqi > 0 && <AQIBadge aqi={aqi} size="xl" />}
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>
              Health Recommendation
            </h3>
            <p className="text-sm text-muted-foreground">
              {aqi > 0 ? aqiLevel.healthAdvice : "No current measurements available."}
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
                  {pollutant.value || "—"}
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
            <p className="text-muted-foreground text-sm">No historical data available</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#2E75B6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="AQI"
                  />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    stroke="#34A853"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="PM2.5"
                  />
                </LineChart>
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
                <dd style={{ fontWeight: 500 }}>{station.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source</dt>
                <dd style={{ fontWeight: 500 }}>{station.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coordinates</dt>
                <dd style={{ fontWeight: 500 }}>
                  {Number(station.latitude).toFixed(4)}, {Number(station.longitude).toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {station.is_active ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg text-blue-900 mb-3">
              About Air Quality Index
            </h3>
            <p className="text-sm text-blue-800">
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
