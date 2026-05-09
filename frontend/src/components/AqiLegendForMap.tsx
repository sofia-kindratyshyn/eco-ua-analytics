import { getAqiLevel } from "../data/mockData";

const levels = [
  { range: "0-50", label: "Good" },
  { range: "51-100", label: "Moderate" },
  { range: "101-150", label: "Sensitive" },
  { range: "151-200", label: "Unhealthy" },
  { range: "201-300", label: "Very Unhealthy" },
  { range: "301-500", label: "Hazardous" },
];

const aqiValues = [25, 75, 125, 175, 250, 400];

const AqiLegend = () => (
  <div className="flex flex-wrap gap-2">
    {levels.map((level, i) => {
      const config = getAqiLevel(aqiValues[i]);
      return (
        <div key={level.label} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: config.color }}
          />
          <span className="text-[10px] text-muted-foreground">
            {level.label} ({level.range})
          </span>
        </div>
      );
    })}
  </div>
);

export default AqiLegend;
