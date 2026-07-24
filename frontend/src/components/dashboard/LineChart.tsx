'use client';

import { useLayoutEffect, useRef, useState } from 'react';

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function LineChart({
  data,
  height = 220,
  color = 'var(--accent)',
  formatValue,
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 响应式：测量容器实际宽度
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = Math.max(0, width - padding.left - padding.right);
  const innerH = Math.max(0, height - padding.top - padding.bottom);

  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const min = 0;
  const range = max - min || 1;

  const n = data.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding.left + (n > 1 ? i * stepX : innerW / 2);
    const y = padding.top + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(
          padding.top + innerH
        ).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padding.top + innerH).toFixed(
          2,
        )} Z`
      : '';

  const gradId = 'line-chart-grad';

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        width={width}
        height={height}
        className="block"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* 水平参考线 */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={padding.left}
            x2={padding.left + innerW}
            y1={padding.top + innerH * r}
            y2={padding.top + innerH * r}
            stroke="var(--rule)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ))}

        {/* 填充区域 */}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

        {/* 折线 */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* 数据点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 4.5 : 3}
              fill="var(--bg2)"
              stroke={color}
              strokeWidth={2}
              className="transition-all"
            />
            {/* 透明命中区域 */}
            <rect
              x={p.x - Math.max(8, stepX / 2)}
              y={padding.top}
              width={Math.max(16, stepX)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
          </g>
        ))}

        {/* 悬停辅助线 */}
        {hoverIndex !== null && points[hoverIndex] && (
          <line
            x1={points[hoverIndex].x}
            x2={points[hoverIndex].x}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
        )}
      </svg>

      {/* Tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full px-2 py-1 rounded-md text-xs text-white bg-black/80 whitespace-nowrap shadow-lg z-10"
          style={{
            left: points[hoverIndex].x,
            top: points[hoverIndex].y - 6,
          }}
        >
          {formatValue
            ? formatValue(points[hoverIndex].value)
            : points[hoverIndex].value}
          <span className="block text-[10px] text-white/70">
            {points[hoverIndex].label}
          </span>
        </div>
      )}

      {/* X 轴标签（稀疏显示，避免拥挤） */}
      <div className="flex justify-between mt-1 px-1">
        {data
          .filter((_, i) => {
            const showEvery = Math.max(1, Math.ceil(n / 6));
            return i % showEvery === 0 || i === n - 1;
          })
          .map((d, i, arr) => (
            <span
              key={d.label + i}
              className={`text-[10px] text-[var(--muted)] ${
                i === 0 ? 'text-left' : i === arr.length - 1 ? 'text-right' : 'text-center'
              }`}
            >
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}
