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

// Mock data for Ukrainian cities
export const MOCK_STATIONS: Station[] = [
  {
    id: "1",
    name: "Kyiv Central",
    city: "Kyiv",
    region: "Kyiv Oblast",
    lat: 50.4501,
    lng: 30.5234,
    aqi: 72,
    pm25: 18.5,
    pm10: 32.1,
    no2: 24.3,
    co: 0.4,
    o3: 45.2,
    so2: 5.1,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "down",
  },
  {
    id: "2",
    name: "Lviv Prospekt",
    city: "Lviv",
    region: "Lviv Oblast",
    lat: 49.8397,
    lng: 24.0297,
    aqi: 45,
    pm25: 12.3,
    pm10: 21.5,
    no2: 18.2,
    co: 0.3,
    o3: 38.1,
    so2: 3.2,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "stable",
  },
  {
    id: "3",
    name: "Odesa Seaside",
    city: "Odesa",
    region: "Odesa Oblast",
    lat: 46.4825,
    lng: 30.7233,
    aqi: 38,
    pm25: 9.8,
    pm10: 18.3,
    no2: 15.1,
    co: 0.2,
    o3: 42.5,
    so2: 4.1,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "down",
  },
  {
    id: "4",
    name: "Kharkiv Industrial",
    city: "Kharkiv",
    region: "Kharkiv Oblast",
    lat: 49.9935,
    lng: 36.2304,
    aqi: 118,
    pm25: 38.2,
    pm10: 65.4,
    no2: 42.1,
    co: 0.8,
    o3: 28.3,
    so2: 12.5,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "up",
  },
  {
    id: "5",
    name: "Dnipro Center",
    city: "Dnipro",
    region: "Dnipropetrovsk Oblast",
    lat: 48.4647,
    lng: 35.0462,
    aqi: 95,
    pm25: 28.5,
    pm10: 45.2,
    no2: 32.4,
    co: 0.6,
    o3: 35.1,
    so2: 8.3,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "stable",
  },
  {
    id: "6",
    name: "Zaporizhzhia South",
    city: "Zaporizhzhia",
    region: "Zaporizhzhia Oblast",
    lat: 47.8388,
    lng: 35.1396,
    aqi: 82,
    pm25: 22.1,
    pm10: 38.5,
    no2: 28.3,
    co: 0.5,
    o3: 40.2,
    so2: 6.8,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "down",
  },
  {
    id: "7",
    name: "Ivano-Frankivsk Park",
    city: "Ivano-Frankivsk",
    region: "Ivano-Frankivsk Oblast",
    lat: 48.9226,
    lng: 24.7111,
    aqi: 32,
    pm25: 8.2,
    pm10: 15.3,
    no2: 12.1,
    co: 0.2,
    o3: 48.5,
    so2: 2.8,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "stable",
  },
  {
    id: "8",
    name: "Vinnytsia Residential",
    city: "Vinnytsia",
    region: "Vinnytsia Oblast",
    lat: 49.2331,
    lng: 28.4682,
    aqi: 58,
    pm25: 15.2,
    pm10: 26.8,
    no2: 20.5,
    co: 0.4,
    o3: 43.2,
    so2: 4.5,
    lastUpdate: "2026-03-07T14:30:00Z",
    trend: "up",
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-1",
    severity: "warning",
    city: "Kharkiv",
    region: "Kharkiv Oblast",
    message:
      "Air quality has reached unhealthy levels for sensitive groups. Reduce outdoor activities if you experience symptoms.",
    timestamp: "2026-03-07T12:15:00Z",
    aqi: 118,
  },
  {
    id: "alert-2",
    severity: "warning",
    city: "Dnipro",
    region: "Dnipropetrovsk Oblast",
    message:
      "Moderate air quality detected. Sensitive individuals should consider limiting prolonged outdoor exertion.",
    timestamp: "2026-03-07T10:30:00Z",
    aqi: 95,
  },
];

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
