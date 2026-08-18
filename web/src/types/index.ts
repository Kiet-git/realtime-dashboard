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
  acknowledged?: boolean;
}

export interface HeartbeatEvent {
  load: number;
  activeAlerts: number;
  timestamp: number;
}

export interface ChartPoint {
  timestamp: number;
  value: number;
}
