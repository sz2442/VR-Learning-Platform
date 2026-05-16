import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '@/api/students';

export function useStudentStats() {
  return useQuery({
    queryKey: ['student-stats'],
    queryFn: studentsApi.getStats,
    staleTime: 60 * 1000,
  });
}

export function useStudentProgress() {
  return useQuery({
    queryKey: ['student-progress'],
    queryFn: studentsApi.getProgress,
    staleTime: 60 * 1000,
  });
}

export function useStudentActivity() {
  return useQuery({
    queryKey: ['student-activity'],
    queryFn: studentsApi.getActivity,
    staleTime: 30 * 1000,
  });
}

export function useAccuracyHistory() {
  return useQuery({
    queryKey: ['accuracy-history'],
    queryFn: studentsApi.getAccuracyHistory,
    staleTime: 60 * 1000,
  });
}
