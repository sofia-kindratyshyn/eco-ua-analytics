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
import { generateHistoricalData, getAQILevel, MOCK_STATIONS } from "../aqi";
import { AQIBadge } from "../components/AQIBadge";

export function StationDetailPage() {
  const { id } = useParams();
  const station = MOCK_STATIONS.find((s) => s.id === id);

  if (!station) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl mb-4">Station not found</h1>
        <Link to="/" className="text-primary hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const aqiLevel = getAQILevel(station.aqi);
  const historicalData = generateHistoricalData(station);

  const pollutants = [
    { name: "PM2.5", value: station.pm25, unit: "µg/m³", color: "#3b82f6" },
    { name: "PM10", value: station.pm10, unit: "µg/m³", color: "#8b5cf6" },
    { name: "NO₂", value: station.no2, unit: "ppb", color: "#f59e0b" },
    { name: "CO", value: station.co, unit: "ppm", color: "#ef4444" },
    { name: "O₃", value: station.o3, unit: "ppb", color: "#10b981" },
    { name: "SO₂", value: station.so2, unit: "ppb", color: "#6366f1" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
                  {station.city}, {station.region}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated{" "}
                  {formatDistanceToNow(new Date(station.lastUpdate), {
                    addSuffix: true,
                  })}
                </span>
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

        {/* Current AQI */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            Current Air Quality Index
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="text-6xl" style={{ fontWeight: 700 }}>
              {station.aqi}
            </div>
            <AQIBadge aqi={station.aqi} size="xl" />
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm mb-2" style={{ fontWeight: 600 }}>
              Health Recommendation
            </h3>
            <p className="text-sm text-muted-foreground">
              {aqiLevel.healthAdvice}
            </p>
          </div>
        </div>

        {/* Pollutant Cards */}
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
                  {pollutant.value}
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

        {/* Historical Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl mb-4">7-Day Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
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
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg mb-3">Station Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Station ID</dt>
                <dd style={{ fontWeight: 500 }}>{station.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Location</dt>
                <dd style={{ fontWeight: 500 }}>{station.city}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Coordinates</dt>
                <dd style={{ fontWeight: 500 }}>
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Active
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
