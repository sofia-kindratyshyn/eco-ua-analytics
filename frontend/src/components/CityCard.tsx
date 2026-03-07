import { Link } from "react-router";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Station } from "../aqi";
import { AQIBadge } from "./AQIBadge";

interface CityCardProps {
  station: Station;
}

export function CityCard({ station }: CityCardProps) {
  const TrendIcon =
    station.trend === "up"
      ? TrendingUp
      : station.trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    station.trend === "up"
      ? "text-red-500"
      : station.trend === "down"
      ? "text-green-500"
      : "text-gray-400";

  return (
    <Link
      to={`/station/${station.id}`}
      className="block bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base mb-1">{station.city}</h3>
          <p className="text-sm text-muted-foreground">{station.name}</p>
        </div>
        <TrendIcon className={`h-5 w-5 ${trendColor}`} />
      </div>

      <div className="flex items-center justify-between">
        <AQIBadge aqi={station.aqi} size="lg" showLabel={false} />
        <div className="text-right">
          <div className="text-xs text-muted-foreground">PM2.5</div>
          <div className="text-sm">{station.pm25} µg/m³</div>
        </div>
      </div>
    </Link>
  );
}
