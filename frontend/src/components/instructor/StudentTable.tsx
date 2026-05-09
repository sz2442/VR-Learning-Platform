import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import type { InstructorStudent } from '@/types';

interface StudentTableProps {
  students: InstructorStudent[];
  isLoading: boolean;
  onRowClick: (userId: number) => void;
}

type SortKey = keyof Pick<InstructorStudent, 'email' | 'averageAccuracy' | 'bestDifficulty' | 'totalSessions' | 'lastSessionDate'>;

function AccuracyBadge({ value }: { value: number }) {
  const color = value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{value}%</span>;
}

export function StudentTable({ students, isLoading, onRowClick }: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('lastSessionDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...students].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary-400" />
      : <ChevronDown className="h-3 w-3 text-primary-400" />;
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="cursor-pointer select-none px-4 py-3 text-left"
        onClick={() => toggleSort(k)}
      >
        <span className="flex items-center gap-1 text-xs font-semibold text-surface-400 uppercase tracking-wide">
          {label} <SortIcon k={k} />
        </span>
      </th>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-surface-500">
        No students have completed sessions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-700">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-700 bg-surface-800">
          <tr>
            <Th label="Email" k="email" />
            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wide">Course</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wide">Progress</th>
            <Th label="Last Session" k="lastSessionDate" />
            <Th label="Avg Accuracy" k="averageAccuracy" />
            <Th label="Best Diff." k="bestDifficulty" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const pct = s.modulesTotal === 0 ? 0 : Math.round(s.modulesCompleted / s.modulesTotal * 100);
            return (
              <tr
                key={s.userId}
                onClick={() => onRowClick(s.userId)}
                className={`cursor-pointer border-b border-surface-800 transition-colors hover:bg-surface-700/50 ${
                  i % 2 === 0 ? 'bg-surface-900/40' : 'bg-surface-800/40'
                }`}
              >
                <td className="px-4 py-3 font-medium text-surface-100">{s.email}</td>
                <td className="max-w-[160px] truncate px-4 py-3 text-surface-400">{s.courseTitle}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-700">
                      <div
                        className="h-1.5 rounded-full bg-primary-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-500">{s.modulesCompleted}/{s.modulesTotal}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-surface-500">
                  {s.lastSessionDate
                    ? new Date(s.lastSessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-4 py-3"><AccuracyBadge value={s.averageAccuracy} /></td>
                <td className="px-4 py-3 text-surface-300">{s.bestDifficulty}/10</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
