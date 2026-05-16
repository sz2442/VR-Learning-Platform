import { motion } from 'framer-motion';
import { BookOpen, Trophy, TrendingUp } from 'lucide-react';
import { Card, PageLoader } from '@/components/ui';
import { CourseGrid } from '@/components/courses';
import { useCourses } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';

export function MyLearningPage() {
  const { user } = useAuthStore();
  const { data: courses = [], isLoading } = useCourses();

  // For now, show all courses as "enrolled" - in production, 
  // this would fetch user's enrolled courses and progress
  const enrolledCourses = courses.slice(0, 3);

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold">My Learning</h1>
          <p className="mt-2 text-surface-500">
            Welcome back, {user?.name || 'Learner'}! Continue where you left off.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                <p className="text-sm text-surface-500">Courses Enrolled</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-surface-500">Quizzes Completed</p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm text-surface-500">Avg. Difficulty</p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Enrolled Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continue Learning</h2>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : enrolledCourses.length > 0 ? (
            <CourseGrid courses={enrolledCourses} />
          ) : (
            <Card className="py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
              <h3 className="mt-4 font-semibold">No courses yet</h3>
              <p className="mt-2 text-surface-500">
                Start exploring our catalog to begin your learning journey.
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
