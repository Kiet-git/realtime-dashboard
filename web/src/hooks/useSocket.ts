"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  AlertEvent,
  ChartPoint,
  HeartbeatEvent,
  LogEntry,
  SensorReading,
  TradingTick,
} from "@/types";
import { pushToWindow } from "@/lib/dataWindow";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";

const SENSOR_HISTORY_SIZE = 60; // ~1 min of history at 1 sample/sec
const TRADING_HISTORY_SIZE = 90; // ~1 min of history at ~0.7s/sample
const HEARTBEAT_HISTORY_SIZE = 80; // ~20s of history at 250ms/sample
const MAX_LOGS = 40;
const MAX_ALERTS = 30;
const FLUSH_INTERVAL_MS = 200; // batches multiple socket messages into one React update

export interface SensorState {
  latest: SensorReading;
  history: ChartPoint[];
}

export interface TradingState {
  latest: TradingTick;
  history: ChartPoint[];
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [sensors, setSensors] = useState<Record<string, SensorState>>({});
  const [trading, setTrading] = useState<Record<string, TradingState>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [heartbeatHistory, setHeartbeatHistory] = useState<ChartPoint[]>([]);

  // Buffers absorb high-frequency socket events between flush cycles so we
  // never trigger a React re-render per message - only per flush tick.
  const sensorBuffer = useRef<Map<string, SensorReading>>(new Map());
  const tradingBuffer = useRef<Map<string, TradingTick>>(new Map());
  const logBuffer = useRef<LogEntry[]>([]);
  const alertBuffer = useRef<AlertEvent[]>([]);
  const heartbeatBuffer = useRef<HeartbeatEvent | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("sensor:reading", (data: SensorReading) => {
      sensorBuffer.current.set(data.sensorId, data);
    });

    socket.on("trading:tick", (data: TradingTick) => {
      tradingBuffer.current.set(data.symbol, data);
    });

    socket.on("log:entry", (data: LogEntry) => {
      logBuffer.current.push(data);
    });

    socket.on("alert:new", (data: AlertEvent) => {
      alertBuffer.current.push(data);
    });

    socket.on("system:heartbeat", (data: HeartbeatEvent) => {
      heartbeatBuffer.current = data;
    });

    const flush = setInterval(() => {
      if (sensorBuffer.current.size > 0) {
        const updates = Array.from(sensorBuffer.current.values());
        sensorBuffer.current.clear();
        setSensors((prev) => {
          const next = { ...prev };
          for (const reading of updates) {
            const existing = next[reading.sensorId];
            const history = pushToWindow(
              existing?.history ?? [],
              { timestamp: reading.timestamp, value: reading.value },
              SENSOR_HISTORY_SIZE
            );
            next[reading.sensorId] = { latest: reading, history };
          }
          return next;
        });
      }

      if (tradingBuffer.current.size > 0) {
        const updates = Array.from(tradingBuffer.current.values());
        tradingBuffer.current.clear();
        setTrading((prev) => {
          const next = { ...prev };
          for (const tick of updates) {
            const existing = next[tick.symbol];
            const history = pushToWindow(
              existing?.history ?? [],
              { timestamp: tick.timestamp, value: tick.price },
              TRADING_HISTORY_SIZE
            );
            next[tick.symbol] = { latest: tick, history };
          }
          return next;
        });
      }

      if (logBuffer.current.length > 0) {
        const updates = logBuffer.current;
        logBuffer.current = [];
        setLogs((prev) => [...updates.reverse(), ...prev].slice(0, MAX_LOGS));
      }

      if (alertBuffer.current.length > 0) {
        const updates = alertBuffer.current;
        alertBuffer.current = [];
        setAlerts((prev) => [...updates.reverse(), ...prev].slice(0, MAX_ALERTS));
      }

      if (heartbeatBuffer.current) {
        const hb = heartbeatBuffer.current;
        heartbeatBuffer.current = null;
        setHeartbeatHistory((prev) =>
          pushToWindow(prev, { timestamp: hb.timestamp, value: hb.load }, HEARTBEAT_HISTORY_SIZE)
        );
      }
    }, FLUSH_INTERVAL_MS);

    return () => {
      clearInterval(flush);
      socket.disconnect();
    };
  }, []);

  function acknowledgeAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    socketRef.current?.emit("alert:acknowledge", id);
  }

  return { connected, sensors, trading, logs, alerts, heartbeatHistory, acknowledgeAlert };
}
