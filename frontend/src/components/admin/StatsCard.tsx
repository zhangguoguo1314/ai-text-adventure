'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'violet' | 'blue' | 'emerald' | 'amber';
}

const colorMap = {
  violet: {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

export default function StatsCard({ title, value, icon, trend, color = 'violet' }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-slate-800/50 border ${c.border} rounded-xl p-6 flex items-start justify-between`}>
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <p className={`mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
      <div className={`${c.bg} ${c.icon} p-3 rounded-lg`}>{icon}</div>
    </div>
  );
}
