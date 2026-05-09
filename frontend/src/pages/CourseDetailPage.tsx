import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BarChart3, Play } from 'lucide-react';
import { Button, Badge, PageLoader } from '@/components/ui';
import { useCourse, useStartQuiz } from '@/hooks';
import { useCourseStructure } from '@/hooks/useCourseStructure';
import { useAuthStore } from '@/stores/authStore';
import { formatDuration, getDifficultyBadgeClass } from '@/lib/utils';
import { ModuleSidebar } from '@/components/course/ModuleSidebar';
import { LessonView } from '@/components/course/LessonView';
import { MiniQuizView } from '@/components/course/MiniQuizView';
import { CourseProgress } from '@/components/course/CourseProgress';
import type { CourseModule } from '@/types';

type ContentView =
  | { type: 'lesson'; lessonId: number; moduleId: number }
  | { type: 'miniquiz'; moduleId: number }
  | { type: 'finalquiz' }
  | null;

export function CourseDetailPage() {
  const { courseId: paramId } = useParams<{ courseId: string }>();
  const courseId = Number(paramId);
  const navigate = useNavigate();

  const { isAuthenticated } = useAuthStore();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: structure, isLoading: structureLoading } = useCourseStructure(courseId);
  const { mutate: startQuiz, isPending: isStarting } = useStartQuiz();

  const [activeView, setActiveView] = useState<ContentView>(null);

  const isLoading = courseLoading || (isAuthenticated && structureLoading);

  if (isLoading) return <PageLoader />;

  if (!course) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Course not found</h2>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="primary">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the old detail view
  if (!isAuthenticated || !structure) {
    return <GuestCourseView course={course} onStart={() => navigate('/login')} />;
  }

  const handleStartFinalQuiz = () => {
    startQuiz(courseId);
  };

  const getActiveModule = (): CourseModule | undefined => {
    if (!activeView || activeView.type === 'finalquiz') return undefined;
    return structure.modules.find((m) => m.id === activeView.moduleId);
  };

  const getActiveLessonCompleted = (): boolean => {
    if (activeView?.type !== 'lesson') return false;
    const mod = getActiveModule();
    if (!mod) return false;
    return mod.lessons.find((l) => l.id === activeView.lessonId)?.isCompleted ?? false;
  };

  const renderMain = () => {
    if (!activeView) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
          <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
            Select a lesson or quiz from the sidebar
          </h2>
          <p className="text-surface-500 text-sm max-w-sm">
            Work through each module in order. Complete the module quiz to unlock the next module.
          </p>
        </div>
      );
    }

    if (activeView.type === 'finalquiz') {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
          <h2 className="text-2xl font-bold font-display mb-3 text-surface-900 dark:text-white">
            Final Quiz
          </h2>
          <p className="text-surface-500 mb-6 max-w-md">
            This is the adaptive final assessment. It uses AI to adjust question difficulty in real time
            based on your performance. Good luck!
          </p>
          <Button variant="primary" size="lg" onClick={handleStartFinalQuiz} isLoading={isStarting}>
            <Play className="mr-2 h-5 w-5" />
            Start Final Quiz
          </Button>
        </div>
      );
    }

    if (activeView.type === 'lesson') {
      return (
        <LessonView
          key={activeView.lessonId}
          lessonId={activeView.lessonId}
          moduleId={activeView.moduleId}
          courseId={courseId}
          isCompleted={getActiveLessonCompleted()}
          onComplete={() => {
            // auto-advance to next lesson or mini quiz
          }}
        />
      );
    }

    if (activeView.type === 'miniquiz') {
      const mod = getActiveModule();
      if (!mod) return null;
      return (
        <MiniQuizView
          key={activeView.moduleId}
          moduleId={activeView.moduleId}
          moduleTitle={mod.title}
          courseId={courseId}
          isPassed={mod.miniQuiz?.isPassed ?? false}
          passingScore={mod.miniQuiz?.passingScore ?? 70}
          onPass={() => {
            // sidebar will refresh via query invalidation
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact course header */}
      <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-2 text-surface-300 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="min-w-0">
              <Badge className={getDifficultyBadgeClass(course.difficulty)}>{course.difficulty}</Badge>
              <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{course.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-surface-300 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(course.durationMinutes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span>Adaptive difficulty</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:w-72">
              <CourseProgress
                completed={structure.completedLessons}
                total={structure.totalLessons}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 min-h-0 mx-auto w-full max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-surface-500">
              Course Content
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ModuleSidebar
              modules={structure.modules}
              hasFinalQuiz={structure.hasFinalQuiz}
              finalQuizUnlocked={structure.finalQuizUnlocked}
              activeView={activeView}
              onSelect={setActiveView}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: module accordion rendered inline above content */}
          <div className="lg:hidden border-b border-surface-200 dark:border-surface-700">
            <details className="group">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer font-medium text-sm text-surface-700 dark:text-surface-300">
                Course Content
                <span className="text-xs text-surface-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="border-t border-surface-200 dark:border-surface-700">
                <ModuleSidebar
                  modules={structure.modules}
                  hasFinalQuiz={structure.hasFinalQuiz}
                  finalQuizUnlocked={structure.finalQuizUnlocked}
                  activeView={activeView}
                  onSelect={(v) => { setActiveView(v); }}
                />
              </div>
            </details>
          </div>

          <motion.div
            key={JSON.stringify(activeView)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderMain()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// ── Guest view (not logged in) ──────────────────────────────────────────────
function GuestCourseView({
  course,
  onStart,
}: {
  course: { title: string; shortDescription: string; description?: string; difficulty: string; durationMinutes: number; imageUrl: string };
  onStart: () => void;
}) {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-surface-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Badge className={getDifficultyBadgeClass(course.difficulty)}>{course.difficulty}</Badge>
              <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{course.title}</h1>
              <p className="mt-4 text-lg text-surface-300">{course.shortDescription}</p>
              <div className="mt-6 flex flex-wrap items-center gap-6 text-surface-300">
                <div className="flex items-center gap-2"><Clock className="h-5 w-5" /><span>{formatDuration(course.durationMinutes)}</span></div>
                <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /><span>Adaptive difficulty 1-10</span></div>
              </div>
            </div>
            <div>
              <div className="rounded-xl bg-white text-surface-900 p-6 shadow-lg">
                <h3 className="font-display text-xl font-semibold">Ready to learn?</h3>
                <p className="mt-2 text-sm text-surface-500">Log in to access the full structured course with modules, lessons, and quizzes.</p>
                <Button variant="primary" size="lg" className="mt-6 w-full" onClick={onStart}>
                  <Play className="mr-2 h-5 w-5" />
                  Login to Start
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-semibold mb-4">About this course</h2>
          <p className="text-surface-600 dark:text-surface-300 whitespace-pre-line">
            {course.description || course.shortDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
