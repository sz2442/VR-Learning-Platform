import apiClient from './client';
import type { StudentStats, CourseProgressSummary, ActivityEntry, AccuracyPoint } from '@/types';

export const studentsApi = {
  getStats: async (): Promise<StudentStats> => {
    const { data } = await apiClient.get('/students/me/stats');
    return data;
  },

  getProgress: async (): Promise<CourseProgressSummary[]> => {
    const { data } = await apiClient.get('/students/me/progress');
    return data;
  },

  getActivity: async (): Promise<ActivityEntry[]> => {
    const { data } = await apiClient.get('/students/me/activity');
    return data;
  },

  getAccuracyHistory: async (): Promise<AccuracyPoint[]> => {
    const { data } = await apiClient.get('/students/me/accuracy-history');
    return data;
  },
};
