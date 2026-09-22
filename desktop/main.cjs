const { app, BrowserWindow, dialog, shell } = require("electron");
const { fork } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const fs = require("node:fs");

let mainWindow;
let serverProcess;

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("in-process-gpu");

const getFreePort = () => new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.unref();
  probe.on("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});

const waitForServer = async (url) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/state`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("本地数据服务启动超时");
};

const executableDir = () => {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  return app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, "..");
};

const desktopDataDir = () => path.join(executableDir(), "Quiz数据");
fs.mkdirSync(desktopDataDir(), { recursive: true });
app.setPath("userData", path.join(desktopDataDir(), "桌面配置"));
const logError = (error) => {
  const text = `[${new Date().toISOString()}] ${error?.stack || error}\n`;
  fs.appendFileSync(path.join(desktopDataDir(), "desktop-error.log"), text);
};

const startServer = async () => {
  const port = await getFreePort();
  const appDir = app.isPackaged
    ? path.join(process.resourcesPath, "quiz-app")
    : path.resolve(__dirname, "..", "outputs", "quiz-local");
  const dataDir = desktopDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  serverProcess = fork(path.join(appDir, "server.mjs"), [], {
    cwd: appDir,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", QUIZ_PORT: String(port), QUIZ_DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  let serverError = "";
  serverProcess.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
  serverProcess.on("error", logError);
  serverProcess.on("exit", (code, signal) => {
    if (!app.isQuitting && code && code !== 0) logError(new Error(`数据服务异常退出：${code || signal}`));
  });
  const url = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(url);
  } catch (error) {
    throw new Error(`${error.message}${serverError ? `\n${serverError}` : ""}`);
  }
  return url;
};

const createWindow = async () => {
  const url = await startServer();
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: "Quiz 提交管家",
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });
  await mainWindow.loadURL(url);
};

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(createWindow).catch((error) => {
    logError(error);
    dialog.showErrorBox("Quiz 提交管家无法启动", error.message);
    app.quit();
  });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => {
    app.isQuitting = true;
    if (serverProcess && !serverProcess.killed) serverProcess.kill();
  });
}
