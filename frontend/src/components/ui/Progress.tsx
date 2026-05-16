import { cn, getDifficultyColor, getDifficultyLabel } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, showLabel = false }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-surface-500">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}

interface DifficultyIndicatorProps {
  level: number;
  maxLevel?: number;
  showLabel?: boolean;
  className?: string;
}

export function DifficultyIndicator({ 
  level, 
  maxLevel = 10, 
  showLabel = true,
  className 
}: DifficultyIndicatorProps) {
  const percentage = (level / maxLevel) * 100;
  const colorClass = getDifficultyColor(level);
  const label = getDifficultyLabel(level);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-surface-500">Difficulty</span>
          <span className="font-medium">
            Level {level} · {label}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
        <div
          className={cn('difficulty-indicator', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
