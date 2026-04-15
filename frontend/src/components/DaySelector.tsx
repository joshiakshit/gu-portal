import { cn } from "@/lib/utils";

interface DaySelectorProps {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
}

export function DaySelector({ days, selectedDay, onSelect }: DaySelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {days.map((day) => (
        <button
          key={day}
          onClick={() => onSelect(day)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
            selectedDay === day
              ? "bg-highlight text-highlight-light shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
