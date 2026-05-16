import { Moon, Sun, Monitor } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'rounded-lg p-2 transition-all duration-200',
            theme === value
              ? 'bg-white text-primary-600 shadow-sm dark:bg-surface-700 dark:text-primary-400'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          )}
          title={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
