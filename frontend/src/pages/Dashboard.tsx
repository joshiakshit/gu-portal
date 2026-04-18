import { useState, useMemo } from "react";
import { CalendarDays, Clock, RefreshCw, Search } from "lucide-react";
import { TimetableGrid } from "@/components/TimetableGrid";
import { AttendanceCard } from "@/components/AttendanceCard";
import { StatsCard } from "@/components/StatsCard";
import { WeekSelector } from "@/components/WeekSelector";
import { CircularProgress } from "@/components/CircularProgress";
import { useAttendance, useTimetable, useRefresh, useStatus } from "@/hooks/usePortalData";
import { useAttendanceFilter } from "@/hooks/useAttendanceFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardPage() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const { toast } = useToast();

  const { data: attendance, isLoading: attLoading, error: attError } = useAttendance();
  const { data: timetable, isLoading: ttLoading, error: ttError } = useTimetable(currentWeek);
  const { data: status } = useStatus();
  const { refreshAttendance: refreshAtt, refreshTimetable: refreshTT } = useRefresh();

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timetableDays = useMemo(() => {
    if (!timetable?.slots || timetable.slots.length === 0) return [];
    return Object.keys(timetable.slots[0]).filter((k) => k !== "time");
  }, [timetable]);

  const attendanceData = useMemo(() => attendance?.data || [], [attendance]);
  const overallAttendance =
    attendanceData.length > 0
      ? Math.round(attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceData.length)
      : 0;
  const totalClasses = attendanceData.reduce((acc, curr) => acc + curr.total, 0);
  const attendedClasses = attendanceData.reduce((acc, curr) => acc + curr.attended, 0);

  const { attFilter, setAttFilter, searchQuery, setSearchQuery, filteredAttendance, filterButtons } =
    useAttendanceFilter(attendanceData);

  const lastSynced = attendance?.cachedAt
    ? new Date(attendance.cachedAt).toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Never";

  const isScraping = status?.scraping ?? false;

  const handleRefreshAttendance = () => {
    refreshAtt.mutate(undefined, {
      onSuccess: () => toast({ title: "Attendance refreshed" }),
      onError: (err: any) =>
        toast({
          title: "Refresh failed",
          description: err?.response?.data?.error || err.message,
          variant: "destructive",
        }),
    });
  };

  const handleRefreshTimetable = () => {
    refreshTT.mutate(undefined, {
      onSuccess: () => toast({ title: "Timetable refreshed" }),
      onError: (err: any) =>
        toast({
          title: "Refresh failed",
          description: err?.response?.data?.error || err.message,
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted-foreground font-mono">{todayDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScraping ? "bg-amber-500 animate-pulse-dot" : "bg-green-500"
                }`}
              />
              <span className="hidden sm:inline font-mono">
                {isScraping ? "Syncing…" : `Synced ${lastSynced}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 py-6 space-y-8">
        {(attError || ttError) && (
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <span className="text-destructive text-sm">!</span>
            </div>
            <div>
              <p className="text-sm font-medium text-destructive">Cannot connect to backend</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set VITE_API_BASE_URL to your backend URL.
              </p>
            </div>
          </div>
        )}

        <section className="animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {attLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)
            ) : (
              <>
                <StatsCard
                  label="Overall Attendance"
                  value={`${overallAttendance}%`}
                  sublabel="Across all courses"
                  highlight
                />
                <StatsCard
                  label="Classes Attended"
                  value={`${attendedClasses}/${totalClasses}`}
                  sublabel="Total this semester"
                />
                <StatsCard label="Active Courses" value={attendanceData.length} sublabel="This semester" />
                <StatsCard
                  label="Scraper"
                  value={isScraping ? "Running" : "Idle"}
                  sublabel={isScraping ? "Data refresh in progress" : "Ready to refresh"}
                  pulse={isScraping}
                />
              </>
            )}
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-highlight/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-highlight" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">Weekly Timetable</h2>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {timetable?.header || "Class schedule"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshTimetable}
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
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            {ttLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 rounded" />
                ))}
              </div>
            ) : timetable?.slots && timetable.slots.length > 0 ? (
              <TimetableGrid slots={timetable.slots} header={timetable.header} days={timetableDays} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No timetable data</p>
                <button
                  onClick={handleRefreshTimetable}
                  disabled={refreshTT.isPending || isScraping}
                  className="mt-3 text-xs text-highlight hover:underline"
                >
                  Refresh from server
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-highlight/10 flex items-center justify-center">
                <CircularProgress percentage={overallAttendance} size={28} strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">Course Attendance</h2>
                <p className="text-[11px] text-muted-foreground">Track your progress</p>
              </div>
            </div>
            <button
              onClick={handleRefreshAttendance}
              disabled={refreshAtt.isPending || isScraping}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-highlight px-2.5 py-1.5 rounded-md border border-border hover:border-highlight/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshAtt.isPending ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {!attLoading && attendanceData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-highlight focus:border-highlight"
                />
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md">
                {filterButtons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setAttFilter(btn.value)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                      attFilter === btn.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {btn.label}
                    {btn.count > 0 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">{btn.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {attLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : filteredAttendance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAttendance.map((course, idx) => (
                <div
                  key={course.code}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <AttendanceCard {...course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery || attFilter !== "all"
                  ? "No courses match your filters"
                  : "No attendance data available"}
              </p>
              {!searchQuery && attFilter === "all" && (
                <button
                  onClick={handleRefreshAttendance}
                  disabled={refreshAtt.isPending || isScraping}
                  className="mt-3 text-xs text-highlight hover:underline"
                >
                  Refresh from server
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
