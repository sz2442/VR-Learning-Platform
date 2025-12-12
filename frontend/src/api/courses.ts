import apiClient from './client';
import type { Course, CourseDetail } from '@/types';

export const coursesApi = {
  getAll: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/courses');
    return response.data;
  },

  getById: async (id: number): Promise<CourseDetail> => {
    const response = await apiClient.get<CourseDetail>(`/courses/${id}`);
    return response.data;
  },
};
