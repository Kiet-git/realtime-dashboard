import { SensorReading, SensorStatus } from "../types";

interface SensorDef {
  sensorId: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  warnThreshold: number;
  critThreshold: number;
  value: number;
  volatility: number; // how much the value can drift per tick
}

// Six representative IoT sensors, each with its own operating range and thresholds.
const sensors: SensorDef[] = [
  { sensorId: "temp-rack-a", label: "Rack A Temp", unit: "°C", min: 18, max: 45, warnThreshold: 32, critThreshold: 38, value: 24, volatility: 0.6 },
  { sensorId: "humidity-hall", label: "Server Hall Humidity", unit: "%", min: 20, max: 80, warnThreshold: 60, critThreshold: 70, value: 45, volatility: 1.2 },
  { sensorId: "pressure-line", label: "Coolant Pressure", unit: "kPa", min: 80, max: 160, warnThreshold: 135, critThreshold: 148, value: 110, volatility: 2.5 },
  { sensorId: "vibration-cpu", label: "Chassis Vibration", unit: "mm/s", min: 0, max: 12, warnThreshold: 7, critThreshold: 9.5, value: 1.5, volatility: 0.4 },
  { sensorId: "power-draw", label: "Power Draw", unit: "kW", min: 5, max: 40, warnThreshold: 30, critThreshold: 35, value: 18, volatility: 1.5 },
  { sensorId: "latency-uplink", label: "Uplink Latency", unit: "ms", min: 1, max: 200, warnThreshold: 90, critThreshold: 140, value: 22, volatility: 4 },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function statusFor(value: number, warn: number, crit: number): SensorStatus {
  if (value >= crit) return "critical";
  if (value >= warn) return "warning";
  return "normal";
}

/**
 * Random-walk step with an occasional "spike" to simulate real anomalies
 * (compressor kicking in, network congestion, etc). Keeps the demo visually
 * interesting instead of flat noise around a mean.
 */
function step(def: SensorDef): number {
  const spike = Math.random() < 0.015 ? (Math.random() - 0.3) * def.volatility * 8 : 0;
  const drift = (Math.random() - 0.5) * def.volatility;
  const pullToCenter = ((def.min + def.max) / 2 - def.value) * 0.01; // gentle mean reversion
  const next = def.value + drift + spike + pullToCenter;
  return clamp(next, def.min, def.max);
}

export function tickSensors(): SensorReading[] {
  return sensors.map((def) => {
    def.value = step(def);
    const reading: SensorReading = {
      sensorId: def.sensorId,
      label: def.label,
      unit: def.unit,
      value: Number(def.value.toFixed(2)),
      min: def.min,
      max: def.max,
      warnThreshold: def.warnThreshold,
      critThreshold: def.critThreshold,
      status: statusFor(def.value, def.warnThreshold, def.critThreshold),
      timestamp: Date.now(),
    };
    return reading;
  });
}
