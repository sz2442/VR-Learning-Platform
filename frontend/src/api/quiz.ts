import apiClient from './client';
import type { Question, SubmitAnswerDto, SubmitAnswerResult, SessionStats, QuizSession } from '@/types';

export const quizApi = {
  startSession: async (courseId: number): Promise<QuizSession> => {
    const response = await apiClient.post<QuizSession>(`/quiz/start?courseId=${courseId}`);
    return response.data;
  },

  getNextQuestion: async (sessionId: number): Promise<Question> => {
    const response = await apiClient.get<Question>(`/quiz/next-question?sessionId=${sessionId}`);
    return response.data;
  },

  submitAnswer: async (data: SubmitAnswerDto): Promise<SubmitAnswerResult> => {
    const response = await apiClient.post<SubmitAnswerResult>('/quiz/submit-answer', data);
    return response.data;
  },

  getStats: async (sessionId: number): Promise<SessionStats> => {
    const response = await apiClient.get<SessionStats>(`/quiz/stats?sessionId=${sessionId}`);
    return response.data;
  },
};
