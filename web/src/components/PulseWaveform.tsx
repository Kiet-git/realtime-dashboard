"use client";

import { useMemo } from "react";
import { ChartPoint } from "@/types";

interface Props {
  history: ChartPoint[];
  width?: number;
  height?: number;
}

function colorForLoad(load: number) {
  if (load >= 70) return "#EF5B5B"; // crimson
  if (load >= 45) return "#F0A93C"; // amber
  return "#3DDC97"; // phosphor
}

export function PulseWaveform({ history, width = 260, height = 44 }: Props) {
  const { path, color, latest } = useMemo(() => {
    if (history.length < 2) {
      return { path: "", color: "#3DDC97", latest: 0 };
    }
    const values = history.map((p) => p.value);
    const max = Math.max(...values, 100);
    const min = 0;
    const stepX = width / (history.length - 1);

    const points = history.map((p, i) => {
      const x = i * stepX;
      const norm = (p.value - min) / (max - min || 1);
      const y = height - norm * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const last = values[values.length - 1];
    return { path: `M${points.join(" L")}`, color: colorForLoad(last), latest: last };
  }, [history, width, height]);

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} className="overflow-visible">
        {path && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulseline"
            style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          />
        )}
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-xs text-muted">SYS LOAD</span>
        <span className="font-mono text-sm font-semibold" style={{ color }}>
          {latest.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
