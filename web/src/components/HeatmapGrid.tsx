"use client";

import clsx from "clsx";
import { SensorState } from "@/hooks/useSocket";

interface Props {
  sensors: SensorState[];
}

function intensity(state: SensorState) {
  const { latest } = state;
  return Math.min(1, Math.max(0, (latest.value - latest.min) / (latest.max - latest.min)));
}

function bg(status: string, alpha: number) {
  const colors: Record<string, string> = {
    normal: `rgba(61, 220, 151, ${alpha})`,
    warning: `rgba(240, 169, 60, ${alpha})`,
    critical: `rgba(239, 91, 91, ${alpha})`,
  };
  return colors[status] ?? colors.normal;
}

export function HeatmapGrid({ sensors }: Props) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-4 shadow-panel">
      <h3 className="mb-3 font-display text-sm font-semibold text-ink">Fleet Heatmap</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {sensors.map((s) => {
          const a = 0.25 + intensity(s) * 0.65;
          return (
            <div
              key={s.latest.sensorId}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 rounded-lg border border-edge p-3 text-center transition-colors duration-500",
                s.latest.status === "critical" && "animate-pulseline"
              )}
              style={{ backgroundColor: bg(s.latest.status, a) }}
              title={`${s.latest.label}: ${s.latest.value}${s.latest.unit}`}
            >
              <span className="font-mono text-[10px] uppercase text-ink/80">
                {s.latest.label.split(" ").slice(0, 2).join(" ")}
              </span>
              <span className="font-mono text-sm font-semibold text-ink">
                {s.latest.value.toFixed(0)}
                <span className="text-[10px] font-normal">{s.latest.unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
