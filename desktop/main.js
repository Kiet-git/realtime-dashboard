const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const SERVER_PORT = 4001;

/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;

// In dev, a developer runs `server` and `web` in separate terminals (see
// README) and just points Electron at the running Next dev server for hot
// reload. In a packaged build there's no such thing as "another terminal",
// so we spawn the compiled server ourselves and load the static export.
const devStartUrl = process.env.ELECTRON_START_URL;

// Packaged app: electron-builder's "extraResources" copies
// ../server/dist/* -> resources/server/* and ../web/out/* -> resources/web/out/*,
// so the packaged layout is flat (resources/server/index.js).
// Running unpackaged (`electron .` with no dev URL, e.g. via `npm run
// package:dir` sanity checks) there is no resources/ folder, so we read
// straight from the sibling ../server/dist and ../web/out build outputs.
function resolveServerEntry() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server", "index.js");
  }
  return path.join(__dirname, "..", "server", "dist", "index.js");
}

function resolveWebIndex() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "web", "out", "index.html");
  }
  return path.join(__dirname, "..", "web", "out", "index.html");
}

/**
 * Spawns the compiled Socket.io server as a child process using Electron's
 * own embedded Node runtime (ELECTRON_RUN_AS_NODE=1) - this means a packaged
 * app never depends on the end user having Node.js installed on their
 * machine, which is the whole point of shipping a self-contained desktop app.
 */
function startBundledServer() {
  return new Promise((resolve) => {
    const serverEntry = resolveServerEntry();

    if (!fs.existsSync(serverEntry)) {
      console.error(`[desktop] server entry not found at ${serverEntry}`);
      console.error("[desktop] did you run `npm run build:server` first?");
      resolve();
      return;
    }

    serverProcess = spawn(process.execPath, [serverEntry], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        PORT: String(SERVER_PORT),
        CLIENT_ORIGIN: "*",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    serverProcess.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      console.log(`[server] ${text.trim()}`);
      if (text.includes("listening")) finish();
    });
    serverProcess.stderr.on("data", (chunk) => {
      console.error(`[server:err] ${chunk.toString().trim()}`);
    });
    serverProcess.on("exit", (code) => {
      console.log(`[server] exited with code ${code}`);
    });

    // Don't block window creation forever if the server's log format ever
    // changes - just give it a moment to boot, then proceed regardless.
    setTimeout(finish, 2500);
  });
}

function stopBundledServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function buildMenu() {
  const isMac = process.platform === "darwin";

  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "View Project on GitHub",
          click: async () => {
            await shell.openExternal("https://github.com/");
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0B0F14",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  if (devStartUrl) {
    await mainWindow.loadURL(devStartUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await startBundledServer();
    await mainWindow.loadFile(resolveWebIndex());
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBundledServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBundledServer);
app.on("will-quit", stopBundledServer);
