export interface UIStation {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  o3: number;
  so2: number;
  lastUpdate: string;
  trend: "up" | "down" | "stable";
}

export interface UIAlert {
  id: string;
  severity: "warning" | "danger" | "critical";
  city: string;
  region: string;
  message: string;
  timestamp: string;
  aqi: number;
}
