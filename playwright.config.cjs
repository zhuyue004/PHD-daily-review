const fs=require('fs');

const edge=[
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].find(fs.existsSync);

module.exports={
  use:{
    headless:true,
    ...(edge?{launchOptions:{executablePath:edge}}:{})
  }
};
