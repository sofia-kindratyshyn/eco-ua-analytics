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
  lastUpdated: string;
  trend: "up" | "down" | "stable";
  history: number[];
}

export interface Alert {
  id: string;
  severity: "warning" | "danger" | "critical";
  title: string;
  message: string;
  region: string;
  timestamp: string;
  active: boolean;
}

export const getAqiLevel = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", class: "aqi-good", color: "#00E400" };
  if (aqi <= 100)
    return { label: "Moderate", class: "aqi-moderate", color: "#FFFF00" };
  if (aqi <= 150)
    return {
      label: "Unhealthy for Sensitive Groups",
      class: "aqi-sensitive",
      color: "#FF7E00",
    };
  if (aqi <= 200)
    return { label: "Unhealthy", class: "aqi-unhealthy", color: "#FF0000" };
  if (aqi <= 300)
    return {
      label: "Very Unhealthy",
      class: "aqi-very-unhealthy",
      color: "#8F3F97",
    };
  return { label: "Hazardous", class: "aqi-hazardous", color: "#7E0023" };
};

export const getHealthRecommendation = (aqi: number): string => {
  if (aqi <= 50)
    return "Air quality is satisfactory. Enjoy outdoor activities!";
  if (aqi <= 100)
    return "Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.";
  if (aqi <= 150)
    return "Members of sensitive groups may experience health effects. General public is less likely to be affected.";
  if (aqi <= 200)
    return "Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.";
  if (aqi <= 300)
    return "Health alert: The risk of health effects is increased for everyone. Avoid prolonged outdoor exertion.";
  return "Health warning of emergency conditions. Everyone is more likely to be affected. Stay indoors.";
};

export const stations: Station[] = [
  {
    id: "kyiv-1",
    name: "Kyiv Central",
    city: "Kyiv",
    region: "Kyiv",
    lat: 50.4501,
    lng: 30.5234,
    aqi: 62,
    pm25: 18.5,
    pm10: 32.1,
    no2: 24.3,
    co: 0.4,
    o3: 45.2,
    so2: 3.1,
    lastUpdated: "2 min ago",
    trend: "down",
    history: [78, 72, 68, 65, 70, 62, 62],
  },
  {
    id: "lviv-1",
    name: "Lviv Center",
    city: "Lviv",
    region: "Lviv Oblast",
    lat: 49.8397,
    lng: 24.0297,
    aqi: 34,
    pm25: 8.2,
    pm10: 18.5,
    no2: 12.1,
    co: 0.2,
    o3: 38.4,
    so2: 1.5,
    lastUpdated: "5 min ago",
    trend: "stable",
    history: [42, 38, 36, 35, 33, 34, 34],
  },
  {
    id: "kharkiv-1",
    name: "Kharkiv Industrial",
    city: "Kharkiv",
    region: "Kharkiv Oblast",
    lat: 49.9935,
    lng: 36.2304,
    aqi: 124,
    pm25: 48.3,
    pm10: 72.1,
    no2: 38.7,
    co: 0.8,
    o3: 52.1,
    so2: 8.4,
    lastUpdated: "3 min ago",
    trend: "up",
    history: [98, 105, 112, 118, 120, 122, 124],
  },
  {
    id: "odesa-1",
    name: "Odesa Port",
    city: "Odesa",
    region: "Odesa Oblast",
    lat: 46.4825,
    lng: 30.7233,
    aqi: 78,
    pm25: 22.1,
    pm10: 38.4,
    no2: 28.5,
    co: 0.5,
    o3: 41.2,
    so2: 4.2,
    lastUpdated: "1 min ago",
    trend: "up",
    history: [65, 68, 70, 72, 74, 76, 78],
  },
  {
    id: "dnipro-1",
    name: "Dnipro Central",
    city: "Dnipro",
    region: "Dnipropetrovsk Oblast",
    lat: 48.4647,
    lng: 35.0462,
    aqi: 156,
    pm25: 62.4,
    pm10: 88.2,
    no2: 45.1,
    co: 1.2,
    o3: 58.3,
    so2: 12.1,
    lastUpdated: "4 min ago",
    trend: "up",
    history: [130, 135, 140, 145, 150, 153, 156],
  },
  {
    id: "zaporizhzhia-1",
    name: "Zaporizhzhia South",
    city: "Zaporizhzhia",
    region: "Zaporizhzhia Oblast",
    lat: 47.8388,
    lng: 35.1396,
    aqi: 189,
    pm25: 78.1,
    pm10: 102.3,
    no2: 52.4,
    co: 1.5,
    o3: 62.1,
    so2: 18.2,
    lastUpdated: "6 min ago",
    trend: "stable",
    history: [195, 192, 190, 188, 187, 188, 189],
  },
  {
    id: "vinnytsia-1",
    name: "Vinnytsia Park",
    city: "Vinnytsia",
    region: "Vinnytsia Oblast",
    lat: 49.2331,
    lng: 28.4682,
    aqi: 28,
    pm25: 6.1,
    pm10: 14.2,
    no2: 8.3,
    co: 0.1,
    o3: 32.5,
    so2: 0.8,
    lastUpdated: "2 min ago",
    trend: "down",
    history: [35, 33, 32, 30, 29, 28, 28],
  },
  {
    id: "ivano-1",
    name: "Ivano-Frankivsk",
    city: "Ivano-Frankivsk",
    region: "Ivano-Frankivsk Oblast",
    lat: 48.9226,
    lng: 24.7111,
    aqi: 22,
    pm25: 5.2,
    pm10: 11.8,
    no2: 6.4,
    co: 0.1,
    o3: 28.1,
    so2: 0.5,
    lastUpdated: "3 min ago",
    trend: "stable",
    history: [25, 24, 23, 22, 23, 22, 22],
  },
];

export const alerts: Alert[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Hazardous Air Quality in Zaporizhzhia",
    message:
      "AQI levels approaching unhealthy threshold. Sensitive groups should limit outdoor activities.",
    region: "Zaporizhzhia Oblast",
    timestamp: "15 min ago",
    active: true,
  },
  {
    id: "alert-2",
    severity: "danger",
    title: "Elevated PM2.5 in Dnipro",
    message:
      "PM2.5 concentrations exceed safe levels. Consider wearing masks outdoors.",
    region: "Dnipropetrovsk Oblast",
    timestamp: "1 hour ago",
    active: true,
  },
  {
    id: "alert-3",
    severity: "warning",
    title: "Moderate Air Quality in Kharkiv",
    message:
      "AQI rising in the industrial zone. Monitor conditions if you have respiratory issues.",
    region: "Kharkiv Oblast",
    timestamp: "2 hours ago",
    active: true,
  },
];
