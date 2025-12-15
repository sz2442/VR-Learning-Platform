import { Link } from 'react-router-dom';
import { X, GraduationCap } from 'lucide-react';
import { DifficultyIndicator, Progress } from '@/components/ui';
import { useQuizStore } from '@/stores/quizStore';

interface QuizHeaderProps {
    totalQuestions?: number;
    onExit?: () => void;
}

export function QuizHeader({ totalQuestions = 10, onExit }: QuizHeaderProps) {
    const { currentDifficulty, answeredCount } = useQuizStore();

    // 🔥 ФИКС: Ограничиваем число, чтобы не показывать 11/10
    const displayCount = Math.min(answeredCount + 1, totalQuestions);
    // Прогресс бар тоже не должен улетать за 100%
    const progressValue = Math.min(answeredCount, totalQuestions);

    return (
        <header className="glass sticky top-0 z-50 border-b border-surface-200 dark:border-surface-800">
            <div className="mx-auto max-w-4xl px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="hidden font-display font-bold sm:block">Quiz</span>
                    </Link>

                    {/* Progress */}
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <span className="text-surface-500">Question {displayCount} of {totalQuestions}</span>
                        </div>
                        <Progress value={progressValue} max={totalQuestions} />
                    </div>

                    {/* Difficulty & Exit */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32">
                            <DifficultyIndicator level={currentDifficulty} showLabel={false} />
                            <p className="text-xs text-center text-surface-400 mt-1">Level {currentDifficulty}</p>
                        </div>

                        <button
                            onClick={onExit}
                            className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 transition-colors"
                            title="Exit quiz"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}