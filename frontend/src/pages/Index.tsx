import { useState, useMemo } from "react";
import { CalendarDays, BookOpen, Clock, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";

import { TimetableGrid } from "@/components/TimetableGrid";
import { AttendanceCard } from "@/components/AttendanceCard";
import { StatsCard } from "@/components/StatsCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeekSelector } from "@/components/WeekSelector";
import { useAttendance, useTimetable, useRefresh, useStatus } from "@/hooks/usePortalData";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
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

  // Extract day columns from timetable slots
  const timetableDays = useMemo(() => {
    if (!timetable?.slots || timetable.slots.length === 0) return [];
    const slot = timetable.slots[0];
    return Object.keys(slot).filter((k) => k !== "time");
  }, [timetable]);

  // Compute attendance stats
  const attendanceData = attendance?.data || [];
  const overallAttendance = attendanceData.length > 0
    ? Math.round(attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceData.length)
    : 0;
  const totalClasses = attendanceData.reduce((acc, curr) => acc + curr.total, 0);
  const attendedClasses = attendanceData.reduce((acc, curr) => acc + curr.attended, 0);

  const lastSynced = attendance?.cachedAt
    ? new Date(attendance.cachedAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "Never";

  const handleRefreshAttendance = () => {
    refreshAtt.mutate(undefined, {
      onSuccess: () => toast({ title: "Attendance refreshed" }),
      onError: (err: any) => toast({ title: "Refresh failed", description: err?.response?.data?.error || err.message, variant: "destructive" }),
    });
  };

  const handleRefreshTimetable = () => {
    refreshTT.mutate(undefined, {
      onSuccess: () => toast({ title: "Timetable refreshed" }),
      onError: (err: any) => toast({ title: "Refresh failed", description: err?.response?.data?.error || err.message, variant: "destructive" }),
    });
  };

  const isScraping = status?.scraping ?? false;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Attendance Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {todayDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center">
                <span className="text-xs font-medium text-highlight-light">GU</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Connection Error Banner */}
        {(attError || ttError) && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Cannot connect to backend
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure your backend API is running and the VITE_API_BASE_URL environment variable is set correctly.
              </p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </>
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
                  value={attendedClasses}
                  sublabel={`of ${totalClasses} total`}
                />
                <StatsCard
                  label="Active Courses"
                  value={attendanceData.length}
                  sublabel="This semester"
                />
                <StatsCard
                  label="Scraper Status"
                  value={isScraping ? "Running" : "Idle"}
                  sublabel={isScraping ? "Please wait…" : "Ready"}
                />
              </>
            )}
          </div>
        </section>

        {/* Timetable Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-highlight flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-highlight-light" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">Weekly Timetable</h2>
                  <p className="text-xs text-muted-foreground">
                    {timetable?.header || "Your class schedule"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshTimetable}
                  disabled={refreshTT.isPending || isScraping}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-highlight transition-colors px-3 py-1.5 rounded-md border border-border hover:border-highlight/50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshTT.isPending ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
                <WeekSelector
                  currentWeek={currentWeek}
                  onPrevious={() => setCurrentWeek((w) => Math.max(0, w - 1))}
                  onNext={() => setCurrentWeek((w) => Math.min(3, w + 1))}
                  headerText={timetable?.header?.match(/Date : (.+)/)?.[1] || undefined}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            {ttLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 rounded" />
                ))}
              </div>
            ) : timetable?.slots && timetable.slots.length > 0 ? (
              <TimetableGrid
                slots={timetable.slots}
                header={timetable.header}
                days={timetableDays}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No timetable data available</p>
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

        {/* Attendance Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-highlight flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-highlight-light" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">Course Attendance</h2>
                <p className="text-xs text-muted-foreground">Track your progress</p>
              </div>
            </div>
            <button
              onClick={handleRefreshAttendance}
              disabled={refreshAtt.isPending || isScraping}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-highlight transition-colors px-3 py-1.5 rounded-md border border-border hover:border-highlight/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshAtt.isPending ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {attLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendanceData.map((course) => (
                <AttendanceCard key={course.code} {...course} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No attendance data available</p>
              <button
                onClick={handleRefreshAttendance}
                disabled={refreshAtt.isPending || isScraping}
                className="mt-3 text-xs text-highlight hover:underline"
              >
                Refresh from server
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p className="font-mono uppercase tracking-wider">
              Attendance Portal <span className="text-highlight">•</span> GU Portal
            </p>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-highlight" />
              <span>Last synced: {lastSynced}</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
