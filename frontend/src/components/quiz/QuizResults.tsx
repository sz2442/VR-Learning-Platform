import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Home, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, DifficultyIndicator } from '@/components/ui';
import { formatAccuracy } from '@/lib/utils';
import type { SessionStats } from '@/types';

interface QuizResultsProps {
  stats: SessionStats;
  onRetry?: () => void;
}

export function QuizResults({ stats, onRetry }: QuizResultsProps) {
  const { t } = useTranslation('quiz');

  const accuracy = stats.totalQuestions > 0
    ? (stats.correctAnswers / stats.totalQuestions) * 100
    : 0;

  const getGrade = (acc: number) => {
    if (acc >= 90) return { labelKey: 'results.grades.excellent', emoji: '🏆', color: 'text-yellow-500' };
    if (acc >= 80) return { labelKey: 'results.grades.great', emoji: '🌟', color: 'text-green-500' };
    if (acc >= 70) return { labelKey: 'results.grades.good', emoji: '👍', color: 'text-blue-500' };
    if (acc >= 60) return { labelKey: 'results.grades.notBad', emoji: '📚', color: 'text-orange-500' };
    return { labelKey: 'results.grades.keepPracticing', emoji: '💪', color: 'text-red-500' };
  };

  const grade = getGrade(accuracy);

  const getDifficultyComment = () => {
    if (stats.finalDifficulty > 7) return t('results.advanced');
    if (stats.finalDifficulty > 4) return t('results.intermediate');
    return t('results.keepPracticing');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mb-6"
        >
          <span className="text-7xl">{grade.emoji}</span>
        </motion.div>

        <h1 className={`font-display text-4xl font-bold ${grade.color}`}>
          {t(grade.labelKey)}
        </h1>
        <p className="mt-2 text-lg text-surface-500">
          {t('results.completed')}
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Target className="h-6 w-6 text-primary-500" />
              <span className="text-sm font-medium text-surface-500">{t('results.accuracy')}</span>
            </div>
            <p className="text-4xl font-bold text-surface-900 dark:text-white">
              {formatAccuracy(accuracy)}
            </p>
            <p className="text-sm text-surface-400 mt-1">
              {t('results.correct', { correct: stats.correctAnswers, total: stats.totalQuestions })}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-accent-500" />
              <span className="text-sm font-medium text-surface-500">{t('results.finalLevel')}</span>
            </div>
            <p className="text-4xl font-bold text-surface-900 dark:text-white">
              {stats.finalDifficulty}
            </p>
            <p className="text-sm text-surface-400 mt-1">
              {t('results.outOf10')}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Difficulty indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <Card>
          <h3 className="mb-4 font-semibold">{t('results.finalDifficultyLabel')}</h3>
          <DifficultyIndicator level={stats.finalDifficulty} />
          <p className="mt-3 text-sm text-surface-500">{getDifficultyComment()}</p>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        {onRetry && (
          <Button variant="primary" size="lg" onClick={onRetry}>
            <RotateCcw className="mr-2 h-5 w-5" />
            {t('results.tryAgain')}
          </Button>
        )}
        <Link to="/">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Home className="mr-2 h-5 w-5" />
            {t('results.backToCourses')}
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
