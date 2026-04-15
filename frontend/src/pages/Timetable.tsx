import { useState, useMemo } from "react";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import { TimetableGrid } from "@/components/TimetableGrid";
import { WeekSelector } from "@/components/WeekSelector";
import { useTimetable, useRefresh, useStatus } from "@/hooks/usePortalData";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TimetablePage() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const { toast } = useToast();

  const { data: timetable, isLoading } = useTimetable(currentWeek);
  const { data: status } = useStatus();
  const { refreshTimetable: refreshTT } = useRefresh();
  const isScraping = status?.scraping ?? false;

  const timetableDays = useMemo(() => {
    if (!timetable?.slots || timetable.slots.length === 0) return [];
    return Object.keys(timetable.slots[0]).filter((k) => k !== "time");
  }, [timetable]);

  const handleRefresh = () => {
    refreshTT.mutate(undefined, {
      onSuccess: () => toast({ title: "Timetable refreshed" }),
      onError: (err: any) => toast({ title: "Refresh failed", description: err?.response?.data?.error || err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-highlight/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-highlight" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Timetable</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {timetable?.header || "Weekly schedule"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshTT.isPending || isScraping}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-highlight px-2.5 py-1.5 rounded-md border border-border hover:border-highlight/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshTT.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <WeekSelector
              currentWeek={currentWeek}
              onPrevious={() => setCurrentWeek((w) => Math.max(0, w - 1))}
              onNext={() => setCurrentWeek((w) => Math.min(3, w + 1))}
              headerText={timetable?.header?.match(/Date : (.+)/)?.[1] || undefined}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 py-6">
        {/* Week tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
          {[0, 1, 2, 3].map((w) => (
            <button
              key={w}
              onClick={() => setCurrentWeek(w)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                currentWeek === w
                  ? "bg-highlight text-highlight-light shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {w === 0 ? "This Week" : `Week +${w}`}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 md:p-6 animate-fade-in">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : timetable?.slots && timetable.slots.length > 0 ? (
            <TimetableGrid slots={timetable.slots} header={timetable.header} days={timetableDays} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">No timetable data</p>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Click refresh to fetch from server
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshTT.isPending || isScraping}
                className="text-xs text-highlight hover:underline"
              >
                Refresh now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
