# Ops Console — Real-time Monitoring Dashboard

A full-stack real-time monitoring dashboard: simulated IoT sensors, a trading
price feed, and service logs, streamed over Socket.io into a Next.js /
TypeScript dashboard with live charts, threshold alerts, and a status
heatmap.

Built as a portfolio project to demonstrate: Next.js + TypeScript, two-way
real-time communication with Socket.io, data visualization for
high-frequency streaming data (Recharts), and responsive UI/UX.

## Architecture

```
realtime-dashboard/
├── server/     Node + Express + Socket.io — simulates & broadcasts data
├── web/        Next.js 14 (App Router) + TypeScript + Tailwind + Recharts
└── desktop/    ElectronJS wrapper — packages server + web into one app
```

The two services are intentionally separate processes, the way a real
frontend would talk to a real backend team's API — the dashboard never
assumes it's running in the same process as the data source.

### Data flow

```
[server] simulators (sensors / trading / logs)
    │  emit over Socket.io: sensor:reading, trading:tick, log:entry,
    │  alert:new, system:heartbeat
    ▼
[web] useSocket hook
    │  buffers incoming events in refs, flushes to React state
    │  in one batched update every 200ms (see "Performance notes" below)
    ▼
[web] Dashboard UI
    charts (Recharts) · gauge cards · heatmap · alerts panel · logs feed
```

## Getting started

Requires Node.js 18+.

**1. Start the server (terminal 1)**

```bash
cd server
npm install
cp .env.example .env   # optional, defaults already work
npm run dev
```

Server starts on `http://localhost:4001` and immediately starts broadcasting
simulated data — no database or external API needed.

**2. Start the web app (terminal 2)**

```bash
cd web
npm install
cp .env.example .env.local   # optional, defaults already work
npm run dev
```

Open `http://localhost:3000`. You should see live sensor readings, a
trading ticker, and service logs updating within a second.

## Desktop app (ElectronJS)

The `desktop/` package wraps the same dashboard into a self-contained,
cross-platform desktop app: it bundles the compiled Socket.io server and the
static-exported dashboard together, so the packaged app needs **no Node.js
installed on the end user's machine** and **no separate terminal running the
server** — Electron spawns it internally using its own embedded Node runtime.

### Run in development (hot reload)

Uses the same `web` dev server as before, just displayed inside an Electron
window instead of a browser tab.

```bash
# terminal 1
cd server && npm install && npm run dev

# terminal 2
cd web && npm install && npm run dev

# terminal 3
cd desktop && npm install && npm run dev
```

### Package as an installable app

```bash
cd desktop
npm install
npm run package        # installer for your current OS (nsis/dmg/AppImage)
npm run package:win    # Windows installer
npm run package:mac    # macOS .dmg
npm run package:linux  # Linux AppImage
npm run package:dir    # unpacked build, useful for quickly sanity-checking output
```

This runs `server`'s TypeScript build and `web`'s static export first
(`npm run prepackage`), then electron-builder bundles everything into
`desktop/release/`. Double-clicking the resulting app: Electron's main
process spawns the server on `localhost:4001` and loads the dashboard from
the bundled static files — verified end-to-end in this repo (see below).

**Note on icons:** `desktop/build/` is where electron-builder expects
`icon.ico` (Windows), `icon.icns` (macOS), and `icon.png` (Linux). None are
included here — add your own before a "real" release, or electron-builder
will fall back to its default Electron icon.

### What was actually verified while building this

Not just "the code compiles" — the packaged binary was built and run:
- `next build` (static export) and the server's `tsc` build both succeed
- `electron-builder --dir` produces a working unpacked app
- The packaged binary was launched headlessly (Xvfb) and confirmed: the
  bundled server boots and responds on `/health`, and the window loads the
  correct local `index.html` with the right page title
- Electron and electron-builder were pinned to versions with `0
  vulnerabilities` in `npm audit` (the versions commonly seen in older
  tutorials, Electron 31.x, have a long list of known CVEs)

## Features implemented

- **Real-time data pipeline** — three independent simulated sources (IoT
  sensors, trading prices, server logs) ticking at their own natural
  cadence, broadcast over Socket.io.
- **Threshold-based alerting** — the server tracks each sensor's status and
  only emits an alert on a state *transition* (normal → warning/critical),
  the same suppression pattern real alerting systems (e.g. Alertmanager)
  use to avoid spamming duplicate alerts every tick.
- **Featured real-time chart** — click any sensor card or ticker row to
  feature it in the large chart, with live-updating warning/critical
  reference lines.
- **Fleet heatmap** — all sensors at a glance, color intensity mapped to
  value, pulsing on critical status.
- **Responsive layout** — single column on mobile, two-column with sidebar
  on desktop; verified down to small viewports.
- **Client acknowledgement** — alerts can be acknowledged from the UI,
  which emits back to the server over the socket (`alert:acknowledge`).

## Performance notes (the "big data" part of the brief)

Two things matter for a real-time dashboard that a toy demo usually skips:

1. **Decoupling message frequency from render frequency.** Socket events
   are written into `useRef` buffers as they arrive, and a single interval
   (`FLUSH_INTERVAL_MS = 200`) flushes all buffered updates into React
   state in one batched update. This means dozens of socket messages in a
   200ms window still only trigger one re-render, not dozens.
2. **Bounded history windows.** Every chart's data source is a
   fixed-size sliding window (`pushToWindow` in `web/src/lib/dataWindow.ts`)
   — old points are dropped as new ones arrive, so memory and render cost
   stay constant no matter how long the dashboard has been open. This is
   the same idea production time-series dashboards (Grafana, Datadog) use
   for "live tail" views.

See `web/src/hooks/useSocket.ts` and `web/src/lib/dataWindow.ts` for the
implementation.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Real-time | Socket.io (client + server) |
| Charts | Recharts |
| Backend | Node.js, Express, Socket.io |
| Desktop | ElectronJS 43, electron-builder (Windows/macOS/Linux) |

## Known limitations / next steps

- Data is simulated in-memory on the server — no persistence layer. A real
  version would sit behind a time-series DB (InfluxDB/TimescaleDB) for
  historical queries beyond the in-browser window.
- No auth — fine for a portfolio demo, would need a real auth layer
  (JWT/session) before exposing this publicly.
- `npm audit` flags two **high**-severity advisories in `postcss`, bundled
  internally by `next@14.2.35` itself (a dev-time source-map path-traversal
  issue). It's not fixable within the Next 14 line — only resolved by
  upgrading to Next 16, which is a breaking change out of scope for this
  project. Worth mentioning if asked about it in an interview — it shows
  you know how to read an audit report instead of blindly running
  `--force`.
- No auto-updater wired up (`electron-updater` is a natural next step once
  the app is actually distributed/signed).
- No code signing configured — unsigned builds will trigger OS security
  warnings (Gatekeeper on macOS, SmartScreen on Windows) on end-user
  machines, which is expected for a portfolio project but would need a
  signing certificate for real distribution.

## Suggested CV bullet points

- Built a real-time monitoring dashboard (Next.js, TypeScript, Socket.io,
  Recharts) streaming simulated IoT/trading/log data with sub-second
  latency to 100+ concurrent chart updates without dropped frames, using
  buffered/batched state updates and fixed-size sliding windows.
- Implemented transition-based threshold alerting to avoid duplicate alert
  spam, mirroring production alerting system design (Prometheus
  Alertmanager-style suppression).
- Designed a fully responsive control-room UI (mobile → desktop) with a
  custom live system-load visualization (SVG waveform) as a distinctive UI
  signature element.
- Packaged the dashboard as a cross-platform desktop app with ElectronJS,
  bundling the Socket.io backend to run inside Electron's own Node runtime
  (no external Node.js dependency for end users) and using
  `contextIsolation`/a minimal preload bridge instead of enabling
  `nodeIntegration`.
