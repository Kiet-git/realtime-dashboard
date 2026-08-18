"use client";

import clsx from "clsx";
import { TradingState } from "@/hooks/useSocket";

interface Props {
  trading: TradingState[];
  activeSymbol?: string;
  onSelect?: (symbol: string) => void;
}

export function TradingTicker({ trading, activeSymbol, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-4 shadow-panel">
      <h3 className="mb-3 font-display text-sm font-semibold text-ink">Market Feed</h3>
      <div className="space-y-1">
        {trading.map(({ latest }) => {
          const up = latest.change >= 0;
          return (
            <button
              key={latest.symbol}
              onClick={() => onSelect?.(latest.symbol)}
              className={clsx(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-raised",
                activeSymbol === latest.symbol && "bg-raised ring-1 ring-cyan/30"
              )}
            >
              <span className="font-mono text-xs font-medium text-ink">{latest.symbol}</span>
              <div className="text-right">
                <div className="font-mono text-xs tabular-nums text-ink">
                  {latest.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div
                  className={clsx(
                    "font-mono text-[10px] tabular-nums",
                    up ? "text-phosphor" : "text-crimson"
                  )}
                >
                  {up ? "▲" : "▼"} {Math.abs(latest.changePercent).toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
