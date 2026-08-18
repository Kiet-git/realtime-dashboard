"use client";

import { ChartPoint } from "@/types";
import { ConnectionStatus } from "./ConnectionStatus";
import { PulseWaveform } from "./PulseWaveform";

interface Props {
  connected: boolean;
  heartbeatHistory: ChartPoint[];
  activeAlerts: number;
}

export function Header({ connected, heartbeatHistory, activeAlerts }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-edge bg-deep/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-panel">
          <span className="font-display text-sm font-bold text-phosphor">OC</span>
        </div>
        <div>
          <h1 className="font-display text-base font-semibold tracking-tight text-ink">Ops Console</h1>
          <p className="font-mono text-[11px] text-muted">Real-time infrastructure &amp; market monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <PulseWaveform history={heartbeatHistory} />
        <div className="hidden items-center gap-1.5 rounded-full border border-edge bg-panel px-2.5 py-1 font-mono text-[11px] text-muted sm:flex">
          <span className={activeAlerts > 0 ? "text-crimson" : "text-muted"}>{activeAlerts}</span>
          alerts
        </div>
        <ConnectionStatus connected={connected} />
      </div>
    </header>
  );
}
