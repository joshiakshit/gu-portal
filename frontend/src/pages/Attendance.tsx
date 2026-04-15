import { useState, useMemo } from "react";
import { BookOpen, RefreshCw, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { AttendanceCard } from "@/components/AttendanceCard";
import { CircularProgress } from "@/components/CircularProgress";
import { useAttendance, useRefresh, useStatus } from "@/hooks/usePortalData";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AttendanceFilter = "all" | "safe" | "warning" | "danger";

export default function AttendancePage() {
  const [attFilter, setAttFilter] = useState<AttendanceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: attendance, isLoading } = useAttendance();
  const { data: status } = useStatus();
  const { refreshAttendance: refreshAtt } = useRefresh();
  const isScraping = status?.scraping ?? false;

  const attendanceData = useMemo(() => attendance?.data || [], [attendance]);
  const overallAttendance = attendanceData.length > 0
    ? Math.round(attendanceData.reduce((a, c) => a + c.percentage, 0) / attendanceData.length)
    : 0;
  const totalClasses = attendanceData.reduce((a, c) => a + c.total, 0);
  const attendedClasses = attendanceData.reduce((a, c) => a + c.attended, 0);
  const bestCourse = attendanceData.length > 0 ? attendanceData.reduce((a, c) => c.percentage > a.percentage ? c : a) : null;
  const worstCourse = attendanceData.length > 0 ? attendanceData.reduce((a, c) => c.percentage < a.percentage ? c : a) : null;

  const filteredAttendance = useMemo(() => {
    let data = attendanceData;
    if (attFilter !== "all") {
      data = data.filter((c) => {
        if (attFilter === "safe") return c.percentage >= 75;
        if (attFilter === "warning") return c.percentage >= 65 && c.percentage < 75;
        return c.percentage < 65;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => c.course.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    return data;
  }, [attendanceData, attFilter, searchQuery]);

  const handleRefresh = () => {
    refreshAtt.mutate(undefined, {
      onSuccess: () => toast({ title: "Attendance refreshed" }),
      onError: (err: any) => toast({ title: "Refresh failed", description: err?.response?.data?.error || err.message, variant: "destructive" }),
    });
  };

  const filterButtons: { label: string; value: AttendanceFilter; count: number }[] = [
    { label: "All", value: "all", count: attendanceData.length },
    { label: "On Track", value: "safe", count: attendanceData.filter((c) => c.percentage >= 75).length },
    { label: "At Risk", value: "warning", count: attendanceData.filter((c) => c.percentage >= 65 && c.percentage < 75).length },
    { label: "Critical", value: "danger", count: attendanceData.filter((c) => c.percentage < 65).length },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-highlight/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-highlight" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Attendance</h1>
                <p className="text-xs text-muted-foreground font-mono">Course attendance records</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshAtt.isPending || isScraping}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-highlight px-2.5 py-1.5 rounded-md border border-border hover:border-highlight/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshAtt.isPending ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 py-6 space-y-6">
        {/* Overview stats */}
        {!isLoading && attendanceData.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <div className="p-5 rounded-lg border border-highlight/50 bg-card flex items-center gap-4">
              <CircularProgress percentage={overallAttendance} size={56} strokeWidth={4} />
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Overall</p>
                <p className="text-lg font-semibold text-foreground">{overallAttendance}%</p>
              </div>
            </div>
            <div className="p-5 rounded-lg border border-border bg-card">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-lg font-semibold text-foreground mt-1">{attendedClasses}/{totalClasses}</p>
              <p className="text-[11px] text-muted-foreground">Classes attended</p>
            </div>
            {bestCourse && (
              <div className="p-5 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-highlight" />
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Best</p>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{bestCourse.code}</p>
                <p className="text-lg font-semibold text-highlight">{bestCourse.percentage}%</p>
              </div>
            )}
            {worstCourse && (
              <div className="p-5 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-3 h-3 text-destructive" />
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Needs Work</p>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{worstCourse.code}</p>
                <p className="text-lg font-semibold text-destructive">{worstCourse.percentage}%</p>
              </div>
            )}
          </div>
        )}

        {/* Search + Filter */}
        {!isLoading && attendanceData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-highlight focus:border-highlight"
              />
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setAttFilter(btn.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    attFilter === btn.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {btn.label}
                  <span className="ml-1 text-[10px] text-muted-foreground">{btn.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : filteredAttendance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAttendance.map((course, idx) => (
              <div key={course.code} className="animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <AttendanceCard {...course} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-16 text-center animate-fade-in">
            <Filter className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || attFilter !== "all" ? "No courses match your filters" : "No attendance data"}
            </p>
            {!searchQuery && attFilter === "all" && (
              <button onClick={handleRefresh} disabled={refreshAtt.isPending || isScraping} className="mt-3 text-xs text-highlight hover:underline">
                Refresh from server
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
