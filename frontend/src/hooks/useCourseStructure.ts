import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseStructureApi } from '@/api/courseStructure';
import type { SubmitMiniQuizAnswer } from '@/types';

export function useCourseStructure(courseId: number) {
  return useQuery({
    queryKey: ['course-structure', courseId],
    queryFn: () => courseStructureApi.getCourseStructure(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });
}

export function useLessonContent(lessonId: number | null) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => courseStructureApi.getLessonContent(lessonId!),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMiniQuizQuestions(moduleId: number | null) {
  return useQuery({
    queryKey: ['miniquiz', moduleId],
    queryFn: () => courseStructureApi.getMiniQuizQuestions(moduleId!),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourseProgress(courseId: number) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => courseStructureApi.getCourseProgress(courseId),
    enabled: !!courseId,
    staleTime: 10 * 1000,
  });
}

export function useMarkLessonComplete(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, moduleId }: { lessonId: number; moduleId: number }) =>
      courseStructureApi.markLessonComplete(lessonId, courseId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    },
  });
}

export function useSubmitMiniQuiz(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, answers }: { moduleId: number; answers: SubmitMiniQuizAnswer[] }) =>
      courseStructureApi.submitMiniQuiz(moduleId, courseId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-structure', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      // Invalidate student dashboard so the new session shows up
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      queryClient.invalidateQueries({ queryKey: ['accuracy-history'] });
      queryClient.invalidateQueries({ queryKey: ['student-activity'] });
    },
  });
}
