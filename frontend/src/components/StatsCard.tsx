import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  pulse?: boolean;
}

export function StatsCard({ label, value, sublabel, highlight, icon, pulse }: StatsCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-lg border bg-card transition-all duration-200 hover:shadow-sm",
        highlight ? "border-highlight/50 shadow-sm shadow-highlight/5" : "border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            highlight ? "text-highlight" : "text-foreground"
          )}
        >
          {value}
        </p>
        {pulse && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-dot" />
        )}
      </div>
      {sublabel && (
        <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}
