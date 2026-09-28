const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('phdDesktop', {
  captureScreen: () => ipcRenderer.invoke('capture-desktop-screen'),
  loadSyncSettings: () => ipcRenderer.invoke('load-desktop-sync-settings'),
  saveSyncSettings: settings => ipcRenderer.invoke('save-desktop-sync-settings', settings),
  openObservationCompare: entry => ipcRenderer.invoke('open-observation-compare', entry),
  closeObservationCompare: () => ipcRenderer.invoke('close-observation-compare')
});
