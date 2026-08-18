"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPoint } from "@/types";

interface Props {
  title: string;
  unit: string;
  history: ChartPoint[];
  color: string;
  warnThreshold?: number;
  critThreshold?: number;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

export function RealtimeLineChart({ title, unit, history, color, warnThreshold, critThreshold }: Props) {
  const latest = history[history.length - 1];
  const domain = useMemo<[number, number]>(() => {
    if (history.length === 0) return [0, 1];
    const values = history.map((p) => p.value);
    const min = Math.min(...values, warnThreshold ?? Infinity);
    const max = Math.max(...values, critThreshold ?? -Infinity);
    const pad = (max - min) * 0.15 || 1;
    return [min - pad, max + pad];
  }, [history, warnThreshold, critThreshold]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-edge bg-panel p-4 shadow-panel">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
          <p className="font-mono text-[11px] text-muted">Live · updates every tick, windowed to last 60 samples</p>
        </div>
        {latest && (
          <div className="text-right font-mono">
            <div className="text-xl font-semibold tabular-nums" style={{ color }}>
              {latest.value.toFixed(2)} <span className="text-xs font-normal text-muted">{unit}</span>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-[220px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="mainFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#232C38" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#6B7785"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              stroke="#6B7785"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "#1A222C",
                border: "1px solid #232C38",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              labelFormatter={(v) => formatTime(Number(v))}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, title]}
            />
            {warnThreshold !== undefined && (
              <ReferenceLine y={warnThreshold} stroke="#F0A93C" strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            {critThreshold !== undefined && (
              <ReferenceLine y={critThreshold} stroke="#EF5B5B" strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#mainFill)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
