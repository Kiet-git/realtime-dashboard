export type SensorStatus = "normal" | "warning" | "critical";

export interface SensorReading {
  sensorId: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  warnThreshold: number;
  critThreshold: number;
  status: SensorStatus;
  timestamp: number;
}

export interface TradingTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  service: string;
  message: string;
  timestamp: number;
}

export type AlertSeverity = "warning" | "critical";

export interface AlertEvent {
  id: string;
  severity: AlertSeverity;
  source: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface HeartbeatEvent {
  load: number; // 0-100 aggregate system load, drives the header pulse waveform
  activeAlerts: number;
  timestamp: number;
}

export interface ServerToClientEvents {
  "sensor:reading": (data: SensorReading) => void;
  "trading:tick": (data: TradingTick) => void;
  "log:entry": (data: LogEntry) => void;
  "alert:new": (data: AlertEvent) => void;
  "system:heartbeat": (data: HeartbeatEvent) => void;
}

export interface ClientToServerEvents {
  "alert:acknowledge": (id: string) => void;
}
