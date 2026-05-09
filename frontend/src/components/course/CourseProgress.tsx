interface CourseProgressProps {
  completed: number;
  total: number;
}

export function CourseProgress({ completed, total }: CourseProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-surface-600 dark:text-surface-400 whitespace-nowrap">
        {completed}/{total} lessons
      </span>
    </div>
  );
}
