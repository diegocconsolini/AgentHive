import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme, isDark } = useTheme();

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className={clsx('relative inline-flex', className)}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="sr-only"
        aria-label="Theme selection"
      />
      
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={clsx(
              'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
              theme === value
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
            title={label}
            aria-label={`Switch to ${label.toLowerCase()} theme`}
            aria-pressed={theme === value}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
};