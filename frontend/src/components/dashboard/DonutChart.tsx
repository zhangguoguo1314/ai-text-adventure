'use client';

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}

/**
 * 纯 CSS 环形图（conic-gradient），中心显示总数，旁边显示图例
 */
export default function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = total > 0 && data.some((d) => d.value > 0);

  // 构建 conic-gradient 字符串
  let acc = 0;
  const stops: string[] = [];
  for (const d of data) {
    if (d.value <= 0) continue;
    const start = (acc / total) * 100;
    acc += d.value;
    const end = (acc / total) * 100;
    stops.push(`${d.color} ${start}% ${end}%`);
  }
  const gradient = hasData
    ? `conic-gradient(${stops.join(', ')})`
    : 'conic-gradient(var(--bg3) 0% 100%)';

  const thickness = Math.round(size * 0.16);
  const innerSize = size - thickness * 2;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div
        className="relative flex-shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
      >
        {/* 中心镂空 */}
        <div
          className="absolute rounded-full bg-[var(--bg2)] flex flex-col items-center justify-center"
          style={{
            width: innerSize,
            height: innerSize,
            top: thickness,
            left: thickness,
          }}
        >
          <span className="text-xl font-bold text-[var(--ink)] leading-none">
            {total}
          </span>
          <span className="text-[10px] text-[var(--muted)] mt-1">总计</span>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex-1 min-w-0 space-y-1.5 w-full">
        {data.length === 0 && (
          <p className="text-sm text-[var(--muted)]">暂无数据</p>
        )}
        {data.map((d) => {
          const pct = hasData ? ((d.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={d.label} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-[var(--ink)] flex-1 truncate">{d.label}</span>
              <span className="text-[var(--muted)] tabular-nums">{d.value}</span>
              <span className="text-[var(--muted)] tabular-nums text-xs w-12 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
