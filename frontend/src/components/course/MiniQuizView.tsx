import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { useMiniQuizQuestions, useSubmitMiniQuiz } from '@/hooks/useCourseStructure';
import { PageLoader } from '@/components/ui';
import type { MiniQuizResult, SubmitMiniQuizAnswer } from '@/types';

interface MiniQuizViewProps {
  moduleId: number;
  moduleTitle: string;
  courseId: number;
  isPassed: boolean;
  passingScore: number;
  onPass: () => void;
}

export function MiniQuizView({ moduleId, moduleTitle, courseId, isPassed, passingScore, onPass }: MiniQuizViewProps) {
  const { data: questions, isLoading } = useMiniQuizQuestions(moduleId);
  const { mutate: submitQuiz, isPending } = useSubmitMiniQuiz(courseId);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [result, setResult] = useState<MiniQuizResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!questions || questions.length === 0)
    return <div className="p-8 text-center text-surface-500">No quiz questions found for this module.</div>;

  const handleSelectAnswer = (questionId: number, answerId: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = () => {
    const answers: SubmitMiniQuizAnswer[] = questions.map((q) => ({
      questionId: q.questionId,
      selectedAnswerId: q.questionType === 'mcq' ? (selectedAnswers[q.questionId] ?? undefined) : undefined,
      dragDropIsCorrect: q.questionType === 'dragdrop' ? true : undefined, // simplified: treat as correct for drag-drop
    }));

    submitQuiz({ moduleId, answers }, {
      onSuccess: (res) => {
        setResult(res);
        setSubmitted(true);
        if (res.passed) onPass();
      },
    });
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setResult(null);
    setSubmitted(false);
  };

  const allAnswered = questions
    .filter((q) => q.questionType === 'mcq')
    .every((q) => selectedAnswers[q.questionId] != null);

  if (result) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        {result.passed ? (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        )}
        <h2 className="text-2xl font-bold font-display mb-2">
          {result.passed ? 'Quiz Passed!' : 'Quiz Failed'}
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-6">
          You scored <strong>{result.score}%</strong> ({result.correctAnswers}/{result.totalQuestions} correct).
          {!result.passed && ` You need ${result.passingScore}% to pass.`}
        </p>
        {result.passed && result.nextModuleUnlocked && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
            Next module unlocked!
          </div>
        )}
        {!result.passed && (
          <Button variant="secondary" onClick={handleRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (isPassed) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-display mb-2">Module Quiz Passed</h2>
        <p className="text-surface-500">You've already passed this quiz. Move on to the next module!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white">
          {moduleTitle} — Module Quiz
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Answer all {questions.length} questions. You need {passingScore}% to pass and unlock the next module.
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, idx) => {
          if (question.questionType === 'dragdrop') {
            return (
              <div key={question.questionId} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-bold text-surface-400 mt-0.5">{idx + 1}</span>
                  <p className="text-surface-900 dark:text-white font-medium text-sm">{question.text}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Drag-and-drop questions are auto-credited in the module quiz.
                </div>
              </div>
            );
          }

          return (
            <div key={question.questionId} className="p-4 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-bold text-surface-400 mt-0.5">{idx + 1}</span>
                <p className="text-surface-900 dark:text-white font-medium">{question.text}</p>
              </div>
              <div className="space-y-2">
                {question.answers.map((answer) => {
                  const selected = selectedAnswers[question.questionId] === answer.answerId;
                  return (
                    <button
                      key={answer.answerId}
                      onClick={() => handleSelectAnswer(question.questionId, answer.answerId)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {answer.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          isLoading={isPending}
          disabled={!allAnswered}
        >
          Submit Quiz
        </Button>
        {!allAnswered && (
          <p className="mt-2 text-xs text-surface-400">Answer all multiple-choice questions to submit.</p>
        )}
      </div>
    </div>
  );
}
