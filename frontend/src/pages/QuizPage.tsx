import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QuizHeader, QuizQuestion, QuizResults } from '@/components/quiz';
import { PageLoader } from '@/components/ui';
import { useNextQuestion, useSubmitAnswer, useQuizStats, useStartQuiz } from '@/hooks';
import { useQuizStore } from '@/stores/quizStore';
import { quizApi } from '@/api';
import toast from "react-hot-toast";

export function QuizPage() {
    const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const sessionId = sessionIdParam ? Number(sessionIdParam) : null;
    const isValidSession = sessionId !== null && !isNaN(sessionId);

    const { courseId, resetSession, getTimeSpent, syncProgress } = useQuizStore();
    const queryClient = useQueryClient();
    const [showResults, setShowResults] = useState(false);
    const [lastResult, setLastResult] = useState<{ isCorrect: boolean; selectedId: number } | null>(null);
    // nonce increments after each answer to force a fresh question fetch (avoids React Query serving stale data)
    const [nonce, setNonce] = useState(0);

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
        }
    }, [stats, syncProgress]);

    // skip fetching once results are shown
    const shouldFetchQuestion = !showResults && isValidSession;

    const { data: question, isLoading: isLoadingQuestion, isError: isQuestionError } = useNextQuestion(
        shouldFetchQuestion ? sessionId : null,
        nonce,
    );

    const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer();
    const { mutate: startQuiz } = useStartQuiz();

    const finishQuiz = useCallback(async (sid: number) => {
        try { await quizApi.endSession(sid); } catch { /* non-fatal */ }
        await queryClient.invalidateQueries({ queryKey: ['student-stats'] });
        await queryClient.invalidateQueries({ queryKey: ['student-progress'] });
        await queryClient.invalidateQueries({ queryKey: ['accuracy-history'] });
        await queryClient.invalidateQueries({ queryKey: ['student-activity'] });
    }, [queryClient]);

    // Auto-submit drag-drop questions (no drag-drop UI outside VR)
    useEffect(() => {
        if (!question || question.questionType !== 'dragdrop' || showResults || !isValidSession || sessionId === null) return;
        const timer = setTimeout(() => {
            submitAnswer({
                sessionId,
                questionId: question.questionId,
                dragDropIsCorrect: true,
                timeSpentSeconds: 0,
            }, {
                onSuccess: (result) => {
                    setLastResult({ isCorrect: result.isCorrect, selectedId: -1 });
                    setTimeout(async () => {
                        setLastResult(null);
                        const currentCount = useQuizStore.getState().answeredCount;
                        if (currentCount >= 20) {
                            setShowResults(true);
                            refetchStats();
                            if (sessionId) await finishQuiz(sessionId);
                        } else {
                            setNonce(n => n + 1);
                        }
                    }, 1000);
                },
            });
        }, 1500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question?.questionId, question?.questionType]);

    // Detect quiz done: backend returns null (pool exhausted)
    useEffect(() => {
        if (!isLoadingQuestion && question === null && !showResults) {
            setShowResults(true);
            refetchStats();
            if (sessionId) finishQuiz(sessionId);
        }
    }, [question, isLoadingQuestion, showResults, refetchStats, sessionId, finishQuiz]);

    // Redirect on session error (expired/invalid session)
    useEffect(() => {
        if (isQuestionError) {
            toast.error('Quiz session expired or not found');
            resetSession();
            navigate('/');
        }
    }, [isQuestionError, navigate, resetSession]);

    const handleSubmit = (answerId: number) => {
        if (!isValidSession || sessionId === null || !question) return;

        const timeSpent = getTimeSpent();

        submitAnswer({
            sessionId,
            questionId: question.questionId,
            selectedAnswerId: answerId,
            timeSpentSeconds: timeSpent,
        }, {
            onSuccess: (result) => {
                setLastResult({ isCorrect: result.isCorrect, selectedId: answerId });

                setTimeout(async () => {
                    setLastResult(null);
                    const currentCount = useQuizStore.getState().answeredCount;
                    if (currentCount >= 20) {
                        // Hard cap for final quiz
                        setShowResults(true);
                        refetchStats();
                        await finishQuiz(sessionId);
                    } else {
                        setNonce(n => n + 1); // triggers fresh question fetch
                    }
                }, 1000);
            },
        });
    };

    const handleExit = async () => {
        if (confirm('Are you sure you want to exit?')) {
            if (sessionId) {
                try { await quizApi.endSession(sessionId); } catch { /* non-fatal */ }
            }
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
            <QuizHeader totalQuestions={20} onExit={handleExit} />
            <div className="mx-auto w-full max-w-3xl px-4 py-12 flex-1">
                {isLoadingQuestion && !question ? (
                    <PageLoader />
                ) : (
                    <QuizQuestion
                        question={question ?? undefined}
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