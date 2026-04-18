import { useState, useMemo } from "react";
import type { AttendanceCourse } from "@/lib/api";

export type AttendanceFilter = "all" | "safe" | "warning" | "danger";

export function useAttendanceFilter(attendanceData: AttendanceCourse[]) {
  const [attFilter, setAttFilter] = useState<AttendanceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      data = data.filter(
        (c) => c.course.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    }
    return data;
  }, [attendanceData, attFilter, searchQuery]);

  const filterButtons = [
    { label: "All", value: "all" as AttendanceFilter, count: attendanceData.length },
    { label: "On Track", value: "safe" as AttendanceFilter, count: attendanceData.filter((c) => c.percentage >= 75).length },
    { label: "At Risk", value: "warning" as AttendanceFilter, count: attendanceData.filter((c) => c.percentage >= 65 && c.percentage < 75).length },
    { label: "Critical", value: "danger" as AttendanceFilter, count: attendanceData.filter((c) => c.percentage < 65).length },
  ];

  return {
    attFilter,
    setAttFilter,
    searchQuery,
    setSearchQuery,
    filteredAttendance,
    filterButtons,
  };
}
