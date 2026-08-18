"use client";

import { useMemo, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Header } from "@/components/Header";
import { SensorGaugeCard } from "@/components/SensorGaugeCard";
import { RealtimeLineChart } from "@/components/RealtimeLineChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TradingTicker } from "@/components/TradingTicker";
import { LogsFeed } from "@/components/LogsFeed";

type Selection = { kind: "sensor" | "trading"; id: string };

const SENSOR_COLOR = "#3DDC97";
const TRADING_COLOR = "#4FC3F7";

export default function DashboardPage() {
  const { connected, sensors, trading, logs, alerts, heartbeatHistory, acknowledgeAlert } = useSocket();
  const [selection, setSelection] = useState<Selection | null>(null);

  const sensorList = useMemo(() => Object.values(sensors), [sensors]);
  const tradingList = useMemo(() => Object.values(trading), [trading]);
  const activeAlertCount = alerts.filter((a) => !a.acknowledged).length;

  const effectiveSelection: Selection | null =
    selection ?? (sensorList.length > 0 ? { kind: "sensor", id: sensorList[0].latest.sensorId } : null);

  const featured = useMemo(() => {
    if (!effectiveSelection) return null;
    if (effectiveSelection.kind === "sensor") {
      const s = sensors[effectiveSelection.id];
      if (!s) return null;
      return {
        title: s.latest.label,
        unit: s.latest.unit,
        history: s.history,
        color: SENSOR_COLOR,
        warnThreshold: s.latest.warnThreshold,
        critThreshold: s.latest.critThreshold,
      };
    }
    const t = trading[effectiveSelection.id];
    if (!t) return null;
    return {
      title: t.latest.symbol,
      unit: "",
      history: t.history,
      color: TRADING_COLOR,
      warnThreshold: undefined,
      critThreshold: undefined,
    };
  }, [effectiveSelection, sensors, trading]);

  const isLoading = sensorList.length === 0 && tradingList.length === 0;

  return (
    <div className="min-h-screen bg-deep text-ink">
      <Header connected={connected} heartbeatHistory={heartbeatHistory} activeAlerts={activeAlertCount} />

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {isLoading ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-edge border-t-phosphor" />
            <p className="font-mono text-sm text-muted">
              Connecting to stream at{" "}
              <span className="text-ink">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001"}
              </span>
              …
            </p>
            <p className="max-w-sm text-xs text-muted">
              Make sure the server package (<code className="text-cyan">/server</code>) is running with
              <code className="ml-1 text-cyan">npm run dev</code>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
            {/* Main column */}
            <div className="flex flex-col gap-4">
              {featured && (
                <div className="h-[320px]">
                  <RealtimeLineChart
                    title={featured.title}
                    unit={featured.unit}
                    history={featured.history}
                    color={featured.color}
                    warnThreshold={featured.warnThreshold}
                    critThreshold={featured.critThreshold}
                  />
                </div>
              )}

              <div>
                <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-muted">
                  Sensor Fleet — click a card to feature it above
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {sensorList.map((s) => (
                    <SensorGaugeCard
                      key={s.latest.sensorId}
                      state={s}
                      active={effectiveSelection?.kind === "sensor" && effectiveSelection.id === s.latest.sensorId}
                      onClick={() => setSelection({ kind: "sensor", id: s.latest.sensorId })}
                    />
                  ))}
                </div>
              </div>

              <HeatmapGrid sensors={sensorList} />

              <LogsFeed logs={logs} />
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <TradingTicker
                trading={tradingList}
                activeSymbol={effectiveSelection?.kind === "trading" ? effectiveSelection.id : undefined}
                onSelect={(symbol) => setSelection({ kind: "trading", id: symbol })}
              />
              <div className="min-h-[320px] flex-1">
                <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
