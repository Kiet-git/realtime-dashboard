"use client";

import clsx from "clsx";
import { LogEntry } from "@/types";

const levelColor: Record<LogEntry["level"], string> = {
  info: "text-cyan",
  warn: "text-amber",
  error: "text-crimson",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

export function LogsFeed({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-4 shadow-panel">
      <h3 className="mb-3 font-display text-sm font-semibold text-ink">Service Logs</h3>
      <div className="max-h-64 space-y-1 overflow-y-auto font-mono text-[11px]">
        {logs.length === 0 && <p className="text-muted">Waiting for log stream…</p>}
        {logs.map((log) => (
          <div key={log.id} className="animate-flashin flex items-start gap-2 rounded px-1.5 py-1 hover:bg-raised">
            <span className="shrink-0 text-muted">{formatTime(log.timestamp)}</span>
            <span className={clsx("shrink-0 w-10 uppercase", levelColor[log.level])}>{log.level}</span>
            <span className="shrink-0 text-muted">[{log.service}]</span>
            <span className="text-ink/90">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
