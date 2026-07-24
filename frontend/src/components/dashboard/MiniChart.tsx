'use client';

import { useId } from 'react';

interface MiniChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

/**
 * 迷你趋势图（sparkline），用于表格中展示 7 天趋势
 */
export default function MiniChart({
  data,
  color = 'var(--accent)',
  width = 80,
  height = 28,
}: MiniChartProps) {
  const rawId = useId().replace(/:/g, '');
  if (!data || data.length === 0) {
    return (
      <div
        className="text-[10px] text-[var(--muted)] flex items-center"
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  const n = data.length;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const points = data.map((v, i) => {
    const x = pad + (n > 1 ? i * stepX : innerW / 2);
    const y = pad + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - pad} L ${points[0].x.toFixed(2)} ${height - pad} Z`
      : '';

  const gradId = `mini-chart-${rawId}`;
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1.5" title={`近7天共 ${total} 次游玩`}>
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={1.8}
            fill={color}
          />
        )}
      </svg>
      <span className="text-[10px] text-[var(--muted)] tabular-nums">{total}</span>
    </div>
  );
}
