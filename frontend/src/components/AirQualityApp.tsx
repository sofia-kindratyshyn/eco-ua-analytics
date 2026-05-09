import { Link } from "react-router";
import { AQIBadge } from "./AQIBadge";
import { MapPin } from "lucide-react";
import { getAQIColor } from "../aqi";
import type { UIStation as Station } from "../types/ui";

interface AirQualityMapProps {
  stations: Station[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export function AirQualityMap({
  stations,
  height = "500px",
}: AirQualityMapProps) {
  return (
    <div
      style={{
        height,
        width: "100%",
        position: "relative",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
      className="bg-linear-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800"
    >
      {/* Map placeholder with station markers */}
      <div className="relative w-full h-full p-8 overflow-auto">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(46,117,182,0.3),transparent_50%)]"></div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stations.map((station) => {
            const color = getAQIColor(station.aqi);

            return (
              <div
                key={station.id}
                className="bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-4 border-l-4"
                style={{ borderLeftColor: color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shadow-lg"
                      style={{
                        backgroundColor: color,
                        color:
                          station.aqi >= 51 && station.aqi <= 100
                            ? "#000"
                            : "#fff",
                      }}
                    >
                      {station.aqi}
                    </div>
                    <div>
                      <h3 className="text-sm" style={{ fontWeight: 600 }}>
                        {station.city}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {station.name}
                      </p>
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="mb-3">
                  <AQIBadge aqi={station.aqi} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">PM2.5</div>
                    <div style={{ fontWeight: 600 }}>{station.pm25} µg/m³</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">PM10</div>
                    <div style={{ fontWeight: 600 }}>{station.pm10} µg/m³</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">NO₂</div>
                    <div style={{ fontWeight: 600 }}>{station.no2} µg/m³</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground">O₃</div>
                    <div style={{ fontWeight: 600 }}>{station.o3} µg/m³</div>
                  </div>
                </div>

                <Link
                  to={`/station/${station.id}`}
                  className="inline-block w-full text-center text-xs py-2 rounded transition-all duration-200"
                  style={{
                    backgroundColor: color,
                    color:
                      station.aqi >= 51 && station.aqi <= 100 ? "#000" : "#fff",
                    fontWeight: 500,
                  }}
                >
                  View Details →
                </Link>
              </div>
            );
          })}
        </div>

        {stations.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No monitoring stations available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
