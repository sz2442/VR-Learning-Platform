import { CheckCircle, Lock, BookOpen, ClipboardList, ChevronDown, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { CourseModule } from '@/types';

type ContentView =
  | { type: 'lesson'; lessonId: number; moduleId: number }
  | { type: 'miniquiz'; moduleId: number }
  | { type: 'finalquiz' }
  | null;

interface ModuleSidebarProps {
  modules: CourseModule[];
  hasFinalQuiz: boolean;
  finalQuizUnlocked: boolean;
  activeView: ContentView;
  onSelect: (view: ContentView) => void;
}

export function ModuleSidebar({
  modules,
  hasFinalQuiz,
  finalQuizUnlocked,
  activeView,
  onSelect,
}: ModuleSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    () => new Set(modules.filter((m) => !m.isLocked).map((m) => m.id))
  );

  const toggleModule = (id: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isLessonActive = (lessonId: number) =>
    activeView?.type === 'lesson' && activeView.lessonId === lessonId;

  const isQuizActive = (moduleId: number) =>
    activeView?.type === 'miniquiz' && activeView.moduleId === moduleId;

  return (
    <nav className="h-full overflow-y-auto">
      <div className="space-y-1 p-2">
        {modules.map((module) => {
          const expanded = expandedModules.has(module.id);
          const allLessonsDone = module.lessons.length > 0 && module.lessons.every((l) => l.isCompleted);
          const moduleComplete = allLessonsDone && (module.miniQuiz?.isPassed ?? true);

          return (
            <div key={module.id} className="rounded-lg overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => !module.isLocked && toggleModule(module.id)}
                disabled={module.isLocked}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-lg transition-colors ${
                  module.isLocked
                    ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed'
                    : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-900 dark:text-white'
                }`}
              >
                {module.isLocked ? (
                  <Lock className="h-4 w-4 shrink-0 text-surface-400" />
                ) : moduleComplete ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0 text-primary-500" />
                )}
                <span className="flex-1 text-sm font-semibold leading-tight">{module.title}</span>
                {!module.isLocked && (
                  expanded
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                )}
              </button>

              {/* Lessons + mini quiz */}
              <AnimatePresence initial={false}>
                {!module.isLocked && expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 border-l border-surface-200 dark:border-surface-700 pl-3 pb-1 space-y-0.5">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => onSelect({ type: 'lesson', lessonId: lesson.id, moduleId: module.id })}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            isLessonActive(lesson.id)
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                              : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                          }`}
                        >
                          {lesson.isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <Play className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                          )}
                          <span className="leading-tight">{lesson.title}</span>
                        </button>
                      ))}

                      {module.miniQuiz && (
                        <button
                          onClick={() => onSelect({ type: 'miniquiz', moduleId: module.id })}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            isQuizActive(module.id)
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                              : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                          }`}
                        >
                          {module.miniQuiz.isPassed ? (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <ClipboardList className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                          <span className="leading-tight">
                            Module Quiz{' '}
                            <span className="text-xs text-surface-400">
                              (≥{module.miniQuiz.passingScore}%)
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Final Quiz */}
        {hasFinalQuiz && (
          <button
            onClick={() => finalQuizUnlocked && onSelect({ type: 'finalquiz' })}
            disabled={!finalQuizUnlocked}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors mt-2 border-2 ${
              finalQuizUnlocked
                ? activeView?.type === 'finalquiz'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-primary-200 dark:border-primary-800 hover:border-primary-400 text-surface-900 dark:text-white'
                : 'border-surface-200 dark:border-surface-700 text-surface-400 cursor-not-allowed'
            }`}
          >
            {finalQuizUnlocked ? (
              <ClipboardList className="h-4 w-4 shrink-0 text-primary-500" />
            ) : (
              <Lock className="h-4 w-4 shrink-0 text-surface-400" />
            )}
            <span>Final Quiz</span>
            {!finalQuizUnlocked && (
              <span className="ml-auto text-xs text-surface-400">Complete all modules</span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
}
