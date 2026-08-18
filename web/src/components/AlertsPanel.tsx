"use client";

import clsx from "clsx";
import { AlertEvent } from "@/types";

interface Props {
  alerts: AlertEvent[];
  onAcknowledge: (id: string) => void;
}

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function AlertsPanel({ alerts, onAcknowledge }: Props) {
  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-edge bg-panel p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink">Alerts</h3>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 font-mono text-[11px]",
            activeCount > 0 ? "bg-crimson/15 text-crimson" : "bg-phosphor/15 text-phosphor"
          )}
        >
          {activeCount} active
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {alerts.length === 0 && (
          <p className="mt-6 text-center text-xs text-muted">
            No threshold breaches yet. This panel fills in as sensors drift out of range.
          </p>
        )}
        {alerts.map((a) => (
          <div
            key={a.id}
            className={clsx(
              "animate-flashin rounded-lg border p-2.5 text-xs transition-opacity",
              a.acknowledged ? "border-edge bg-raised/40 opacity-50" : "border-edge bg-raised",
              !a.acknowledged && a.severity === "critical" && "border-crimson/40",
              !a.acknowledged && a.severity === "warning" && "border-amber/40"
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span
                className={clsx(
                  "font-mono text-[10px] uppercase tracking-wide",
                  a.severity === "critical" ? "text-crimson" : "text-amber"
                )}
              >
                {a.severity}
              </span>
              <span className="font-mono text-[10px] text-muted">{timeAgo(a.timestamp)}</span>
            </div>
            <p className="text-ink">{a.message}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted">
              value {a.value} · threshold {a.threshold}
            </p>
            {!a.acknowledged && (
              <button
                onClick={() => onAcknowledge(a.id)}
                className="mt-2 rounded-md border border-edge px-2 py-1 font-mono text-[10px] text-muted transition-colors hover:border-cyan/40 hover:text-cyan"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
