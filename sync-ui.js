const CLOUD_CONFIG_KEY='phd-cloud-config',CLOUD_IMAGE_BUCKET='phd-note-images',CLOUD_IMAGE_MODE_KEY='phd-cloud-image-mode',CLOUD_EMAIL_KEY='phd-cloud-email',CLOUD_IMAGE_LIMIT=500*1024;
let cloudClient=null,cloudUser=null,cloudTimer=null,cloudSyncing=false;

function cloudConfig(){try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||'{}')}catch{return {}}}
function cloudImageMode(){return localStorage.getItem(CLOUD_IMAGE_MODE_KEY)||'compressed'}
function saveDesktopSyncSettings(){return window.phdDesktop?.saveSyncSettings?.({config:cloudConfig(),email:localStorage.getItem(CLOUD_EMAIL_KEY)||'',imageMode:cloudImageMode()})?.catch?.(()=>{})}
function cloudStatus(text){let target=$('#cloudStatus');if(target)target.textContent=text}
function cloudSizeText(bytes){return `${(bytes/1024/1024).toFixed(bytes<1024*1024?2:1)} MB`}
function cloudTransferSize(bytes=null){let target=$('#cloudTransferSize');if(target)target.textContent=bytes===null?'（本次同步待开始）':`（本次同步 ${cloudSizeText(bytes)}）`}
function cloudHasContent(){return records.length||notes.length||diaries.length}
function cloudStamp(item){return new Date(item?.updatedAt||item?.createdAt||0).getTime()||0}
function mergeCloudList(local,remote,key){let output=new Map(local.map(item=>[item[key],item]));for(let item of remote||[]){let existing=output.get(item[key]);if(!existing||cloudStamp(item)>=cloudStamp(existing))output.set(item[key],item)}return [...output.values()]}

function renderCloudSettings(){
  let config=cloudConfig(),connected=!!cloudUser;
  $('#cloudUrl').value=config.url||'';
  $('#cloudKey').value=config.key||'';
  $('#cloudImageMode').value=cloudImageMode();
  $('#cloudEmail').value=cloudUser?.email||localStorage.getItem(CLOUD_EMAIL_KEY)||'';
  $('#cloudEmail').disabled=connected;
  $('#cloudPassword').disabled=connected;
  $('#cloudPasswordLogin').hidden=connected;
  $('#cloudRegister').hidden=connected;
  $('#cloudLogin').hidden=connected;
  $('#cloudSyncNow').hidden=!connected;
  $('#cloudSignOut').hidden=!connected;
  $('#cloudStatus').textContent=connected?`已登录 ${cloudUser.email}，记录会自动同步。`:config.url?'请填写邮箱并发送登录链接。':'请先填写 Supabase 项目地址和匿名密钥。';
  cloudTransferSize();
}

function ensureCloudSettings(){
  if($('#cloudSettings'))return;
  let section=document.createElement('article');
  section.id='cloudSettings';
  section.innerHTML='<h2>多端自动同步</h2><label class="cloud-image-mode" style="display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin:8px 0 12px"><span>图片同步方式</span><select id="cloudImageMode" style="width:auto;max-width:62vw;margin:0"><option value="compressed">自动压缩至 500 KB（推荐）</option><option value="original">保留原图</option></select></label><p>使用同一账号登录后，iPhone 网页版与 Windows 桌面版会自动同步复盘、随手记、日记和图片。</p><input id="cloudUrl" class="cloud-field" type="url" placeholder="Supabase Project URL"><input id="cloudKey" class="cloud-field" type="password" placeholder="Supabase anon public key"><button id="cloudConnect" type="button">保存云端配置</button><div class="cloud-credentials" style="display:grid;gap:10px;margin:12px 0 4px"><input id="cloudEmail" class="cloud-field" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:12px;background:#e5e5ea;color:#1c1c1e;font:inherit;margin:0" type="email" placeholder="登录邮箱"><input id="cloudPassword" class="cloud-field" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:12px;background:#e5e5ea;color:#1c1c1e;font:inherit;margin:0" type="password" placeholder="密码（Windows 与 iPhone 使用同一密码）"></div><button id="cloudPasswordLogin" type="button">邮箱密码登录</button><button id="cloudRegister" class="plain" type="button">首次注册账号</button><button id="cloudLogin" class="plain" type="button">或发送登录链接</button><button id="cloudSyncNow" type="button">立即同步</button><button id="cloudSignOut" class="plain" type="button">退出登录</button><p id="cloudStatus" class="status"></p>';
  let transferSize=document.createElement('small');transferSize.id='cloudTransferSize';transferSize.style.cssText='font-size:13px;font-weight:400;color:#8e8e93';section.querySelector('h2').append(' ',transferSize);
  $('#preferences').prepend(section);
  $('#cloudConnect').onclick=connectCloud;
  $('#cloudImageMode').onchange=event=>{localStorage.setItem(CLOUD_IMAGE_MODE_KEY,event.target.value);saveDesktopSyncSettings();cloudStatus(event.target.value==='original'?'下次同步将上传原图。':'下次同步将把图片压缩至 500 KB。');window.scheduleCloudSync?.()};
  $('#cloudPasswordLogin').onclick=()=>passwordCloudLogin(false);
  $('#cloudRegister').onclick=()=>passwordCloudLogin(true);
  $('#cloudLogin').onclick=sendCloudLogin;
  $('#cloudSyncNow').onclick=()=>syncCloud(true);
  $('#cloudSignOut').onclick=signOutCloud;
}

async function connectCloud(){
  let url=$('#cloudUrl').value.trim().replace(/\/$/,''),key=$('#cloudKey').value.trim();
  if(!/^https:\/\/.+\.supabase\.co$/i.test(url)||!key)return cloudStatus('请填写正确的 Supabase Project URL 和 anon public key。');
  if(!window.supabase)return cloudStatus('同步组件未加载，请检查网络后重试。');
  localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify({url,key}));
  saveDesktopSyncSettings();
  cloudClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  cloudClient.auth.onAuthStateChange((_event,session)=>{cloudUser=session?.user||null;renderCloudSettings();if(cloudUser)syncCloud(true)});
  let {data:{session}}=await cloudClient.auth.getSession();cloudUser=session?.user||null;
  renderCloudSettings();
}

async function sendCloudLogin(){
  if(!cloudClient)return cloudStatus('请先保存云端配置。');
  let email=$('#cloudEmail').value.trim();if(!email)return cloudStatus('请输入登录邮箱。');localStorage.setItem(CLOUD_EMAIL_KEY,email);saveDesktopSyncSettings();
  cloudStatus('正在发送登录链接…');
  let {error}=await cloudClient.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split('#')[0]}});
  cloudStatus(error?`发送失败：${error.message}`:'登录链接已发送，请在此设备的邮箱中打开链接。');
}

async function passwordCloudLogin(register){
  if(!cloudClient)return cloudStatus('请先保存云端配置。');
  let email=$('#cloudEmail').value.trim(),password=$('#cloudPassword').value;
  if(!email||password.length<6)return cloudStatus('请输入邮箱和至少 6 位的密码。');
  localStorage.setItem(CLOUD_EMAIL_KEY,email);saveDesktopSyncSettings();
  cloudStatus(register?'正在注册…':'正在登录…');
  let result=register?await cloudClient.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}}):await cloudClient.auth.signInWithPassword({email,password});
  if(result.error)return cloudStatus(`${register?'注册':'登录'}失败：${result.error.message}`);
  if(register&&!result.data.session)cloudStatus('注册成功，请在邮箱中完成验证后，再回来点击“邮箱密码登录”。');
}

async function signOutCloud(){
  if(cloudClient)await cloudClient.auth.signOut();
  cloudUser=null;renderCloudSettings();cloudStatus('已退出登录。本机记录仍会保留。');
}

async function cloudSnapshot(cloudImageTypes=new Map()){
  let images=await allNoteImages();
  return {version:1,records,notes,diaries,images:images.map(({id,noteId,name,type})=>({id,noteId,name,type:cloudImageTypes.get(id)||type}))};
}

async function decodeCloudImage(blob){
  if(window.createImageBitmap)return createImageBitmap(blob);
  return new Promise((resolve,reject)=>{let url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('图片无法读取'))};image.src=url});
}
async function compressCloudImage(image){
  if(cloudImageMode()==='original'||image.blob.size<=CLOUD_IMAGE_LIMIT)return {blob:image.blob,type:image.type||image.blob.type||'image/jpeg'};
  let source=await decodeCloudImage(image.blob);try{
    let originalWidth=source.width,originalHeight=source.height,initialScale=Math.min(1,2200/Math.max(originalWidth,originalHeight)),last;
    for(let scale=initialScale;scale>=.12;scale*=.72){
      let canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(originalWidth*scale));canvas.height=Math.max(1,Math.round(originalHeight*scale));canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
      for(let quality of [.88,.78,.68,.58,.48,.38]){let result=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(!result)continue;last=result;if(result.size<=CLOUD_IMAGE_LIMIT)return {blob:result,type:'image/jpeg'}}
    }
    return {blob:last||image.blob,type:last?'image/jpeg':image.type||image.blob.type||'image/jpeg'};
  }finally{source.close?.()}
}
async function uploadCloudImages(images){
  let cloudImageTypes=new Map(),uploadedBytes=0;
  for(let image of images){
    let path=`${cloudUser.id}/${image.id}`,upload=await compressCloudImage(image);
    let {error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).upload(path,upload.blob,{upsert:true,contentType:upload.type});
    if(error)throw error;
    cloudImageTypes.set(image.id,upload.type);
    uploadedBytes+=upload.blob.size;
  }
  return {cloudImageTypes,uploadedBytes};
}

async function downloadCloudImages(images){
  let existing=new Set((await allNoteImages()).map(image=>image.id)),missing=[];
  for(let meta of images||[]){
    if(existing.has(meta.id))continue;
    let {data,error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).download(`${cloudUser.id}/${meta.id}`);
    if(!error&&data)missing.push({...meta,blob:data});
  }
  if(missing.length)await restoreNoteImages(missing);
}

async function pullCloudData(){
  let {data,error}=await cloudClient.from('phd_sync_data').select('payload').eq('user_id',cloudUser.id).maybeSingle();
  if(error)throw error;
  if(!data?.payload)return false;
  let remote=data.payload;
  records=mergeCloudList(records,remote.records||[],'date');
  notes=mergeCloudList(notes,remote.notes||[],'id');
  diaries=mergeCloudList(diaries,remote.diaries||[],'date');
  localStorage.setItem('phd-review-records',JSON.stringify(records));
  localStorage.setItem('phd-quick-notes',JSON.stringify(notes));
  localStorage.setItem('phd-diary-records',JSON.stringify(diaries));
  await downloadCloudImages(remote.images||[]);
  let active=$('.page.active')?.id;if(active)page(active);
  return true;
}

async function pushCloudData(){
  let images=await allNoteImages();
  let {cloudImageTypes,uploadedBytes}=await uploadCloudImages(images);
  let payload=await cloudSnapshot(cloudImageTypes);
  let {error}=await cloudClient.from('phd_sync_data').upsert({user_id:cloudUser.id,payload,updated_at:new Date().toISOString()});
  if(error)throw error;
  return uploadedBytes+new Blob([JSON.stringify(payload)]).size;
}

async function syncCloud(pullFirst=false){
  if(!cloudClient||!cloudUser||cloudSyncing)return;
  cloudSyncing=true;cloudStatus('正在同步…');cloudTransferSize(null);
  try{if(pullFirst)await pullCloudData();let uploadedBytes=await pushCloudData();cloudTransferSize(uploadedBytes);cloudStatus(`已同步：${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`)}catch(error){cloudStatus(`同步失败：${error.message}`)}finally{cloudSyncing=false}
}

window.scheduleCloudSync=()=>{
  if(!cloudClient||!cloudUser)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncCloud(false),1200);
};

ensureCloudSettings();
renderCloudSettings();
function startCloudClient(){let savedCloud=cloudConfig();if(savedCloud.url&&savedCloud.key&&window.supabase&&!cloudClient)connectCloud();}
if(window.supabase)startCloudClient();
window.addEventListener('phd-supabase-ready',startCloudClient);
async function restoreDesktopSyncSettings(){try{let saved=await window.phdDesktop?.loadSyncSettings?.();if(!saved)return;if(saved.config?.url&&saved.config?.key)localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(saved.config));if(saved.email)localStorage.setItem(CLOUD_EMAIL_KEY,saved.email);if(saved.imageMode)localStorage.setItem(CLOUD_IMAGE_MODE_KEY,saved.imageMode);renderCloudSettings();let config=cloudConfig();if(config.url&&config.key&&!cloudClient)connectCloud()}catch{}}
restoreDesktopSyncSettings();
window.addEventListener('online',()=>syncCloud(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncCloud(true)});
setInterval(()=>syncCloud(true),300000);

// iOS Safari can occasionally discard Local Storage while keeping IndexedDB.
// Keep a second, local-only copy of the non-sensitive sync settings so that
// reopening the web app does not require entering the project settings again.
const CLOUD_WEB_SETTINGS_DB='phd-daily-review-settings',CLOUD_WEB_SETTINGS_STORE='settings',CLOUD_WEB_SETTINGS_ID='cloud-sync';
function openCloudWebSettings(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return resolve(null);let request=indexedDB.open(CLOUD_WEB_SETTINGS_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(CLOUD_WEB_SETTINGS_STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveCloudWebSettings(){try{let db=await openCloudWebSettings();if(!db)return;let config={url:$('#cloudUrl')?.value.trim().replace(/\/$/,'')||cloudConfig().url||'',key:$('#cloudKey')?.value.trim()||cloudConfig().key||''},value={id:CLOUD_WEB_SETTINGS_ID,config,email:$('#cloudEmail')?.value.trim()||localStorage.getItem(CLOUD_EMAIL_KEY)||'',imageMode:$('#cloudImageMode')?.value||cloudImageMode()};await new Promise((resolve,reject)=>{let request=db.transaction(CLOUD_WEB_SETTINGS_STORE,'readwrite').objectStore(CLOUD_WEB_SETTINGS_STORE).put(value);request.onsuccess=resolve;request.onerror=()=>reject(request.error)});db.close()}catch{}}
async function restoreCloudWebSettings(){try{let db=await openCloudWebSettings();if(!db)return;let saved=await new Promise((resolve,reject)=>{let request=db.transaction(CLOUD_WEB_SETTINGS_STORE,'readonly').objectStore(CLOUD_WEB_SETTINGS_STORE).get(CLOUD_WEB_SETTINGS_ID);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});db.close();if(!saved)return;let current=cloudConfig(),config=current.url&&current.key?current:saved.config||{};if(config.url&&config.key)localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(config));if(!localStorage.getItem(CLOUD_EMAIL_KEY)&&saved.email)localStorage.setItem(CLOUD_EMAIL_KEY,saved.email);if(!localStorage.getItem(CLOUD_IMAGE_MODE_KEY)&&saved.imageMode)localStorage.setItem(CLOUD_IMAGE_MODE_KEY,saved.imageMode);renderCloudSettings();if(config.url&&config.key&&!cloudClient)connectCloud()}catch{}}
let cloudSettingsSaveTimer=null;
document.addEventListener('input',event=>{if(!event.target.matches('#cloudUrl,#cloudKey,#cloudEmail'))return;clearTimeout(cloudSettingsSaveTimer);cloudSettingsSaveTimer=setTimeout(saveCloudWebSettings,300)});
document.addEventListener('change',event=>{if(event.target.matches('#cloudImageMode'))saveCloudWebSettings()});
window.addEventListener('pagehide',saveCloudWebSettings);
saveCloudWebSettings();
restoreCloudWebSettings();
// Let iPhone's system password manager offer the saved credential securely.
$('#cloudEmail').autocomplete='email';
$('#cloudEmail').name='cloud-email';
$('#cloudPassword').autocomplete='current-password';
$('#cloudPassword').name='cloud-password';
