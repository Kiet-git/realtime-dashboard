import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { tickSensors } from "./simulators/sensors";
import { tickTrading } from "./simulators/trading";
import { generateLogEntry } from "./simulators/logs";
import {
  AlertEvent,
  ClientToServerEvents,
  ServerToClientEvents,
  SensorReading,
} from "./types";

const PORT = Number(process.env.PORT) || 4001;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();
app.use(cors({ origin: ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: ORIGIN, methods: ["GET", "POST"] },
});

// Track last-known status per sensor so we only fire an alert on a state
// *transition* (normal -> warning/critical), not on every single tick while
// the sensor stays in the same elevated state. This mirrors how a real
// alerting pipeline (e.g. Prometheus Alertmanager) suppresses duplicate noise.
const lastStatus = new Map<string, SensorReading["status"]>();
let alertCounter = 0;

function deriveAlerts(readings: SensorReading[]): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  for (const r of readings) {
    const prev = lastStatus.get(r.sensorId) ?? "normal";
    if (r.status !== "normal" && r.status !== prev) {
      alertCounter += 1;
      alerts.push({
        id: `alert-${Date.now()}-${alertCounter}`,
        severity: r.status,
        source: r.label,
        message:
          r.status === "critical"
            ? `${r.label} exceeded critical threshold`
            : `${r.label} is above warning threshold`,
        value: r.value,
        threshold: r.status === "critical" ? r.critThreshold : r.warnThreshold,
        timestamp: r.timestamp,
      });
    }
    lastStatus.set(r.sensorId, r.status);
  }
  return alerts;
}

let activeAlertCount = 0;

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on("alert:acknowledge", (id: string) => {
    console.log(`[socket] alert acknowledged: ${id}`);
    activeAlertCount = Math.max(0, activeAlertCount - 1);
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// --- Broadcast loops -------------------------------------------------
// Each data source ticks on its own cadence, similar to how independent
// upstream systems (IoT gateway, market data feed, log shippers) would
// each push at their own natural frequency in a real deployment.

setInterval(() => {
  const readings = tickSensors();
  readings.forEach((r) => io.emit("sensor:reading", r));

  const alerts = deriveAlerts(readings);
  activeAlertCount += alerts.length;
  alerts.forEach((a) => io.emit("alert:new", a));
}, 1000);

setInterval(() => {
  const ticks = tickTrading();
  ticks.forEach((t) => io.emit("trading:tick", t));
}, 700);

setInterval(() => {
  io.emit("log:entry", generateLogEntry());
}, 1500);

// System heartbeat drives the header pulse waveform on the client - a single
// aggregate signal (0-100) representing overall load, blended from random
// noise plus a bump whenever alerts are active.
setInterval(() => {
  const base = 30 + Math.sin(Date.now() / 4000) * 15;
  const noise = (Math.random() - 0.5) * 10;
  const alertBump = Math.min(40, activeAlertCount * 8);
  const load = Math.max(0, Math.min(100, base + noise + alertBump));
  io.emit("system:heartbeat", {
    load: Number(load.toFixed(1)),
    activeAlerts: activeAlertCount,
    timestamp: Date.now(),
  });
}, 250);

httpServer.listen(PORT, () => {
  console.log(`Realtime dashboard server listening on http://localhost:${PORT}`);
  console.log(`Accepting CORS from ${ORIGIN}`);
});
