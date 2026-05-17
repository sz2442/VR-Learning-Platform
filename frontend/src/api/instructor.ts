import apiClient from './client';
import type {
  InstructorStats,
  InstructorStudent,
  StudentDetail,
  CourseQuestionGroup,
  SaveQuestionPayload,
  DailyActive,
} from '@/types';

export const instructorApi = {
  getStats: async (): Promise<InstructorStats> => {
    const { data } = await apiClient.get('/instructor/stats');
    return data;
  },

  getStudents: async (): Promise<InstructorStudent[]> => {
    const { data } = await apiClient.get('/instructor/students');
    return data;
  },

  getStudentDetail: async (userId: number): Promise<StudentDetail> => {
    const { data } = await apiClient.get(`/instructor/students/${userId}/details`);
    return data;
  },

  getCourseQuestions: async (courseId: number): Promise<CourseQuestionGroup[]> => {
    const { data } = await apiClient.get(`/instructor/courses/${courseId}/questions`);
    return data;
  },

  addQuestion: async (payload: SaveQuestionPayload): Promise<{ id: number }> => {
    const { data } = await apiClient.post('/instructor/questions', payload);
    return data;
  },

  updateQuestion: async (id: number, payload: SaveQuestionPayload): Promise<void> => {
    await apiClient.put(`/instructor/questions/${id}`, payload);
  },

  getDailyActive: async (): Promise<DailyActive[]> => {
    const { data } = await apiClient.get('/instructor/analytics/daily-active');
    return data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await apiClient.delete(`/instructor/questions/${id}`);
  },

  updateLessonContent: async (lessonId: number, contentText: string, videoUrl: string | null): Promise<void> => {
    await apiClient.put(`/instructor/lessons/${lessonId}/content`, { contentText, videoUrl });
  },
};
