interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-muted-foreground">{title}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-3xl mb-1" style={{ fontWeight: 600 }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
}
