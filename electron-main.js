const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow(){
  let window=new BrowserWindow({
    width:1180,height:820,minWidth:390,minHeight:650,title:'博士日课',autoHideMenuBar:true,
    webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}
  });
  window.loadFile(path.join(__dirname,'index.html'));
}

app.whenReady().then(()=>{
  session.defaultSession.setPermissionRequestHandler((_contents,permission,callback)=>callback(permission==='geolocation'));
  createWindow();
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
