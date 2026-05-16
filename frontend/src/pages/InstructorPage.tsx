import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { StatsCard } from '@/components/dashboard';
import {
  StudentTable,
  StudentDetailModal,
  QuestionManager,
  InstructorAnalytics,
} from '@/components/instructor';
import { useInstructorStats, useInstructorStudents } from '@/hooks/useInstructor';
import { useCourses } from '@/hooks';

type Tab = 'overview' | 'courses' | 'analytics';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'courses', label: 'Course Management' },
  { key: 'analytics', label: 'Analytics' },
];

export function InstructorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useInstructorStats();
  const { data: students = [], isLoading: studentsLoading } = useInstructorStudents();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const courseList = courses.map(c => ({ id: c.id, title: c.title }));

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-surface-100">Instructor Dashboard</h1>
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
              Instructor
            </span>
          </div>
          <p className="mt-1 text-sm text-surface-500">Monitor student progress and manage course content.</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <StatsCard icon={<Users className="h-6 w-6" />} value={stats?.totalStudents ?? 0} label="Total Students"
                iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" />
              <StatsCard icon={<BookOpen className="h-6 w-6" />} value={stats?.totalCourses ?? 0} label="Total Courses"
                iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600 dark:text-green-400" />
              <StatsCard icon={<TrendingUp className="h-6 w-6" />} value={`${stats?.averageAccuracy ?? 0}%`} label="Avg Accuracy"
                iconBg="bg-primary-100 dark:bg-primary-900/30" iconColor="text-primary-600 dark:text-primary-400" />
              <StatsCard icon={<Activity className="h-6 w-6" />} value={stats?.activeSessionsToday ?? 0} label="Active Today"
                iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600 dark:text-orange-400" />
            </>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="mb-6 flex gap-1 rounded-xl border border-surface-700 bg-surface-800/60 p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white shadow'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-surface-200">All Students</h2>
              <StudentTable
                students={students}
                isLoading={studentsLoading}
                onRowClick={setSelectedStudent}
              />
            </div>
          )}

          {/* Tab 2: Course Management */}
          {activeTab === 'courses' && (
            coursesLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : courseList.length === 0 ? (
              <p className="py-10 text-center text-sm text-surface-500">No courses found.</p>
            ) : (
              <QuestionManager courses={courseList} />
            )
          )}

          {/* Tab 3: Analytics */}
          {activeTab === 'analytics' && (
            <InstructorAnalytics courses={courseList} />
          )}
        </motion.div>
      </div>

      {/* Student detail modal */}
      {selectedStudent !== null && (
        <StudentDetailModal
          userId={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
