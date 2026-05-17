import { useQuery, useMutation } from '@tanstack/react-query';
import { quizApi } from '@/api';
import { useQuizStore } from '@/stores/quizStore';
import type { SubmitAnswerDto } from '@/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function useStartQuiz() {
  const startSession = useQuizStore((state) => state.startSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (courseId: number) => quizApi.startSession(courseId, undefined, 'final'),
    onSuccess: (data, courseId) => {
      startSession(data.sessionId, courseId);
      navigate(`/quiz/${data.sessionId}`);
      toast.success('Quiz started! Good luck!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start quiz');
    },
  });
}

export function useNextQuestion(sessionId: number | null, nonce: number = 0) {
  const startQuestion = useQuizStore((state) => state.startQuestion);

  return useQuery({
    // nonce changes on every refetch call so React Query never serves stale data
    queryKey: ['quiz', 'question', sessionId, nonce],
    queryFn: async () => {
      const question = await quizApi.getNextQuestion(sessionId!);
      if (question) startQuestion();
      return question; // null means pool exhausted
    },
    enabled: !!sessionId,
    staleTime: Infinity, // data is request-specific; nonce ensures freshness
    refetchOnWindowFocus: false,
  });
}

export function useSubmitAnswer() {
  const recordAnswer = useQuizStore((state) => state.recordAnswer);

  return useMutation({
    mutationFn: (data: SubmitAnswerDto) => quizApi.submitAnswer(data),
    onSuccess: (result) => {
      recordAnswer(result.isCorrect, result.newDifficulty);
      
      // Show feedback
      if (result.isCorrect) {
        toast.success(result.feedback || 'Correct!', { icon: '🎉' });
      } else {
        toast.error(result.feedback || 'Incorrect', { icon: '❌' });
      }

      },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit answer');
    },
  });
}

export function useQuizStats(sessionId: number | null) {
    return useQuery({
        queryKey: ['quiz', 'stats', sessionId],
        queryFn: async () => {
            if (!sessionId || isNaN(sessionId)) {
                throw new Error('Invalid session ID for stats');
            }
            console.log('📊 Fetching stats for session:', sessionId);
            return quizApi.getStats(sessionId);
        },
        enabled: sessionId !== null && !isNaN(sessionId),
        staleTime: 0,
    });
}
