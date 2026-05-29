import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CourseGrid } from '@/components/courses';
import { useCourses } from '@/hooks';

// English enum keys — used for filtering logic (must match course.difficulty from backend)
const DIFFICULTY_KEYS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
type DifficultyKey = typeof DIFFICULTY_KEYS[number];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyKey>('All');
  const { t } = useTranslation('home');

  const { data: courses = [], isLoading } = useCourses();

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDifficulty = selectedDifficulty === 'All' ||
        course.difficulty === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [courses, searchQuery, selectedDifficulty]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20
        bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700
        dark:from-surface-900 dark:via-surface-900 dark:to-primary-900
        ">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 dark:bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 dark:bg-primary-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 dark:bg-surface-800/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              {t('heroBadge')}
            </div>

            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              {t('heroDesc')}
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-8 max-w-xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-surface-900 shadow-xl placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Course Catalog */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t('allCourses')}</h2>
              <p className="text-surface-500">
                {t('coursesAvailable', { count: filteredCourses.length })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-surface-400" />
              <div className="flex gap-2">
                {DIFFICULTY_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedDifficulty === key
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                  >
                    {t(`difficulty.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <CourseGrid courses={filteredCourses} isLoading={isLoading} />
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-surface-200 bg-surface-50 py-16 dark:border-surface-800 dark:bg-surface-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="🎯"
              title={t('features.adaptiveTitle')}
              description={t('features.adaptiveDesc')}
            />
            <FeatureCard
              icon="📊"
              title={t('features.progressTitle')}
              description={t('features.progressDesc')}
            />
            <FeatureCard
              icon="🚀"
              title={t('features.pathTitle')}
              description={t('features.pathDesc')}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-lg dark:bg-surface-800">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-surface-500">{description}</p>
    </motion.div>
  );
}
