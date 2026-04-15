import { cn } from "@/lib/utils"

interface StatsCardProps {
  label: string
  value: string | number
  sublabel?: string
  highlight?: boolean
}

export function StatsCard({ label, value, sublabel, highlight }: StatsCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-lg border bg-card transition-colors",
        highlight ? "border-highlight" : "border-border"
      )}
    >
      <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-semibold mt-2 tabular-nums",
          highlight ? "text-highlight" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  )
}
