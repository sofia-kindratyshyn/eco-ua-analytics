const PM25_BREAKPOINTS = [
  { cLow: 0,     cHigh: 12.0,  iLow: 0,   iHigh: 50  },
  { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
  { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
  { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

export function pm25ToAqi(pm25: number): number {
  if (pm25 <= 0) return 0;
  const bp = PM25_BREAKPOINTS.find((b) => pm25 >= b.cLow && pm25 <= b.cHigh);
  if (!bp) return 500;
  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
  );
}

export interface AQILevel {
  label: string;
  color: string;
  min: number;
  max: number;
  healthAdvice: string;
}

export const AQI_LEVELS: AQILevel[] = [
  {
    label: "Good",
    color: "#00E400",
    min: 0,
    max: 50,
    healthAdvice:
      "Air quality is satisfactory, and air pollution poses little or no risk.",
  },
  {
    label: "Moderate",
    color: "#FFFF00",
    min: 51,
    max: 100,
    healthAdvice:
      "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
  },
  {
    label: "Unhealthy for Sensitive Groups",
    color: "#FF7E00",
    min: 101,
    max: 150,
    healthAdvice:
      "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  },
  {
    label: "Unhealthy",
    color: "#FF0000",
    min: 151,
    max: 200,
    healthAdvice:
      "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
  },
  {
    label: "Very Unhealthy",
    color: "#8F3F97",
    min: 201,
    max: 300,
    healthAdvice:
      "Health alert: The risk of health effects is increased for everyone.",
  },
  {
    label: "Hazardous",
    color: "#7E0023",
    min: 301,
    max: 500,
    healthAdvice:
      "Health warning of emergency conditions: everyone is more likely to be affected.",
  },
];

export function getAQILevel(aqi: number): AQILevel {
  return (
    AQI_LEVELS.find((level) => aqi >= level.min && aqi <= level.max) ||
    AQI_LEVELS[0]
  );
}

export function getAQIColor(aqi: number): string {
  return getAQILevel(aqi).color;
}

export function getAQILabel(aqi: number): string {
  return getAQILevel(aqi).label;
}

export interface Station {
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

export interface Alert {
  id: string;
  severity: "warning" | "danger" | "critical";
  city: string;
  region: string;
  message: string;
  timestamp: string;
  aqi: number;
}

// Generate historical data for charts
export function generateHistoricalData(station: Station, days: number = 7) {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Generate realistic variations
    const variance = (Math.random() - 0.5) * 20;
    const aqi = Math.max(0, Math.min(300, station.aqi + variance));

    data.push({
      date: date.toISOString().split("T")[0],
      aqi: Math.round(aqi),
      pm25: Math.round((station.pm25 + (Math.random() - 0.5) * 10) * 10) / 10,
      pm10: Math.round((station.pm10 + (Math.random() - 0.5) * 15) * 10) / 10,
    });
  }

  return data;
}
