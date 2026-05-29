import { useTranslation } from 'react-i18next';
import type { ActivityEntry } from '@/types';

interface ActivityTableProps {
  data: ActivityEntry[];
}

function accuracyColor(acc: number) {
  if (acc >= 80) return 'text-green-500';
  if (acc >= 60) return 'text-yellow-500';
  return 'text-red-400';
}

export function ActivityTable({ data }: ActivityTableProps) {
  const { t, i18n } = useTranslation('dashboard');

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-100 dark:border-surface-700 dark:bg-surface-800">
            <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">{t('activity.date')}</th>
            <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">{t('activity.course')}</th>
            <th className="px-4 py-3 text-right font-semibold text-surface-600 dark:text-surface-400">{t('activity.questions')}</th>
            <th className="px-4 py-3 text-right font-semibold text-surface-600 dark:text-surface-400">{t('activity.accuracy')}</th>
            <th className="px-4 py-3 text-right font-semibold text-surface-600 dark:text-surface-400">{t('activity.difficulty')}</th>
            <th className="px-4 py-3 text-right font-semibold text-surface-600 dark:text-surface-400">{t('activity.duration')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.sessionId}
              className={`border-b border-surface-100 dark:border-surface-800 ${
                i % 2 === 0 ? 'bg-white dark:bg-surface-900/40' : 'bg-surface-50 dark:bg-surface-800/40'
              }`}
            >
              <td className="px-4 py-3 text-surface-500">
                {new Date(row.date).toLocaleDateString(i18n.resolvedLanguage, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="max-w-[180px] truncate px-4 py-3 font-medium text-surface-900 dark:text-surface-100">
                {row.courseTitle}
              </td>
              <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-400">
                {row.questionsAnswered}
              </td>
              <td className={`px-4 py-3 text-right font-semibold ${accuracyColor(row.accuracy)}`}>
                {row.accuracy}%
              </td>
              <td className="px-4 py-3 text-right text-surface-600 dark:text-surface-400">
                {row.finalDifficulty}/10
              </td>
              <td className="px-4 py-3 text-right text-surface-500">
                {row.durationMinutes}m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
