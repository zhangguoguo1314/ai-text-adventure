'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number; // 趋势百分比，正数上升 / 负数下降
  color?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
}

const colorMap = {
  violet: {
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconText: 'text-violet-500 dark:text-violet-300',
    ring: 'ring-violet-500/20',
  },
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconText: 'text-blue-500 dark:text-blue-300',
    ring: 'ring-blue-500/20',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconText: 'text-emerald-500 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconText: 'text-amber-500 dark:text-amber-300',
    ring: 'ring-amber-500/20',
  },
  rose: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    iconText: 'text-rose-500 dark:text-rose-300',
    ring: 'ring-rose-500/20',
  },
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'violet',
}: StatCardProps) {
  const c = colorMap[color];
  const isUp = (trend ?? 0) >= 0;

  return (
    <div className="bg-[var(--bg2)] rounded-xl p-5 card-shadow border border-[var(--rule)] flex items-start justify-between transition-transform hover:-translate-y-0.5">
      <div className="min-w-0">
        <p className="text-sm text-[var(--muted)] mb-2 truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-[var(--ink)] leading-tight">
          {value}
        </p>
        {trend !== undefined && (
          <p
            className={`mt-2 text-xs flex items-center gap-1 ${
              isUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: isUp ? 'none' : 'rotate(180deg)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {isUp ? '+' : ''}
            {trend}%
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-lg ${c.iconBg} ${c.iconText} flex-shrink-0`}
      >
        {icon}
      </div>
    </div>
  );
}
