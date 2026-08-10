const { app, BrowserWindow, desktopCapturer, dialog, ipcMain, screen, session } = require('electron');
const path = require('path');

// 在部分 Windows 设备上，禁用硬件加速能避免应用在窗口创建前静默退出。
app.disableHardwareAcceleration();

let mainWindow;
app.disableHardwareAcceleration();

function showStartupError(error) {
  console.error(error);
  try {
    dialog.showErrorBox('博士日课未能启动', `启动时出现问题：\n${error.message || error}`);
  } catch {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 390,
    minHeight: 650,
    title: '博士日课',
    autoHideMenuBar: true,
    backgroundColor: '#f2f2f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    showStartupError(new Error(`界面进程意外退出：${details.reason}`));
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
      thumbnailSize: {
        width: Math.round(activeDisplay.size.width * scale),
        height: Math.round(activeDisplay.size.height * scale)
      }
    });
    const source = sources.find(item => item.display_id === String(activeDisplay.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty()) throw new Error('未能读取当前屏幕');
    return source.thumbnail.toDataURL();
  } finally {
    mainWindow.show();
    mainWindow.focus();
  }
});

process.on('uncaughtException', showStartupError);

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => callback(permission === 'geolocation'));
  createWindow();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
