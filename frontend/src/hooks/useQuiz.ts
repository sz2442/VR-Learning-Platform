import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/api';
import { useQuizStore } from '@/stores/quizStore';
import type { SubmitAnswerDto } from '@/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function useStartQuiz() {
  const startSession = useQuizStore((state) => state.startSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (courseId: number) => quizApi.startSession(courseId),
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

export function useNextQuestion(sessionId: number | null) {
  const startQuestion = useQuizStore((state) => state.startQuestion);

  return useQuery({
    queryKey: ['quiz', 'question', sessionId],
    queryFn: async () => {
      const question = await quizApi.getNextQuestion(sessionId!);
      startQuestion();
      return question;
    },
    enabled: !!sessionId,
    staleTime: 0, // Always fetch fresh question
    refetchOnWindowFocus: false,
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
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

      // Invalidate to get next question
      queryClient.invalidateQueries({ queryKey: ['quiz', 'question'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit answer');
    },
  });
}

export function useQuizStats(sessionId: number | null) {
  return useQuery({
    queryKey: ['quiz', 'stats', sessionId],
    queryFn: () => quizApi.getStats(sessionId!),
    enabled: !!sessionId,
  });
}
