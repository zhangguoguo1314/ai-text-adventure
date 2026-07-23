'use client';

import { useTheme } from '@/providers/ThemeProvider';

const themeOrder = ['light', 'dark', 'system'] as const;

const themeLabels: Record<string, string> = {
  light: '浅色模式',
  dark: '深色模式',
  system: '跟随系统',
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

const iconMap = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

interface ThemeToggleProps {
  /** 紧凑模式，用于侧边栏等窄空间 */
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const currentIndex = themeOrder.indexOf(theme as (typeof themeOrder)[number]);
  const nextIndex = (currentIndex + 1) % themeOrder.length;
  const nextTheme = themeOrder[nextIndex];

  const handleToggle = () => {
    setTheme(nextTheme);
  };

  const IconComponent = iconMap[theme] || MonitorIcon;

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className="p-1.5 rounded-lg hover:bg-violet-800 transition-colors text-violet-400 hover:text-white"
        title={themeLabels[theme]}
        aria-label={`当前主题：${themeLabels[theme]}，点击切换到${themeLabels[nextTheme]}`}
      >
        <IconComponent className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--rule)] bg-[var(--bg2)] text-[var(--ink)] hover:bg-[var(--bg3)] transition-all duration-200 text-sm"
      title={themeLabels[theme]}
      aria-label={`当前主题：${themeLabels[theme]}，点击切换到${themeLabels[nextTheme]}`}
    >
      <span className="relative w-5 h-5 flex items-center justify-center">
        <span className="animate-theme-icon-in">
          <IconComponent className="w-5 h-5" />
        </span>
      </span>
      <span>{themeLabels[theme]}</span>
    </button>
  );
}
