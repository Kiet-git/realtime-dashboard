const { contextBridge } = require("electron");

// Minimal, explicit bridge - the dashboard UI (the same Next.js static
// export used on the web) doesn't currently need any native APIs, but this
// is the correct pattern to extend if it later needs things like "Save
// report to disk" or "Show native notification": add a narrow, named
// method here rather than ever enabling nodeIntegration in the renderer.
contextBridge.exposeInMainWorld("opsConsole", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
