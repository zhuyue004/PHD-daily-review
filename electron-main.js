const { app, BrowserWindow, desktopCapturer, dialog, ipcMain, screen, session, Tray, Menu, nativeImage } = require('electron');
const fs = require('fs/promises');
const path = require('path');

app.disableHardwareAcceleration();
// Keep the original profile when the Windows-facing product name changes.
// A caller-provided profile is honored for isolated smoke tests.
app.setPath('userData', app.commandLine.getSwitchValue('user-data-dir') || path.join(app.getPath('appData'), 'phd-daily-review'));

let mainWindow;
let observationCompareWindow;
let tray;
let isQuitting = false;
let closedToTray = false;
let internalBoundsChange = false;
let dockState = null;
let dockCheckTimer = null;
let saveBoundsTimer = null;
let edgePollTimer = null;
let leaveEdgeSince = 0;

const DEFAULT_WIDTH = 410;
const DEFAULT_HEIGHT = 820;
const MIN_WIDTH = 390;
const MIN_HEIGHT = 650;
const DOCK_DISTANCE = 12;
const EDGE_REVEAL = 5;
const EDGE_POLL_MS = 100;
const HIDE_DELAY_MS = 650;

function showStartupError(error) {
  console.error(error);
  try { dialog.showErrorBox('日迹未能启动', `启动时出现问题：\n${error.message || error}`); } catch {}
}

const desktopSyncSettingsPath = () => path.join(app.getPath('userData'), 'sync-settings.json');
const windowStatePath = () => path.join(app.getPath('userData'), 'window-state.json');

ipcMain.handle('load-desktop-sync-settings', async () => {
  try { return JSON.parse(await fs.readFile(desktopSyncSettingsPath(), 'utf8')); } catch { return {}; }
});
ipcMain.handle('save-desktop-sync-settings', async (_event, settings) => {
  await fs.writeFile(desktopSyncSettingsPath(), JSON.stringify(settings || {}), 'utf8');
  return true;
});
ipcMain.handle('open-observation-compare', async (event, entry) => {
  if(event.sender!==mainWindow?.webContents || !entry || typeof entry!=='object')return false;
  const fields=['title','date','originalText','originalSource','analysis','text'];
  const data=Object.fromEntries(fields.map(key=>[key,entry[key]===null?null:String(entry[key]||'')]));
  if(observationCompareWindow&&!observationCompareWindow.isDestroyed()){
    observationCompareWindow.show();observationCompareWindow.focus();observationCompareWindow.webContents.send('observation-compare-data',data);return true;
  }
  const display=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()),area=display.workArea;
  observationCompareWindow=new BrowserWindow({width:Math.min(1120,area.width),height:Math.min(800,area.height),minWidth:800,minHeight:520,title:'写作对比',autoHideMenuBar:true,backgroundColor:'#f2f2f7',webPreferences:{preload:path.join(__dirname,'observation-compare-preload.js'),contextIsolation:true,nodeIntegration:false}});
  observationCompareWindow.on('closed',()=>{observationCompareWindow=null});
  observationCompareWindow.webContents.once('did-finish-load',()=>observationCompareWindow?.webContents.send('observation-compare-data',data));
  await observationCompareWindow.loadFile(path.join(__dirname,'observation-compare.html'));
  return true;
});
ipcMain.handle('close-observation-compare',event=>{if((event.sender===mainWindow?.webContents||event.sender===observationCompareWindow?.webContents)&&observationCompareWindow&&!observationCompareWindow.isDestroyed())observationCompareWindow.close()});

async function loadWindowState() {
  try {
    const saved = JSON.parse(await fs.readFile(windowStatePath(), 'utf8'));
    const width = Math.max(MIN_WIDTH, Number(saved.width) || DEFAULT_WIDTH);
    const height = Math.max(MIN_HEIGHT, Number(saved.height) || DEFAULT_HEIGHT);
    const bounds = { width, height };
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      const candidate = { x: saved.x, y: saved.y, width, height };
      const area = screen.getDisplayMatching(candidate).workArea;
      const visible = candidate.x < area.x + area.width - 40
        && candidate.x + candidate.width > area.x + 40
        && candidate.y < area.y + area.height - 40
        && candidate.y + candidate.height > area.y + 40;
      if (visible) Object.assign(bounds, { x: saved.x, y: saved.y });
    }
    return bounds;
  } catch { return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }; }
}

function scheduleSaveBounds() {
  if (!mainWindow || internalBoundsChange || dockState || mainWindow.isMaximized() || mainWindow.isMinimized()) return;
  clearTimeout(saveBoundsTimer);
  saveBoundsTimer = setTimeout(async () => {
    if (!mainWindow || mainWindow.isDestroyed() || dockState) return;
    try { await fs.writeFile(windowStatePath(), JSON.stringify(mainWindow.getBounds()), 'utf8'); } catch {}
  }, 250);
}

function setBoundsSafely(bounds) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  internalBoundsChange = true;
  mainWindow.setBounds(bounds, true);
  setTimeout(() => { internalBoundsChange = false; }, 180);
}

function expandedDockBounds(state = dockState) {
  if (!state) return null;
  const area = screen.getDisplayMatching(state.bounds).workArea;
  const width = Math.min(state.bounds.width, area.width);
  const height = Math.min(state.bounds.height, area.height);
  if (state.edge === 'left') return { x: area.x, y: Math.max(area.y, Math.min(state.bounds.y, area.y + area.height - height)), width, height };
  if (state.edge === 'right') return { x: area.x + area.width - width, y: Math.max(area.y, Math.min(state.bounds.y, area.y + area.height - height)), width, height };
  return { x: Math.max(area.x, Math.min(state.bounds.x, area.x + area.width - width)), y: area.y, width, height };
}

function hiddenDockBounds(state = dockState) {
  const bounds = expandedDockBounds(state);
  if (!bounds || !state) return null;
  const area = screen.getDisplayMatching(bounds).workArea;
  if (state.edge === 'left') bounds.x = area.x - bounds.width + EDGE_REVEAL;
  else if (state.edge === 'right') bounds.x = area.x + area.width - EDGE_REVEAL;
  else bounds.y = area.y - bounds.height + EDGE_REVEAL;
  return bounds;
}

function pointInside(bounds, point, margin = 0) {
  return point.x >= bounds.x - margin && point.x <= bounds.x + bounds.width + margin
    && point.y >= bounds.y - margin && point.y <= bounds.y + bounds.height + margin;
}

function cursorTouchesDockEdge(point, state = dockState) {
  if (!state) return false;
  const bounds = expandedDockBounds(state);
  const area = screen.getDisplayMatching(bounds).workArea;
  if (state.edge === 'left') return point.x <= area.x + 2 && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  if (state.edge === 'right') return point.x >= area.x + area.width - 3 && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  return point.y <= area.y + 2 && point.x >= bounds.x && point.x <= bounds.x + bounds.width;
}

function revealDockedWindow(activate = false) {
  if (!mainWindow || !dockState) return;
  dockState.hidden = false;
  leaveEdgeSince = 0;
  setBoundsSafely(expandedDockBounds());
  mainWindow.show();
  if (activate) mainWindow.focus();
}

function hideDockedWindow() {
  if (!mainWindow || !dockState || dockState.hidden || mainWindow.webContents.isDevToolsOpened()) return;
  dockState.hidden = true;
  leaveEdgeSince = 0;
  setBoundsSafely(hiddenDockBounds());
}

function cancelDock() {
  dockState = null;
  leaveEdgeSince = 0;
  if (edgePollTimer) clearInterval(edgePollTimer);
  edgePollTimer = null;
  if (closedToTray && mainWindow && !mainWindow.isDestroyed()) {
    closedToTray = false;
    mainWindow.setSkipTaskbar(false);
  }
}

function startEdgePolling() {
  if (edgePollTimer) clearInterval(edgePollTimer);
  edgePollTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !dockState || !mainWindow.isVisible()) return;
    const point = screen.getCursorScreenPoint();
    if (dockState.hidden) {
      if (cursorTouchesDockEdge(point)) revealDockedWindow(false);
      return;
    }
    if (pointInside(mainWindow.getBounds(), point, 2)) {
      leaveEdgeSince = 0;
      return;
    }
    if (!leaveEdgeSince) leaveEdgeSince = Date.now();
    if (Date.now() - leaveEdgeSince >= HIDE_DELAY_MS) hideDockedWindow();
  }, EDGE_POLL_MS);
}

function detectDockEdge() {
  if (!mainWindow || internalBoundsChange || dockState || mainWindow.isMaximized() || mainWindow.isMinimized() || mainWindow.isFullScreen()) return;
  const bounds = mainWindow.getBounds();
  const area = screen.getDisplayMatching(bounds).workArea;
  const distances = [
    ['left', Math.abs(bounds.x - area.x)],
    ['right', Math.abs(bounds.x + bounds.width - area.x - area.width)],
    ['top', Math.abs(bounds.y - area.y)]
  ].sort((a, b) => a[1] - b[1]);
  if (distances[0][1] > DOCK_DISTANCE) return;
  dockState = { edge: distances[0][0], bounds: { ...bounds }, hidden: false };
  setBoundsSafely(expandedDockBounds());
  startEdgePolling();
}

function scheduleDockCheck() {
  if (internalBoundsChange || dockState) return;
  clearTimeout(dockCheckTimer);
  dockCheckTimer = setTimeout(detectDockEdge, 420);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (closedToTray) {
    closedToTray = false;
    mainWindow.setSkipTaskbar(false);
  }
  if (dockState) revealDockedWindow(true);
  else {
    mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

function loadAppIcon() {
  const iconFile = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, 'build', 'icon.ico');
  const image = nativeImage.createFromPath(iconFile);
  return image.isEmpty() ? null : image;
}

async function createTray() {
  const appIcon = loadAppIcon();
  const trayIcon = appIcon ? appIcon.resize({ width: 16, height: 16, quality: 'best' }) : await app.getFileIcon(process.execPath, { size: 'small' });
  tray = new Tray(trayIcon);
  tray.setToolTip('日迹');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示日迹', click: showMainWindow },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } }
  ]));
  tray.on('double-click', showMainWindow);
}

async function createWindow() {
  const savedBounds = await loadWindowState();
  const appIcon = loadAppIcon();
  mainWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: '日迹',
    ...(appIcon ? { icon: appIcon } : {}),
    autoHideMenuBar: true,
    backgroundColor: '#f2f2f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => showStartupError(new Error(`界面进程意外退出：${details.reason}`)));
  mainWindow.on('move', () => {
    if (internalBoundsChange) return;
    if (dockState) cancelDock();
    scheduleSaveBounds();
    scheduleDockCheck();
  });
  mainWindow.on('resize', () => {
    if (internalBoundsChange) return;
    if (dockState) cancelDock();
    scheduleSaveBounds();
  });
  mainWindow.on('close', event => {
    if (isQuitting) return;
    if(observationCompareWindow&&!observationCompareWindow.isDestroyed())observationCompareWindow.close();
    event.preventDefault();
    const bounds = mainWindow.isMaximized() ? mainWindow.getNormalBounds() : mainWindow.getBounds();
    if (mainWindow.isMaximized()) {
      internalBoundsChange = true;
      mainWindow.unmaximize();
    }
    if (!dockState) {
      const area = screen.getDisplayMatching(bounds).workArea;
      const edge = [
        ['left', Math.abs(bounds.x - area.x)],
        ['right', Math.abs(bounds.x + bounds.width - area.x - area.width)],
        ['top', Math.abs(bounds.y - area.y)]
      ].sort((a, b) => a[1] - b[1])[0][0];
      dockState = { edge, bounds: { ...bounds }, hidden: false };
      startEdgePolling();
    }
    closedToTray = true;
    mainWindow.setSkipTaskbar(true);
    mainWindow.show();
    hideDockedWindow();
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html')).catch(showStartupError);
}

ipcMain.handle('capture-desktop-screen', async () => {
  if (!mainWindow) throw new Error('主窗口尚未准备好');
  const activeDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const scale = activeDisplay.scaleFactor || 1;
  mainWindow.hide();
  await new Promise(resolve => setTimeout(resolve, 260));
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(activeDisplay.size.width * scale), height: Math.round(activeDisplay.size.height * scale) }
    });
    const source = sources.find(item => item.display_id === String(activeDisplay.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty()) throw new Error('未能读取当前屏幕');
    return source.thumbnail.toDataURL();
  } finally { showMainWindow(); }
});

process.on('uncaughtException', showStartupError);

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();
else {
  app.on('second-instance', showMainWindow);
  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => callback(permission === 'geolocation'));
    await session.defaultSession.clearStorageData({ storages: ['serviceworkers', 'caches'] });
    await createTray();
    await createWindow();
    app.on('activate', showMainWindow);
  }).catch(showStartupError);
}

app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', () => {});
