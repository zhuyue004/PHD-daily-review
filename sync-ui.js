const CLOUD_CONFIG_KEY='phd-cloud-config',CLOUD_IMAGE_BUCKET='phd-note-images',CLOUD_IMAGE_MODE_KEY='phd-cloud-image-mode',CLOUD_EMAIL_KEY='phd-cloud-email',CLOUD_IMAGE_LIMIT=500*1024,CLOUD_DELETIONS_KEY='phd-cloud-deletions';
let cloudClient=null,cloudUser=null,cloudTimer=null,cloudSyncing=false,cloudRemoteImageIds=new Set(),cloudRemoteImageTypes=new Map();

function cloudConfig(){try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||'{}')}catch{return {}}}
function cloudImageMode(){return localStorage.getItem(CLOUD_IMAGE_MODE_KEY)||'compressed'}
function saveDesktopSyncSettings(){return window.phdDesktop?.saveSyncSettings?.({config:cloudConfig(),email:localStorage.getItem(CLOUD_EMAIL_KEY)||'',imageMode:cloudImageMode()})?.catch?.(()=>{})}
function cloudStatus(text){let target=$('#cloudStatus');if(target)target.textContent=text}
function cloudSizeText(bytes){return `${(bytes/1024/1024).toFixed(bytes<1024*1024?2:1)} MB`}
function cloudTransferSize(bytes=null){let target=$('#cloudTransferSize');if(target)target.textContent=bytes===null?'（本次同步待开始）':`（本次同步 ${cloudSizeText(bytes)}）`}
function cloudHasContent(){return records.length||notes.length||diaries.length}
function cloudStamp(item){return new Date(item?.updatedAt||item?.createdAt||0).getTime()||0}
function mergeCloudList(local,remote,key){let output=new Map(local.map(item=>[item[key],item]));for(let item of remote||[]){let existing=output.get(item[key]);if(!existing||cloudStamp(item)>cloudStamp(existing))output.set(item[key],item)}return [...output.values()]}
function cloudDeletions(){try{return JSON.parse(localStorage.getItem(CLOUD_DELETIONS_KEY)||'[]').filter(item=>item?.kind&&item?.id)}catch{return []}}
function saveCloudDeletions(items){let latest=new Map();for(let item of items||[]){let key=`${item.kind}:${item.id}`,existing=latest.get(key),newer=!existing||new Date(item.deletedAt||0)>=new Date(existing.deletedAt||0),imageIds=[...new Set([...(existing?.imageIds||[]),...(item.imageIds||[])])],imagesRemovedAt=existing?.imagesRemovedAt||item.imagesRemovedAt||'';latest.set(key,{kind:item.kind,id:item.id,deletedAt:newer?(item.deletedAt||new Date().toISOString()):(existing.deletedAt||new Date().toISOString()),imageIds,imagesRemovedAt})}localStorage.setItem(CLOUD_DELETIONS_KEY,JSON.stringify([...latest.values()]));return [...latest.values()]}
function rememberCloudDeletion(kind,id,imageIds=[]){if(!id)return;saveCloudDeletions([...cloudDeletions(),{kind,id,deletedAt:new Date().toISOString(),imageIds}])}
function deletionSet(items=cloudDeletions()){return new Set(items.map(item=>`${item.kind}:${item.id}`))}
let applyingCloudDeletions=false;
const originalDeleteStoredImages=deleteNoteImages;
deleteNoteImages=async function(noteIds){
  let ids=[...(noteIds||[])];
  if(!applyingCloudDeletions&&ids.length){let images=await allNoteImages();for(let id of ids){let kind=notes.some(item=>item.id===id)?'note':diaries.some(item=>item.id===id)?'diary':'note';rememberCloudDeletion(kind,id,images.filter(image=>image.noteId===id).map(image=>image.id))}}
  return originalDeleteStoredImages(ids);
};
async function applyCloudDeletions(items=cloudDeletions()){
  let removed=deletionSet(items),recordKey=item=>item.id||item.date,noteIds=notes.filter(item=>removed.has(`note:${item.id}`)).map(item=>item.id),diaryIds=diaries.filter(item=>removed.has(`diary:${item.id}`)).map(item=>item.id);
  applyingCloudDeletions=true;
  try{if(noteIds.length)await deleteNoteImages(noteIds);if(diaryIds.length)await deleteDiaryImages(diaryIds);records=records.filter(item=>!removed.has(`record:${recordKey(item)}`));notes=notes.filter(item=>!removed.has(`note:${item.id}`));diaries=diaries.filter(item=>!removed.has(`diary:${item.id}`))}finally{applyingCloudDeletions=false}
}
let knownCloudRecordKeys=new Set(records.map(item=>item.id||item.date)),knownCloudNoteIds=new Set(notes.map(item=>item.id)),knownCloudDiaryIds=new Set(diaries.map(item=>item.id));
function watchCloudDeletes(){
  let currentRecords=new Set(records.map(item=>item.id||item.date)),currentNotes=new Set(notes.map(item=>item.id)),currentDiaries=new Set(diaries.map(item=>item.id));
  for(let id of knownCloudRecordKeys)if(!currentRecords.has(id))rememberCloudDeletion('record',id);
  for(let id of knownCloudNoteIds)if(!currentNotes.has(id))rememberCloudDeletion('note',id);
  for(let id of knownCloudDiaryIds)if(!currentDiaries.has(id))rememberCloudDeletion('diary',id);
  knownCloudRecordKeys=currentRecords;knownCloudNoteIds=currentNotes;knownCloudDiaryIds=currentDiaries;
}
function refreshCloudDeleteWatch(){knownCloudRecordKeys=new Set(records.map(item=>item.id||item.date));knownCloudNoteIds=new Set(notes.map(item=>item.id));knownCloudDiaryIds=new Set(diaries.map(item=>item.id))}

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
  if(!window.supabase){
    cloudStatus('正在加载同步组件…');
    try{await window.loadSupabaseSdk?.();}catch{return cloudStatus('同步组件未加载。请检查网络后重试。')}
    if(!window.supabase)return cloudStatus('同步组件未加载。请检查网络后重试。');
  }
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
  return {version:2,records,notes,diaries,deleted:cloudDeletions(),images:images.map(({id,noteId,name,type})=>({id,noteId,name,type:cloudImageTypes.get(id)||type}))};
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
  let cloudImageTypes=new Map(),uploadedBytes=0,pending=images.filter(image=>!cloudRemoteImageIds.has(image.id));
  for(let image of pending){
    let path=`${cloudUser.id}/${image.id}`,upload=await compressCloudImage(image);
    let {error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).upload(path,upload.blob,{upsert:true,contentType:upload.type});
    if(error)throw error;
    cloudImageTypes.set(image.id,upload.type);
    cloudRemoteImageIds.add(image.id);
    cloudRemoteImageTypes.set(image.id,upload.type);
    uploadedBytes+=upload.blob.size;
  }
  for(let image of images)if(!cloudImageTypes.has(image.id))cloudImageTypes.set(image.id,cloudRemoteImageTypes.get(image.id)||image.type||image.blob.type||'image/jpeg');
  return {cloudImageTypes,uploadedBytes};
}
async function removeDeletedCloudImages(){
  let pending=cloudDeletions().filter(item=>item.imageIds?.length&&!item.imagesRemovedAt),paths=[...new Set(pending.flatMap(item=>item.imageIds.map(id=>`${cloudUser.id}/${id}`)))];
  for(let index=0;index<paths.length;index+=100){let {error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).remove(paths.slice(index,index+100));if(error)throw error}
  if(pending.length)saveCloudDeletions(cloudDeletions().map(item=>pending.some(candidate=>candidate.kind===item.kind&&candidate.id===item.id)?{...item,imagesRemovedAt:new Date().toISOString()}:item));
}
async function removeOrphanCloudImages(activeImages){
  let activeIds=new Set(activeImages.map(image=>image.id)),objects=[],offset=0;
  while(true){let {data,error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).list(cloudUser.id,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});if(error)throw error;objects.push(...(data||[]));if(!data||data.length<1000)break;offset+=data.length}
  let stale=objects.filter(item=>item.name&&!item.name.includes('/')&&!activeIds.has(item.name)).map(item=>`${cloudUser.id}/${item.name}`);
  for(let index=0;index<stale.length;index+=100){let {error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).remove(stale.slice(index,index+100));if(error)throw error}
  return stale.length;
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
  if(!data?.payload){cloudRemoteImageIds.clear();cloudRemoteImageTypes.clear();return false}
  let remote=data.payload,deleted=saveCloudDeletions([...cloudDeletions(),...(remote.deleted||[])]);
  cloudRemoteImageIds=new Set((remote.images||[]).map(image=>image.id));
  cloudRemoteImageTypes=new Map((remote.images||[]).map(image=>[image.id,image.type]));
  records=mergeCloudList(records,remote.records||[],'date');
  notes=mergeCloudList(notes,remote.notes||[],'id');
  diaries=mergeCloudList(diaries,remote.diaries||[],'date');
  await applyCloudDeletions(deleted);
  localStorage.setItem('phd-review-records',JSON.stringify(records));
  localStorage.setItem('phd-quick-notes',JSON.stringify(notes));
  localStorage.setItem('phd-diary-records',JSON.stringify(diaries));
  refreshCloudDeleteWatch();
  let deletedIds=deletionSet(deleted);
  await downloadCloudImages((remote.images||[]).filter(image=>!deletedIds.has(`note:${image.noteId}`)&&!deletedIds.has(`diary:${image.noteId}`)));
  let active=$('.page.active')?.id;if(active)page(active);
  return true;
}

async function pushCloudData(cleanOrphans=false){
  let images=await allNoteImages();
  await removeDeletedCloudImages();
  let {cloudImageTypes,uploadedBytes}=await uploadCloudImages(images);
  let payload=await cloudSnapshot(cloudImageTypes);
  let {error}=await cloudClient.from('phd_sync_data').upsert({user_id:cloudUser.id,payload,updated_at:new Date().toISOString()});
  if(error)throw error;
  if(cleanOrphans)await removeOrphanCloudImages(images);
  return uploadedBytes+new Blob([JSON.stringify(payload)]).size;
}

async function syncCloud(pullFirst=false){
  if(!cloudClient||!cloudUser||cloudSyncing)return;
  cloudSyncing=true;cloudStatus('正在同步…');cloudTransferSize(null);
  try{if(pullFirst)await pullCloudData();let uploadedBytes=await pushCloudData(pullFirst);cloudTransferSize(uploadedBytes);cloudStatus(`已同步：${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`)}catch(error){cloudStatus(`同步失败：${error.message}`)}finally{cloudSyncing=false}
}

window.scheduleCloudSync=()=>{
  watchCloudDeletes();
  if(!cloudClient||!cloudUser)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncCloud(true),1200);
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
