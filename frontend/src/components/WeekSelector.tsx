import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekSelectorProps {
  currentWeek: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function WeekSelector({ currentWeek, onPrevious, onNext }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevious}
        disabled={currentWeek <= 0}
        className="h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-accent hover:border-highlight/50 transition-colors disabled:opacity-50"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>
      <button
        onClick={onNext}
        disabled={currentWeek >= 3}
        className="h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-accent hover:border-highlight/50 transition-colors disabled:opacity-50"
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>
    </div>
  );
}
