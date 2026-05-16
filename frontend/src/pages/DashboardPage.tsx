import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  BookOpen,
  CheckCircle,
  Clock,
  Flame,
  Star,
  Zap,
} from 'lucide-react';
import { Skeleton } from '@/components/ui';
import {
  StatsCard,
  AccuracyChart,
  DifficultyChart,
  CourseProgressCard,
  ActivityTable,
} from '@/components/dashboard';
import {
  useStudentStats,
  useStudentProgress,
  useStudentActivity,
  useAccuracyHistory,
} from '@/hooks/useStudentDashboard';
import { useAuthStore } from '@/stores/authStore';

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: progress = [], isLoading: progressLoading } = useStudentProgress();
  const { data: activity = [], isLoading: activityLoading } = useStudentActivity();
  const { data: accuracyHistory = [], isLoading: historyLoading } = useAccuracyHistory();

  const hasData = (stats?.totalSessions ?? 0) > 0;
  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── Profile header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-xl font-bold text-white shadow-lg shadow-primary-500/25">
            {user?.name ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-100">
                {user?.name ?? 'Student'}
              </h1>
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                Student
              </span>
            </div>
            <p className="text-sm text-surface-500">{user?.email}</p>
            {memberSince && (
              <p className="text-xs text-surface-400 mt-0.5">Member since {memberSince}</p>
            )}
          </div>
        </motion.div>

        {/* ── Stats row ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <>
              <StatsCard
                icon={<Activity className="h-6 w-6" />}
                value={stats?.totalSessions ?? 0}
                label="Total Sessions"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600 dark:text-blue-400"
              />
              <StatsCard
                icon={<CheckCircle className="h-6 w-6" />}
                value={`${stats?.averageAccuracy ?? 0}%`}
                label="Avg. Accuracy"
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconColor="text-green-600 dark:text-green-400"
              />
              <StatsCard
                icon={<Zap className="h-6 w-6" />}
                value={stats?.bestDifficultyReached ?? 0}
                label="Best Difficulty"
                iconBg="bg-yellow-100 dark:bg-yellow-900/30"
                iconColor="text-yellow-600 dark:text-yellow-400"
              />
              <StatsCard
                icon={<Clock className="h-6 w-6" />}
                value={formatMinutes(stats?.totalTimeSpentMinutes ?? 0)}
                label="Time Spent"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconColor="text-purple-600 dark:text-purple-400"
              />
              <StatsCard
                icon={<Flame className="h-6 w-6" />}
                value={`${stats?.currentStreak ?? 0}d`}
                label="Current Streak"
                iconBg="bg-orange-100 dark:bg-orange-900/30"
                iconColor="text-orange-600 dark:text-orange-400"
              />
            </>
          )}
        </motion.div>

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!statsLoading && !hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-dashed border-primary-400/40 bg-surface-50 py-16 text-center dark:bg-surface-800/40"
          >
            <Star className="mx-auto h-12 w-12 text-primary-400 mb-4" />
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
              No sessions yet
            </h2>
            <p className="mt-2 text-surface-500">
              Complete your first quiz to start tracking your progress.
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-block rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition-colors"
            >
              Start your first quiz →
            </Link>
          </motion.div>
        )}

        {/* ── Charts ──────────────────────────────────────────────── */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4 lg:grid-cols-2"
          >
            {historyLoading ? (
              <>
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </>
            ) : accuracyHistory.length > 0 ? (
              <>
                <AccuracyChart data={accuracyHistory} />
                <DifficultyChart data={accuracyHistory} />
              </>
            ) : null}
          </motion.div>
        )}

        {/* ── Course progress ─────────────────────────────────────── */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
              Course Progress
            </h2>
            {progressLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : progress.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {progress.map((course) => (
                  <CourseProgressCard key={course.courseId} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-800/40">
                <BookOpen className="h-5 w-5 shrink-0" />
                <span>No course progress yet.</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Recent activity ─────────────────────────────────────── */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
              Recent Activity
            </h2>
            {activityLoading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : activity.length > 0 ? (
              <ActivityTable data={activity} />
            ) : null}
          </motion.div>
        )}

      </div>
    </div>
  );
}
