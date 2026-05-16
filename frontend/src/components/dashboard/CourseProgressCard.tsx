import { Link } from 'react-router-dom';
import { Calendar, Zap } from 'lucide-react';
import type { CourseProgressSummary } from '@/types';

interface CourseProgressCardProps {
  course: CourseProgressSummary;
}

export function CourseProgressCard({ course }: CourseProgressCardProps) {
  const lastDate = course.lastSessionDate
    ? new Date(course.lastSessionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No sessions yet';

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 dark:border-surface-700 dark:bg-surface-800/60">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-surface-900 dark:text-surface-100 leading-tight">
          {course.courseTitle}
        </h4>
        <span className="shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
          {course.completionPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
          style={{ width: `${course.completionPercentage}%` }}
        />
      </div>

      <p className="mb-4 text-xs text-surface-500">
        {course.modulesCompleted} / {course.modulesTotal} modules completed
      </p>

      <div className="flex items-center justify-between text-xs text-surface-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{lastDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-yellow-500" />
          <span>Best diff. {course.bestDifficulty}/10</span>
        </div>
      </div>

      <Link
        to={`/courses/${course.courseId}`}
        className="mt-4 block w-full rounded-lg border border-primary-500/40 py-1.5 text-center text-xs font-medium text-primary-500 transition-colors hover:bg-primary-500/10"
      >
        Continue →
      </Link>
    </div>
  );
}
