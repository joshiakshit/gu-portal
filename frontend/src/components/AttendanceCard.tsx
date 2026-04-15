import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/CircularProgress";

interface AttendanceCardProps {
  course: string;
  code: string;
  attended: number;
  total: number;
  percentage: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export function AttendanceCard({
  course,
  code,
  attended,
  total,
  percentage,
  onClick,
  isSelected,
}: AttendanceCardProps) {
  const getStatus = (pct: number) => {
    if (pct >= 75) return "safe";
    if (pct >= 65) return "warning";
    return "danger";
  };

  const status = getStatus(percentage);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-lg border bg-card p-5 transition-all duration-200 cursor-pointer overflow-hidden hover-scale",
        isSelected
          ? "border-highlight shadow-md shadow-highlight/10 ring-1 ring-highlight/20"
          : "border-border hover:bg-muted/30"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full transition-all duration-200",
          status === "safe" && "bg-highlight",
          status === "warning" && "bg-amber-500",
          status === "danger" && "bg-destructive"
        )}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm leading-snug group-hover:text-highlight transition-colors truncate">
            {course}
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">
            {code}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded border",
                status === "safe" && "text-highlight border-highlight/50 bg-highlight/10",
                status === "warning" && "text-amber-600 dark:text-amber-400 border-amber-500/50 bg-amber-500/10",
                status === "danger" && "text-destructive border-destructive/50 bg-destructive/10"
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
            <span className="text-[11px] text-muted-foreground font-mono">
              {attended}/{total}
            </span>
          </div>
        </div>

        {/* Circular progress ring */}
        <CircularProgress percentage={percentage} size={68} strokeWidth={5} />
      </div>
    </div>
  );
}
