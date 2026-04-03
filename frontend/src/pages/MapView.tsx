import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { getAqiLevel } from "../data/mockData";
import AqiLegend from "../components/AqiLegendForMap";
import { useStations } from "../hooks/useApiData";

const ukraineCenter: [number, number] = [48.9, 31.2];

const MapView = () => {
  const { stations } = useStations();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(ukraineCenter, 6);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const level = getAqiLevel(station.aqi);
      const marker = L.circleMarker([station.lat, station.lng], {
        radius: 14,
        color: level.color,
        fillColor: level.color,
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:200px;padding:4px;">
          <h4 style="font-weight:bold;font-size:14px;margin:0;">${station.name}</h4>
          <p style="font-size:12px;color:#888;margin:2px 0 8px;">${station.region}</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="background:${level.color};color:${
        station.aqi <= 100 ? "#333" : "#fff"
      };width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;font-family:monospace;">
              ${station.aqi}
            </div>
            <div style="font-size:12px;">
              <p style="margin:0;"><strong>PM2.5:</strong> ${station.pm25} µg/m³</p>
              <p style="margin:0;"><strong>PM10:</strong> ${station.pm10} µg/m³</p>
            </div>
          </div>
          <a href="/station/${station.id}" style="display:block;text-align:center;margin-top:8px;font-size:12px;color:#2E75B6;">View Details →</a>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [stations]);

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      <div className="absolute left-4 top-4 z-[1000] max-w-xs">
        <div className="glass-card p-3">
          <h3 className="mb-2 text-xs font-semibold text-foreground">
            AQI Levels
          </h3>
          <AqiLegend />
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[1000] hidden w-72 md:block">
        <div className="glass-card max-h-[calc(100vh-8rem)] overflow-y-auto p-3">
          <h3 className="mb-2 text-xs font-semibold text-foreground">
            Stations ({stations.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {[...stations]
              .sort((a, b) => a.aqi - b.aqi)
              .map((s) => {
                const level = getAqiLevel(s.aqi);
                return (
                  <Link
                    key={s.id}
                    to={`/station/${s.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="flex-1 truncate text-xs font-medium text-foreground">
                      {s.city}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {s.aqi}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 z-0" />
    </div>
  );
};

export default MapView;
