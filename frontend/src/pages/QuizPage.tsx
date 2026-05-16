import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizHeader, QuizQuestion, QuizResults } from '@/components/quiz';
import { PageLoader } from '@/components/ui';
import { useNextQuestion, useSubmitAnswer, useQuizStats, useStartQuiz } from '@/hooks';
import { useQuizStore } from '@/stores/quizStore';
import toast from "react-hot-toast";

const MAX_QUESTIONS = 10;

export function QuizPage() {
    const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const sessionId = sessionIdParam ? Number(sessionIdParam) : null;
    const isValidSession = sessionId !== null && !isNaN(sessionId);

    const { answeredCount, courseId, resetSession, getTimeSpent, syncProgress } = useQuizStore();
    const [showResults, setShowResults] = useState(false);
    const [lastResult, setLastResult] = useState<{ isCorrect: boolean; selectedId: number } | null>(null);

    // Валидация сессии
    useEffect(() => {
        if (!isValidSession) {
            toast.error('Invalid quiz session');
            navigate('/');
        }
    }, [isValidSession, navigate]);

    // 1. Загрузка статистики
    const { data: stats, refetch: refetchStats, isLoading: isLoadingStats } = useQuizStats(
        isValidSession ? sessionId : null
    );

    useEffect(() => {
        if (stats) {
            syncProgress(stats.totalQuestions, stats.finalDifficulty);
            if (stats.totalQuestions >= MAX_QUESTIONS) {
                setShowResults(true);
            }
        }
    }, [stats, syncProgress]);

    // skip fetching once results are shown or limit is reached
    const shouldFetchQuestion = !showResults && isValidSession && answeredCount < MAX_QUESTIONS;

    const { data: question, isLoading: isLoadingQuestion, refetch } = useNextQuestion(
        shouldFetchQuestion ? sessionId : null
    );

    const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer();
    const { mutate: startQuiz } = useStartQuiz();

    useEffect(() => {
        if (shouldFetchQuestion && !isLoadingQuestion && !question && stats && stats.totalQuestions > 0) {
            setShowResults(true);
            refetchStats();
        }
    }, [question, isLoadingQuestion, shouldFetchQuestion, stats, refetchStats]);

    useEffect(() => {
        if (answeredCount >= MAX_QUESTIONS) {
            setShowResults(true);
            refetchStats();
        }
    }, [answeredCount, refetchStats]);

    const handleSubmit = (answerId: number) => {
        if (!isValidSession || sessionId === null) return;

        const timeSpent = getTimeSpent();

        submitAnswer({
            sessionId,
            questionId: question!.questionId,
            selectedAnswerId: answerId,
            timeSpentSeconds: timeSpent,
        }, {
            onSuccess: (result) => {
                setLastResult({ isCorrect: result.isCorrect, selectedId: answerId });

                setTimeout(() => {
                    setLastResult(null);

                    const currentCount = useQuizStore.getState().answeredCount;

                    if (currentCount >= MAX_QUESTIONS) {
                        setShowResults(true);
                        refetchStats();
                    } else {
                        refetch();
                    }
                }, 1000);
            },
        });
    };

    const handleExit = () => {
        if (confirm('Are you sure you want to exit?')) {
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

    if (showResults) {
        if (isLoadingStats || !stats) {
            return (
                <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
                    <PageLoader />
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
                <QuizResults stats={stats} onRetry={handleRetry} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
            <QuizHeader totalQuestions={MAX_QUESTIONS} onExit={handleExit} />
            <div className="mx-auto w-full max-w-3xl px-4 py-12 flex-1">
                {isLoadingQuestion && !question ? (
                    <PageLoader />
                ) : (
                    <QuizQuestion
                        question={question}
                        isLoading={isLoadingQuestion}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        lastResult={lastResult}
                    />
                )}
            </div>
        </div>
    );
}