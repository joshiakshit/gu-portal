import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekSelectorProps {
  currentWeek: number;
  onPrevious: () => void;
  onNext: () => void;
  headerText?: string;
}

export function WeekSelector({ currentWeek, onPrevious, onNext, headerText }: WeekSelectorProps) {
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
      <div className="px-3 py-1.5 rounded-md bg-muted min-w-[160px] text-center">
        <span className="text-sm font-medium text-foreground">
          {headerText || `Week ${currentWeek}`}
        </span>
        {currentWeek === 0 && (
          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-highlight">
            Current
          </span>
        )}
      </div>
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
