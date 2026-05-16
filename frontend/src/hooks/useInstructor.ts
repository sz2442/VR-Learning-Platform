import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/instructor';
import type { SaveQuestionPayload } from '@/types';

export function useInstructorStats() {
  return useQuery({
    queryKey: ['instructor-stats'],
    queryFn: instructorApi.getStats,
    staleTime: 60 * 1000,
  });
}

export function useInstructorStudents() {
  return useQuery({
    queryKey: ['instructor-students'],
    queryFn: instructorApi.getStudents,
    staleTime: 60 * 1000,
  });
}

export function useStudentDetail(userId: number | null) {
  return useQuery({
    queryKey: ['student-detail', userId],
    queryFn: () => instructorApi.getStudentDetail(userId!),
    enabled: userId !== null,
    staleTime: 30 * 1000,
  });
}

export function useCourseQuestions(courseId: number | null) {
  return useQuery({
    queryKey: ['course-questions', courseId],
    queryFn: () => instructorApi.getCourseQuestions(courseId!),
    enabled: courseId !== null,
    staleTime: 30 * 1000,
  });
}

export function useAddQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: instructorApi.addQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-questions'] });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SaveQuestionPayload }) =>
      instructorApi.updateQuestion(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-questions'] });
    },
  });
}

export function useDailyActive() {
  return useQuery({
    queryKey: ['daily-active'],
    queryFn: instructorApi.getDailyActive,
    staleTime: 5 * 60 * 1000,
  });
}
