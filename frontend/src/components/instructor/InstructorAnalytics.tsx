import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui';
import { useInstructorStudents, useDailyActive, useCourseQuestions } from '@/hooks/useInstructor';

interface InstructorAnalyticsProps {
  courses: { id: number; title: string }[];
}

export function InstructorAnalytics({ courses }: InstructorAnalyticsProps) {
  const { data: students = [], isLoading: studentsLoading } = useInstructorStudents();
  const { data: dailyActive = [], isLoading: dailyLoading } = useDailyActive();

  // Use first course for hardest questions
  const firstCourseId = courses.length > 0 ? courses[0].id : null;
  const { data: questionGroups = [], isLoading: questionsLoading } = useCourseQuestions(firstCourseId);

  // Avg accuracy per module — derive from student data (group by courseTitle as proxy)
  const moduleAccuracy = (() => {
    const byModule: Record<string, number[]> = {};
    students.forEach(s => {
      const key = s.courseTitle.length > 20 ? s.courseTitle.slice(0, 20) + '…' : s.courseTitle;
      if (!byModule[key]) byModule[key] = [];
      byModule[key].push(s.averageAccuracy);
    });
    return Object.entries(byModule).map(([name, vals]) => ({
      name,
      accuracy: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  })();

  // Top 5 hardest questions across first course
  const hardestQuestions = questionGroups
    .flatMap(g => g.questions)
    .filter(q => q.totalAttempts > 0)
    .sort((a, b) => b.incorrectRate - a.incorrectRate)
    .slice(0, 5);

  const tooltipStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: 12,
  };

  return (
    <div className="space-y-8">
      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Avg accuracy per course */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-4">
          <h3 className="mb-4 text-sm font-semibold text-surface-300">Avg Accuracy per Course</h3>
          {studentsLoading ? (
            <Skeleton className="h-52 rounded-lg" />
          ) : moduleAccuracy.length === 0 ? (
            <p className="flex h-52 items-center justify-center text-sm text-surface-500">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={moduleAccuracy} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Avg Accuracy']} />
                <Bar dataKey="accuracy" fill="#00e5c8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily active students */}
        <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-4">
          <h3 className="mb-4 text-sm font-semibold text-surface-300">Active Students — Last 14 Days</h3>
          {dailyLoading ? (
            <Skeleton className="h-52 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={dailyActive} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Active students']} />
                <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 5 hardest questions */}
      <div className="rounded-xl border border-surface-700 bg-surface-800/60 p-4">
        <h3 className="mb-4 text-sm font-semibold text-surface-300">
          Top 5 Hardest Questions
          {courses.length > 0 && <span className="ml-2 font-normal text-surface-500">({courses[0].title})</span>}
        </h3>
        {questionsLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : hardestQuestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-surface-500">No attempt data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-700">
                <tr>
                  {['#', 'Question', 'Difficulty', 'Attempts', 'Incorrect Rate'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hardestQuestions.map((q, i) => {
                  const pct = Math.round(q.incorrectRate * 100);
                  const color = pct < 20 ? 'text-green-400' : pct <= 50 ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <tr key={q.questionId} className="border-b border-surface-800 odd:bg-surface-900/30">
                      <td className="px-3 py-2.5 text-surface-500">{i + 1}</td>
                      <td className="max-w-xs px-3 py-2.5 text-surface-200">
                        <p className="line-clamp-2">{q.text}</p>
                      </td>
                      <td className="px-3 py-2.5 text-surface-400">{q.difficultyLevel}/10</td>
                      <td className="px-3 py-2.5 text-surface-400">{q.totalAttempts}</td>
                      <td className={`px-3 py-2.5 font-semibold ${color}`}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
