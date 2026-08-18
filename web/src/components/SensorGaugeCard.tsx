"use client";

import clsx from "clsx";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { SensorState } from "@/hooks/useSocket";

const statusStyles: Record<string, { text: string; ring: string; fill: string; label: string }> = {
  normal: { text: "text-phosphor", ring: "ring-phosphor/25", fill: "#3DDC97", label: "NORMAL" },
  warning: { text: "text-amber", ring: "ring-amber/30", fill: "#F0A93C", label: "WARNING" },
  critical: { text: "text-crimson", ring: "ring-crimson/40", fill: "#EF5B5B", label: "CRITICAL" },
};

interface Props {
  state: SensorState;
  active?: boolean;
  onClick?: () => void;
}

export function SensorGaugeCard({ state, active, onClick }: Props) {
  const { latest, history } = state;
  const style = statusStyles[latest.status];
  const pct = Math.min(100, Math.max(0, ((latest.value - latest.min) / (latest.max - latest.min)) * 100));

  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative flex flex-col gap-2 rounded-xl border border-edge bg-panel p-3.5 text-left transition-all hover:border-edge hover:bg-raised",
        active && "ring-1",
        active && style.ring
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted">{latest.label}</span>
        <span className={clsx("font-mono text-[10px] tracking-wider", style.text)}>{style.label}</span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="font-mono text-2xl font-semibold text-ink tabular-nums">
          {latest.value.toFixed(1)}
          <span className="ml-1 text-sm font-normal text-muted">{latest.unit}</span>
        </div>
        <div className="h-9 w-20 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`spark-${latest.sensorId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={style.fill} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={style.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={style.fill}
                strokeWidth={1.5}
                fill={`url(#spark-${latest.sensorId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-edge">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: style.fill }}
        />
      </div>
    </button>
  );
}
