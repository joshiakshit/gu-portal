import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAttendance,
  fetchTimetable,
  fetchStatus,
  refreshAttendance,
  refreshTimetable,
  refreshAll,
} from "@/lib/api";

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data } = await fetchAttendance();
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTimetable(week: number) {
  return useQuery({
    queryKey: ["timetable", week],
    queryFn: async () => {
      const { data } = await fetchTimetable(week);
      return data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const { data } = await fetchStatus();
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useRefresh() {
  const queryClient = useQueryClient();

  const refreshAttendanceMutation = useMutation({
    mutationFn: refreshAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });

  const refreshTimetableMutation = useMutation({
    mutationFn: refreshTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });

  const refreshAllMutation = useMutation({
    mutationFn: refreshAll,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  return {
    refreshAttendance: refreshAttendanceMutation,
    refreshTimetable: refreshTimetableMutation,
    refreshAll: refreshAllMutation,
  };
}
