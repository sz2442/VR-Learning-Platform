import apiClient from './client';
import type { Question, SubmitAnswerDto, SubmitAnswerResult, SessionStats, QuizSession } from '@/types';

export const quizApi = {
  startSession: async (
    courseId: number,
    moduleId?: number,
    quizType?: 'mini' | 'final',
  ): Promise<QuizSession> => {
    const params = new URLSearchParams({ courseId: String(courseId) });
    if (moduleId != null) params.append('moduleId', String(moduleId));
    if (quizType)         params.append('quizType', quizType);
    const response = await apiClient.post<QuizSession>(`/quiz/start?${params}`);
    return response.data;
  },

  getNextQuestion: async (sessionId: number): Promise<Question | null> => {
    try {
      const response = await apiClient.get<Question>(`/quiz/next-question?sessionId=${sessionId}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null; // pool exhausted — quiz is done
      throw err;
    }
  },

  submitAnswer: async (data: SubmitAnswerDto): Promise<SubmitAnswerResult> => {
    const response = await apiClient.post<SubmitAnswerResult>('/quiz/submit-answer', data);
    return response.data;
  },

  getStats: async (sessionId: number): Promise<SessionStats> => {
    const response = await apiClient.get<SessionStats>(`/quiz/stats?sessionId=${sessionId}`);
    return response.data;
  },

  endSession: async (sessionId: number): Promise<void> => {
    await apiClient.post(`/quiz/end?sessionId=${sessionId}`);
  },
};
