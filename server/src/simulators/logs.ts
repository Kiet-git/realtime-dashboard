import { LogEntry, LogLevel } from "../types";

const services = ["api-gateway", "auth-service", "order-worker", "ws-broker", "cache-node-3", "billing-cron"];

const infoMessages = [
  "Health check passed",
  "Cache warmed for tenant batch",
  "Rolling restart completed",
  "Connection pool resized to 64",
  "Scheduled job finished in 812ms",
];

const warnMessages = [
  "Response time exceeded 500ms SLA",
  "Retry attempt 2/3 for downstream call",
  "Connection pool nearing capacity",
  "Queue depth above baseline",
];

const errorMessages = [
  "Unhandled exception in request handler",
  "Downstream timeout after 3 retries",
  "Database connection reset",
  "Out of memory warning from worker",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;

export function generateLogEntry(): LogEntry {
  const roll = Math.random();
  let level: LogLevel;
  let message: string;

  if (roll < 0.78) {
    level = "info";
    message = pick(infoMessages);
  } else if (roll < 0.94) {
    level = "warn";
    message = pick(warnMessages);
  } else {
    level = "error";
    message = pick(errorMessages);
  }

  counter += 1;
  return {
    id: `log-${Date.now()}-${counter}`,
    level,
    service: pick(services),
    message,
    timestamp: Date.now(),
  };
}
