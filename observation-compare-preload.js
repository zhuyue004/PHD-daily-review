const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('observationCompare',{
  onData:callback=>ipcRenderer.on('observation-compare-data',(_event,data)=>callback(data)),
  close:()=>ipcRenderer.invoke('close-observation-compare')
});
