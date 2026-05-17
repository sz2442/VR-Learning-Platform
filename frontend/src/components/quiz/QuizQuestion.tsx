import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MousePointerClick } from 'lucide-react';
import { Button, QuestionSkeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Question, AnswerOption } from '@/types';

interface QuizQuestionProps {
  question: Question | undefined;
  isLoading: boolean;
  onSubmit: (answerId: number) => void;
  isSubmitting: boolean;
  lastResult?: { isCorrect: boolean; selectedId: number } | null;
}

export function QuizQuestion({ 
  question, 
  isLoading, 
  onSubmit, 
  isSubmitting,
  lastResult 
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Reset selection whenever the question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [question?.questionId]);

  const handleSelect = (answerId: number) => {
    if (isSubmitting || lastResult) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || isSubmitting) return;
    onSubmit(selectedAnswer);
  };

    if (isLoading) {
    return <QuestionSkeleton />;
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-500">No question available</p>
      </div>
    );
  }

  if (question.questionType === 'dragdrop') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            Difficulty: {question.difficultyLevel}/10
          </span>
          <h2 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-100">
            {question.text}
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
          <MousePointerClick className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This is a drag-and-drop question — available in VR mode. Crediting automatically…
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.questionId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Question text */}
        <div className="space-y-2">
          <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            Difficulty: {question.difficultyLevel}/10
          </span>
          <h2 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-100">
            {question.text}
          </h2>
        </div>

        {/* Answer options */}
        <div className="space-y-3">
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={answer.answerId}
              answer={answer}
              index={index}
              isSelected={selectedAnswer === answer.answerId}
              isCorrect={lastResult?.isCorrect && lastResult.selectedId === answer.answerId}
              isWrong={lastResult && !lastResult.isCorrect && lastResult.selectedId === answer.answerId}
              disabled={isSubmitting || !!lastResult}
              onClick={() => handleSelect(answer.answerId)}
            />
          ))}
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={selectedAnswer === null || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Checking...' : 'Submit Answer'}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface AnswerButtonProps {
  answer: AnswerOption;
  index: number;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled: boolean;
  onClick: () => void;
}

function AnswerButton({ 
  answer, 
  index, 
  isSelected, 
  isCorrect, 
  isWrong,
  disabled, 
  onClick 
}: AnswerButtonProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group w-full rounded-xl border-2 p-4 text-left transition-all duration-200',
        'flex items-center gap-4',
        isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20',
        isWrong && 'border-red-500 bg-red-50 dark:bg-red-900/20',
        !isCorrect && !isWrong && isSelected && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
        !isCorrect && !isWrong && !isSelected && 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700',
        disabled && !isCorrect && !isWrong && 'opacity-60 cursor-not-allowed'
      )}
    >
      {/* Letter indicator */}
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-semibold transition-colors',
        isCorrect && 'bg-green-500 text-white',
        isWrong && 'bg-red-500 text-white',
        !isCorrect && !isWrong && isSelected && 'bg-primary-500 text-white',
        !isCorrect && !isWrong && !isSelected && 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 group-hover:bg-primary-100 group-hover:text-primary-600 dark:group-hover:bg-primary-900/30 dark:group-hover:text-primary-400'
      )}>
        {isCorrect ? <Check className="h-5 w-5" /> : isWrong ? <X className="h-5 w-5" /> : letters[index]}
      </div>

      {/* Answer text */}
      <span className={cn(
        'flex-1 font-medium',
        isCorrect && 'text-green-700 dark:text-green-400',
        isWrong && 'text-red-700 dark:text-red-400',
        !isCorrect && !isWrong && 'text-surface-700 dark:text-surface-300'
      )}>
        {answer.text}
      </span>
    </motion.button>
  );
}
