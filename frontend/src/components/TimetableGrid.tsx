import { cn } from "@/lib/utils";
import type { TimetableSlot } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimetableGridProps {
  slots: TimetableSlot[];
  header: string;
  days: string[];
}

function MobileSlotCard({
  slot,
  days,
  index,
}: {
  slot: TimetableSlot;
  days: string[];
  index: number;
}) {
  const hasClasses = days.some((day) => {
    const cell = slot[day];
    return cell && cell !== null;
  });

  if (!hasClasses) return null;

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
        {slot.time}
      </div>
      <div className="space-y-2">
        {days.map((day) => {
          const cell = slot[day];
          if (!cell || cell === null) return null;

          const dayLabel = day.split(" ")[0];
          const dateLabel = day.split(" ")[1] || "";

          if (typeof cell === "string") {
            return (
              <div key={day} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">{dayLabel} {dateLabel}</span>
                <span className="text-xs text-muted-foreground">{cell}</span>
              </div>
            );
          }

          if ("raw" in cell && cell.raw) {
            return (
              <div key={day} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground">{dayLabel} {dateLabel}</span>
                <span className="text-xs text-amber-500 font-medium">{cell.raw}</span>
              </div>
            );
          }

          const typeColors: Record<string, string> = {
            TH: "text-foreground border-border bg-muted/50",
            PR: "text-highlight border-highlight/50 bg-highlight/5",
            PP: "text-amber-600 dark:text-amber-400 border-amber-500/50 bg-amber-500/5",
          };

          return (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-md border",
                typeColors[cell.type || ""] || "border-border bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono w-8">{dayLabel}</span>
                <div>
                  <span className="text-xs font-medium text-foreground">{cell.courseCode}</span>
                  {cell.room && (
                    <span className="text-[10px] text-muted-foreground ml-2">{cell.room}</span>
                  )}
                </div>
              </div>
              {cell.type && (
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border rounded">
                  {cell.type}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimetableGrid({ slots, days }: TimetableGridProps) {
  const isMobile = useIsMobile();

  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No timetable data available</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {slots.map((slot, idx) => (
          <MobileSlotCard key={idx} slot={slot} days={days} index={idx} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 text-xs font-mono text-muted-foreground uppercase tracking-wider w-28">
              Time
            </th>
            {days.map((day) => (
              <th
                key={day}
                className="text-left py-3 px-3 text-xs font-mono text-muted-foreground uppercase tracking-wider"
              >
                {day.split(" ")[0]}
                <span className="block text-[10px] text-muted-foreground/70 font-normal">
                  {day.split(" ")[1] || ""}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, idx) => (
            <tr
              key={idx}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <td className="py-3 px-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                {slot.time}
              </td>
              {days.map((day) => {
                const cell = slot[day];
                if (!cell || cell === null) {
                  return (
                    <td key={day} className="py-3 px-3">
                      <span className="text-muted-foreground/30">—</span>
                    </td>
                  );
                }

                if (typeof cell === "string") {
                  return (
                    <td key={day} className="py-3 px-3 text-xs text-muted-foreground">
                      {cell}
                    </td>
                  );
                }

                if ("raw" in cell && cell.raw) {
                  return (
                    <td key={day} className="py-3 px-3">
                      <span className="text-xs text-amber-500 font-medium">{cell.raw}</span>
                    </td>
                  );
                }

                const typeColors: Record<string, string> = {
                  TH: "text-foreground border-border",
                  PR: "text-highlight border-highlight/50",
                  PP: "text-amber-600 dark:text-amber-400 border-amber-500/50",
                };

                return (
                  <td key={day} className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {cell.courseCode}
                        </span>
                        {cell.type && (
                          <span
                            className={cn(
                              "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border rounded",
                              typeColors[cell.type] || "text-muted-foreground border-muted"
                            )}
                          >
                            {cell.type}
                          </span>
                        )}
                      </div>
                      {cell.room && (
                        <p className="text-[10px] text-muted-foreground">{cell.room}</p>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
