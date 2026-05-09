import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatsCard({ icon, value, label, iconBg, iconColor }: StatsCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/60">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          iconBg ?? 'bg-primary-100 dark:bg-primary-900/30'
        )}
      >
        <span className={cn('h-6 w-6', iconColor ?? 'text-primary-600 dark:text-primary-400')}>
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
        <p className="truncate text-sm text-surface-500">{label}</p>
      </div>
    </div>
  );
}
