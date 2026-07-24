'use client';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string; // CSS color value，默认使用主题 accent
  /** 数值格式化函数，用于 tooltip 显示 */
  formatValue?: (v: number) => string;
}

export default function BarChart({
  data,
  height = 220,
  color = 'var(--accent)',
  formatValue,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-1 w-full"
        style={{ height: `${height}px` }}
      >
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div
              key={i}
              className="group relative flex-1 min-w-0 flex flex-col items-center justify-end h-full"
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap px-2 py-1 rounded-md text-xs text-white bg-black/80 shadow-lg">
                {formatValue ? formatValue(d.value) : d.value}
                <span className="block text-[10px] text-white/70">{d.label}</span>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                style={{
                  height: `${h}%`,
                  minHeight: d.value > 0 ? '2px' : '0',
                  background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 60%, transparent))`,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X 轴标签 */}
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 text-center text-[10px] text-[var(--muted)] truncate"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
