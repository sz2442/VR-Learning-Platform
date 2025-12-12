import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BarChart3, Play, CheckCircle } from 'lucide-react';
import { Button, Badge, PageLoader, DifficultyIndicator, Card } from '@/components/ui';
import { useCourse, useStartQuiz } from '@/hooks';
import { useAuthStore } from '@/stores/authStore';
import { formatDuration, getDifficultyBadgeClass } from '@/lib/utils';

export function CourseDetailPage() {
    const { courseId: paramId } = useParams<{ courseId: string }>();
    const courseId = Number(paramId);

  const { isAuthenticated } = useAuthStore();
  const { data: course, isLoading, error } = useCourse(courseId);
  const { mutate: startQuiz, isPending: isStarting } = useStartQuiz();

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    startQuiz(courseId);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !course) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Course not found</h2>
          <p className="mt-2 text-surface-500">The course you're looking for doesn't exist.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-surface-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Badge className={getDifficultyBadgeClass(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                
                <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                  {course.title}
                </h1>
                
                <p className="mt-4 text-lg text-surface-300">
                  {course.shortDescription}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-surface-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{formatDuration(course.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Adaptive difficulty 1-10</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Start Quiz Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white text-surface-900">
                <h3 className="font-display text-xl font-semibold">Ready to learn?</h3>
                <p className="mt-2 text-sm text-surface-500">
                  Start an adaptive quiz session that adjusts to your skill level in real-time.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>AI-powered adaptation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant feedback</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Detailed analytics</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="mt-6 w-full"
                  onClick={handleStartQuiz}
                  isLoading={isStarting}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isAuthenticated ? 'Start Quiz' : 'Login to Start'}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <h2 className="font-display text-xl font-semibold mb-4">About this course</h2>
                <div className="prose prose-surface dark:prose-invert max-w-none">
                  <p className="text-surface-600 dark:text-surface-300 whitespace-pre-line">
                    {course.description || course.shortDescription}
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <h2 className="font-display text-xl font-semibold mb-4">How Adaptive Learning Works</h2>
                <div className="space-y-4">
                  <Step
                    number={1}
                    title="Start at your level"
                    description="The quiz begins at a difficulty suited to beginners, or your previous level if you've taken it before."
                  />
                  <Step
                    number={2}
                    title="Real-time adaptation"
                    description="Answer correctly and questions get harder. Struggle a bit, and we'll give you easier questions to build confidence."
                  />
                  <Step
                    number={3}
                    title="Track your progress"
                    description="See detailed analytics showing how your difficulty level changed throughout the session."
                  />
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <h3 className="font-semibold mb-4">Difficulty Range</h3>
                <DifficultyIndicator level={5} showLabel />
                <p className="mt-3 text-sm text-surface-500">
                  Questions range from level 1 (easiest) to level 10 (hardest). 
                  The AI will find your optimal difficulty.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
        {number}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
    </div>
  );
}
