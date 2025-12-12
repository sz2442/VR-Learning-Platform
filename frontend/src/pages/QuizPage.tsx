import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizHeader, QuizQuestion, QuizResults } from '@/components/quiz';
import { PageLoader } from '@/components/ui';
import { useNextQuestion, useSubmitAnswer, useQuizStats, useStartQuiz } from '@/hooks';
import { useQuizStore } from '@/stores/quizStore';

const MAX_QUESTIONS = 10;

export function QuizPage() {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessionId = Number(sessionIdParam);

  const { answeredCount, courseId, resetSession, getTimeSpent } = useQuizStore();
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; selectedId: number } | null>(null);

  const { data: question, isLoading: isLoadingQuestion, refetch } = useNextQuestion(
    showResults ? null : sessionId
  );
  const { data: stats, refetch: refetchStats } = useQuizStats(showResults ? sessionId : null);
  const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer();
  const { mutate: startQuiz} = useStartQuiz();

  // Check if quiz is complete
  useEffect(() => {
    if (answeredCount >= MAX_QUESTIONS || question === null) {
      setShowResults(true);
      refetchStats();
    }
  }, [answeredCount, question, refetchStats]);

  const handleSubmit = (answerId: number) => {
    const timeSpent = getTimeSpent();
    
    submitAnswer(
      {
        sessionId,
        questionId: question!.questionId,
          selectedAnswerId: answerId,
        timeSpentSeconds: timeSpent,
      },
      {
        onSuccess: (result) => {
          setLastResult({ isCorrect: result.isCorrect, selectedId: answerId });
          
          // Show result briefly, then load next question
          setTimeout(() => {
            setLastResult(null);
            if (answeredCount + 1 >= MAX_QUESTIONS) {
              setShowResults(true);
              refetchStats();
            } else {
              refetch();
            }
          }, 1500);
        },
      }
    );
  };

  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
      resetSession();
      navigate('/');
    }
  };

  const handleRetry = () => {
    if (courseId) {
      resetSession();
      startQuiz(courseId);
    }
  };

  // Show results
  if (showResults && stats) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
        <QuizResults stats={stats} onRetry={handleRetry} />
      </div>
    );
  }

  // Loading states
  if (isLoadingQuestion && !question) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
        <QuizHeader totalQuestions={MAX_QUESTIONS} onExit={handleExit} />
        <div className="mx-auto max-w-3xl px-4 py-12">
          <PageLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <QuizHeader totalQuestions={MAX_QUESTIONS} onExit={handleExit} />
      
      <div className="mx-auto max-w-3xl px-4 py-12">
        <QuizQuestion
          question={question}
          isLoading={isLoadingQuestion}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          lastResult={lastResult}
        />
      </div>
    </div>
  );
}
