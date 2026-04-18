import axios from "axios";

// Configure your backend base URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types based on actual backend response shapes
export interface AttendanceCourse {
  course: string;
  code: string;
  attended: number;
  total: number;
  percentage: number;
}

export function transformAttendance(raw: Record<string, string>[]): AttendanceCourse[] {
  return raw
    .map((row) => {
      const code = (row["Course Code"] || row["course code"] || "").trim();
      const course = (row["Course Name"] || row["Subject"] || row["Course Short Name"] || code).trim();
      const ad = row["Attended/Delivered"] || row["attended/delivered"] || "";
      const [attendedStr, totalStr] = ad.split("/");
      const attended = parseInt(attendedStr) || 0;
      const total = parseInt(totalStr) || 0;
      const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
      return { code, course, attended, total, percentage };
    })
    .filter((r) => r.code && r.total > 0);
}

export interface AttendanceResponse {
  success: boolean;
  cachedAt: string;
  ageMinutes: number;
  data: AttendanceCourse[];
}

export interface TimetableSlot {
  time: string;
  [day: string]: string | null | { courseCode?: string; type?: string; room?: string; raw?: string };
}

export interface TimetableResponse {
  success: boolean;
  cachedAt: string;
  ageMinutes: number;
  header: string;
  slots: TimetableSlot[];
}

export interface StatusCache {
  exists: boolean;
  cachedAt: string | null;
  ageMinutes: number | null;
}

export interface StatusResponse {
  success: boolean;
  scraping: boolean;
  caches: Record<string, StatusCache>;
}

// API functions
export const fetchAttendance = () => api.get<AttendanceResponse>("/attendance");
export const fetchTodayAttendance = () => api.get("/attendance/today");
export const fetchDaywiseAttendance = () => api.get("/attendance/daywise");
export const fetchTimetable = (week: number = 0) => api.get<TimetableResponse>(`/timetable/${week}`);
export const fetchStatus = () => api.get<StatusResponse>("/status");
export const refreshAttendance = () => api.post("/refresh/attendance");
export const refreshTimetable = () => api.post("/refresh/timetable");
export const refreshAll = () => api.post("/refresh/all");

export default api;
