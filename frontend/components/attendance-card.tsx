"use client"

import { cn } from "@/lib/utils"

interface AttendanceCardProps {
  course: string
  code: string
  attended: number
  total: number
  percentage: number
}

export function AttendanceCard({
  course,
  code,
  attended,
  total,
  percentage,
}: AttendanceCardProps) {
  const getStatus = (pct: number) => {
    if (pct >= 75) return "safe"
    if (pct >= 65) return "warning"
    return "danger"
  }

  const status = getStatus(percentage)

  return (
    <div className="group relative rounded-lg border border-border bg-card p-5 hover:bg-muted/30 transition-all duration-200 cursor-pointer overflow-hidden">
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full transition-all duration-200",
          status === "safe" && "bg-highlight",
          status === "warning" && "bg-amber-500",
          status === "danger" && "bg-destructive"
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm leading-snug group-hover:text-highlight transition-colors truncate">
            {course}
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">
            {code}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div
            className={cn(
              "text-2xl font-semibold tabular-nums",
              status === "safe" && "text-highlight",
              status === "warning" && "text-amber-500",
              status === "danger" && "text-destructive"
            )}
          >
            {percentage}%
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {attended}/{total} classes
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            status === "safe" && "bg-highlight",
            status === "warning" && "bg-amber-500",
            status === "danger" && "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status badge */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border",
            status === "safe" && "text-highlight border-highlight/50 bg-highlight/10",
            status === "warning" &&
              "text-amber-600 dark:text-amber-400 border-amber-500/50 bg-amber-500/10",
            status === "danger" &&
              "text-destructive border-destructive/50 bg-destructive/10"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              status === "safe" && "bg-highlight",
              status === "warning" && "bg-amber-500",
              status === "danger" && "bg-destructive"
            )}
          />
          {status === "safe" && "On Track"}
          {status === "warning" && "At Risk"}
          {status === "danger" && "Critical"}
        </span>
      </div>
    </div>
  )
}
