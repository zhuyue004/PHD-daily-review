// Android WebView supplies this bridge. Browsers keep their normal download flow.
if(window.AndroidBridge?.saveFile){
  download=async function(content,name,type){
    let blob=content instanceof Blob?content:new Blob([content],{type:type||'application/octet-stream'});
    let dataUrl=await new Promise((resolve,reject)=>{let reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
    window.AndroidBridge.saveFile(dataUrl,name,type||blob.type||'application/octet-stream');
  };
}
