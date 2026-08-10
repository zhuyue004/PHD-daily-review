const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('phdDesktop', {
  captureScreen: () => ipcRenderer.invoke('capture-desktop-screen')
});
