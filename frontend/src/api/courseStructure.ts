import apiClient from './client';
import type {
  CourseStructure,
  LessonContent,
  MiniQuizQuestion,
  MiniQuizResult,
  CourseProgress,
  SubmitMiniQuizAnswer,
} from '@/types';

export const courseStructureApi = {
  getCourseStructure: async (courseId: number): Promise<CourseStructure> => {
    const response = await apiClient.get<CourseStructure>(`/courses/${courseId}/modules`);
    return response.data;
  },

  getLessonContent: async (lessonId: number): Promise<LessonContent> => {
    const response = await apiClient.get<LessonContent>(`/lessons/${lessonId}`);
    return response.data;
  },

  getMiniQuizQuestions: async (moduleId: number): Promise<MiniQuizQuestion[]> => {
    const response = await apiClient.get<MiniQuizQuestion[]>(`/modules/${moduleId}/miniquiz`);
    return response.data;
  },

  markLessonComplete: async (lessonId: number, courseId: number, moduleId: number): Promise<void> => {
    await apiClient.post('/progress/lesson', { lessonId, courseId, moduleId });
  },

  submitMiniQuiz: async (
    moduleId: number,
    courseId: number,
    answers: SubmitMiniQuizAnswer[]
  ): Promise<MiniQuizResult> => {
    const response = await apiClient.post<MiniQuizResult>('/progress/miniquiz', {
      moduleId,
      courseId,
      answers,
    });
    return response.data;
  },

  getCourseProgress: async (courseId: number): Promise<CourseProgress> => {
    const response = await apiClient.get<CourseProgress>(`/progress/${courseId}`);
    return response.data;
  },
};
