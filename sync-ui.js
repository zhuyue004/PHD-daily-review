const CLOUD_CONFIG_KEY='phd-cloud-config',CLOUD_IMAGE_BUCKET='phd-note-images',CLOUD_IMAGE_MODE_KEY='phd-cloud-image-mode',CLOUD_EMAIL_KEY='phd-cloud-email',CLOUD_IMAGE_LIMIT=500*1024,CLOUD_DELETIONS_KEY='phd-cloud-deletions',CLOUD_RESTORE_PENDING_KEY='phd-cloud-restore-pending',CLOUD_CLEANUP_LAST_KEY='phd-cloud-cleanup-last',CLOUD_SKIPPED_IMAGES_KEY='phd-cloud-skipped-images',CLOUD_CLEANUP_INTERVAL=7*24*60*60*1000,CLOUD_IMAGE_CONCURRENCY=2,CLOUD_REQUEST_TIMEOUT=30000,CLOUD_IMAGE_REQUEST_TIMEOUT=45000,CLOUD_IMAGE_PROCESS_TIMEOUT=15000;
// Publishable key: this is intentionally public client configuration, not a secret.
const CLOUD_DEFAULT_CONFIG=Object.freeze({url:'https://vyabmqgisuoiqvyzbpwf.supabase.co',key:'sb_publishable_mQFR2_NI6wrON63ccrysEQ_lYSUqWy7'});
let cloudClient=null,cloudUser=null,cloudTimer=null,cloudSyncing=false,cloudSyncQueued=false,cloudQueuedPullFirst=false,cloudPasswordRecovery=false,cloudRemoteImageIds=new Set(),cloudRemoteImageTypes=new Map(),cloudRemotePayload=null,cloudProblemImage=null;

function cloudConfig(){return CLOUD_DEFAULT_CONFIG}
function cloudImageMode(){return localStorage.getItem(CLOUD_IMAGE_MODE_KEY)||'compressed'}
function saveDesktopSyncSettings(){return window.phdDesktop?.saveSyncSettings?.({config:cloudConfig(),email:localStorage.getItem(CLOUD_EMAIL_KEY)||'',imageMode:cloudImageMode()})?.catch?.(()=>{})}
function cloudStatus(text){let target=$('#cloudStatus');if(target)target.textContent=text}
function cloudImageContext(image){let note=notes.find(item=>item.id===image?.noteId),diary=diaries.find(item=>item.id===image?.noteId),owner=note||diary,kind=note?'随手记':diary?'日记':'未知记录',preview=String(owner?.text||'').replace(/\s+/g,' ').trim().slice(0,28);return {imageId:image?.id||'',noteId:image?.noteId||'',name:image?.name||'未命名图片',kind,date:owner?.date||'',createdAt:owner?.createdAt||owner?.updatedAt||'',preview:preview||'无文字内容'}}
function cloudImageContextText(problem){let time=problem.createdAt?new Date(problem.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';return [problem.kind,problem.date,time,problem.preview].filter(Boolean).join(' · ')}
function attachCloudImageContext(error,image){let problem=cloudImageContext(image),result=error instanceof Error?error:new Error(String(error||'图片同步失败'));result.cloudImage=problem;if(!result.message.includes('位置：'))result.message+=`；位置：${cloudImageContextText(problem)}`;return result}
function setCloudProblem(problem){cloudProblemImage=problem||null;let locate=$('#cloudLocateProblem'),skip=$('#cloudSkipProblem');if(locate){locate.hidden=!cloudProblemImage;locate.textContent=cloudProblemImage?`查看问题图片位置（${cloudProblemImage.kind}）`:'查看问题图片位置'}if(skip)skip.hidden=!cloudProblemImage}
function locateCloudProblem(){if(!cloudProblemImage)return;let note=notes.find(item=>item.id===cloudProblemImage.noteId),diary=diaries.find(item=>item.id===cloudProblemImage.noteId);if(note){page('archive');let input=$('#archiveDate'),button=$('#archiveDateButton');if(input)input.value=note.date;if(button)button.textContent=fmt(note.date);if(typeof calendarMonth!=='undefined')calendarMonth=new Date(`${note.date}T12:00`);archive();setTimeout(()=>typeof openArchiveNoteEditor==='function'&&openArchiveNoteEditor(note),50);return}if(diary){page('diary');setTimeout(()=>typeof editDiary==='function'&&editDiary(diary),50);return}alert(`未找到对应记录。图片文件：${cloudProblemImage.name}\n记录 ID：${cloudProblemImage.noteId}`)}
function skipCloudProblem(){if(!cloudProblemImage?.imageId)return;if(!confirm(`跳过“${cloudProblemImage.name}”的云端同步吗？\n\n本机图片不会删除，但其他设备不会收到这张图片；文字和其他图片会继续同步。`))return;let skipped=cloudSkippedImages();skipped.add(cloudProblemImage.imageId);saveCloudSkippedImages(skipped);let name=cloudProblemImage.name;setCloudProblem(null);cloudStatus(`已跳过“${name}”，正在继续同步…`);syncCloud(true,true)}
function cloudSizeText(bytes){return `${(bytes/1024/1024).toFixed(bytes<1024*1024?2:1)} MB`}
function cloudTransferSize(bytes=null){let target=$('#cloudTransferSize');if(target)target.textContent=bytes===null?'（本次同步待开始）':`（本次同步 ${cloudSizeText(bytes)}）`}
function cloudWait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function cloudTimed(task,timeout,label){let timer;try{return await Promise.race([Promise.resolve().then(task),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label}超时，请检查网络后重试`)),timeout)})])}finally{clearTimeout(timer)}}
async function cloudOperation(task,label,{timeout=CLOUD_REQUEST_TIMEOUT,retries=1}={}){let lastError;for(let attempt=0;attempt<=retries;attempt++){try{let result=await cloudTimed(task,timeout,label);if(result?.error)throw result.error;return result}catch(error){lastError=error;if(attempt<retries){cloudStatus(`${label}未完成，正在重试…`);await cloudWait(500*(attempt+1))}}}let message=lastError?.message||String(lastError||'未知错误');throw new Error(message.startsWith(label)?message:`${label}失败：${message}`)}
function cloudHasContent(){let plans=window.getInsightPlansForSync?.();return records.length||notes.length||diaries.length||Object.keys(plans?.week||{}).length||Object.keys(plans?.month||{}).length}
function cloudRestorePending(){return !!localStorage.getItem(CLOUD_RESTORE_PENDING_KEY)}
function markCloudRestorePending(){localStorage.setItem(CLOUD_RESTORE_PENDING_KEY,new Date().toISOString());refreshCloudDeleteWatch()}
window.markCloudRestorePending=markCloudRestorePending;
function cloudStamp(item){return new Date(item?.updatedAt||item?.createdAt||0).getTime()||0}
function mergeCloudList(local,remote,key){let output=new Map(local.map(item=>[item[key],item]));for(let item of remote||[]){let existing=output.get(item[key]);if(!existing||cloudStamp(item)>cloudStamp(existing))output.set(item[key],item)}return [...output.values()]}
function cloudDeletions(){try{return JSON.parse(localStorage.getItem(CLOUD_DELETIONS_KEY)||'[]').filter(item=>item?.kind&&item?.id)}catch{return []}}
function cloudSkippedImages(){try{return new Set(JSON.parse(localStorage.getItem(CLOUD_SKIPPED_IMAGES_KEY)||'[]').filter(Boolean))}catch{return new Set()}}
function saveCloudSkippedImages(ids){let values=[...new Set(ids||[])];if(values.length)localStorage.setItem(CLOUD_SKIPPED_IMAGES_KEY,JSON.stringify(values));else localStorage.removeItem(CLOUD_SKIPPED_IMAGES_KEY);return new Set(values)}
function saveCloudDeletions(items){let latest=new Map();for(let item of items||[]){let key=`${item.kind}:${item.id}`,existing=latest.get(key),newer=!existing||new Date(item.deletedAt||0)>=new Date(existing.deletedAt||0),imageIds=[...new Set([...(existing?.imageIds||[]),...(item.imageIds||[])])],imagesRemovedAt=existing?.imagesRemovedAt||item.imagesRemovedAt||'';latest.set(key,{kind:item.kind,id:item.id,deletedAt:newer?(item.deletedAt||new Date().toISOString()):(existing.deletedAt||new Date().toISOString()),imageIds,imagesRemovedAt})}localStorage.setItem(CLOUD_DELETIONS_KEY,JSON.stringify([...latest.values()]));return [...latest.values()]}
function rememberCloudDeletion(kind,id,imageIds=[]){if(!id)return;saveCloudDeletions([...cloudDeletions(),{kind,id,deletedAt:new Date().toISOString(),imageIds}])}
function deletionSet(items=cloudDeletions()){return new Set(items.map(item=>`${item.kind}:${item.id}`))}
function keepRestoredItems(items){
  if(!cloudRestorePending())return items;
  let recordIds=new Set(records.map(item=>item.id||item.date)),noteIds=new Set(notes.map(item=>item.id)),diaryIds=new Set(diaries.map(item=>item.id));
  return (items||[]).filter(item=>!((item.kind==='record'&&recordIds.has(item.id))||(item.kind==='note'&&noteIds.has(item.id))||(item.kind==='diary'&&diaryIds.has(item.id))));
}
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
  // A restore replaces local lists in one operation. It is not a user deletion
  // and must never create cloud deletion tombstones.
  if(cloudRestorePending()){refreshCloudDeleteWatch();return}
  let currentRecords=new Set(records.map(item=>item.id||item.date)),currentNotes=new Set(notes.map(item=>item.id)),currentDiaries=new Set(diaries.map(item=>item.id));
  for(let id of knownCloudRecordKeys)if(!currentRecords.has(id))rememberCloudDeletion('record',id);
  for(let id of knownCloudNoteIds)if(!currentNotes.has(id))rememberCloudDeletion('note',id);
  for(let id of knownCloudDiaryIds)if(!currentDiaries.has(id))rememberCloudDeletion('diary',id);
  knownCloudRecordKeys=currentRecords;knownCloudNoteIds=currentNotes;knownCloudDiaryIds=currentDiaries;
}
function refreshCloudDeleteWatch(){knownCloudRecordKeys=new Set(records.map(item=>item.id||item.date));knownCloudNoteIds=new Set(notes.map(item=>item.id));knownCloudDiaryIds=new Set(diaries.map(item=>item.id))}

function renderCloudSettings(){
  let connected=!!cloudUser,recovering=connected&&cloudPasswordRecovery;
  $('#cloudImageMode').value=cloudImageMode();
  $('#cloudEmail').value=cloudUser?.email||localStorage.getItem(CLOUD_EMAIL_KEY)||'';
  $('#cloudEmail').disabled=connected;
  $('#cloudPassword').disabled=connected;
  $('#cloudPasswordLogin').hidden=connected;
  $('#cloudRegister').hidden=connected;
  $('#cloudLogin').hidden=connected;
  $('#cloudResetPassword').hidden=connected;
  $('#cloudRecovery').hidden=!recovering;
  $('#cloudSyncNow').hidden=!connected||recovering;
  $('#cloudSignOut').hidden=!connected;
  $('#cloudStatus').textContent=recovering?'请设置新密码；完成后即可继续自动同步。':connected?`已登录 ${cloudUser.email}，记录会自动同步。`:'请输入邮箱和密码登录。';
  cloudTransferSize();
}

function ensureCloudSettings(){
  if($('#cloudSettings'))return;
  let section=document.createElement('article');
  section.id='cloudSettings';
  section.innerHTML='<h2>多端自动同步</h2><label class="cloud-image-mode" style="display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin:8px 0 12px"><span>图片同步方式</span><select id="cloudImageMode" style="width:auto;max-width:62vw;margin:0"><option value="compressed">自动压缩至 500 KB（推荐）</option><option value="original">保留原图</option></select></label><p>使用同一账号登录后，iPhone 网页版与 Windows 桌面版会自动同步复盘、随手记、日记和图片。</p><div class="cloud-credentials" style="display:grid;gap:10px;margin:12px 0 4px"><input id="cloudEmail" class="cloud-field" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:12px;background:#e5e5ea;color:#1c1c1e;font:inherit;margin:0" type="email" placeholder="登录邮箱"><input id="cloudPassword" class="cloud-field" style="width:100%;box-sizing:border-box;border:0;border-radius:11px;padding:12px;background:#e5e5ea;color:#1c1c1e;font:inherit;margin:0" type="password" placeholder="密码（Windows 与 iPhone 使用同一密码）"></div><button id="cloudPasswordLogin" type="button">邮箱密码登录</button><button id="cloudResetPassword" class="plain" type="button">忘记密码</button><button id="cloudRegister" class="plain" type="button">首次注册账号</button><button id="cloudLogin" class="plain" type="button">或发送登录链接</button><div id="cloudRecovery" hidden><p>请设置至少 6 位的新密码：</p><input id="cloudNewPassword" class="cloud-field" type="password" placeholder="新密码（至少 6 位）"><input id="cloudNewPasswordConfirm" class="cloud-field" type="password" placeholder="再次输入新密码"><button id="cloudUpdatePassword" type="button">保存新密码</button></div><button id="cloudSyncNow" type="button">立即同步</button><button id="cloudSignOut" class="plain" type="button">退出登录</button><p id="cloudStatus" class="status"></p><button id="cloudLocateProblem" class="plain" type="button" hidden>查看问题图片位置</button><button id="cloudSkipProblem" class="plain" type="button" hidden>跳过此图片并继续同步</button>';
  let transferSize=document.createElement('small');transferSize.id='cloudTransferSize';transferSize.style.cssText='font-size:13px;font-weight:400;color:#8e8e93';section.querySelector('h2').append(' ',transferSize);
  $('#preferences').prepend(section);
  $('#cloudImageMode').onchange=event=>{localStorage.setItem(CLOUD_IMAGE_MODE_KEY,event.target.value);saveDesktopSyncSettings();cloudStatus(event.target.value==='original'?'下次同步将上传原图。':'下次同步将把图片压缩至 500 KB。');window.scheduleCloudSync?.()};
  $('#cloudPasswordLogin').onclick=()=>passwordCloudLogin(false);
  $('#cloudResetPassword').onclick=requestCloudPasswordReset;
  $('#cloudRegister').onclick=()=>passwordCloudLogin(true);
  $('#cloudLogin').onclick=sendCloudLogin;
  $('#cloudUpdatePassword').onclick=updateCloudPassword;
  $('#cloudSyncNow').onclick=()=>syncCloud(true,true);
  $('#cloudSignOut').onclick=signOutCloud;
  $('#cloudLocateProblem').onclick=locateCloudProblem;
  $('#cloudSkipProblem').onclick=skipCloudProblem;
}

async function connectCloud(){
  let {url,key}=cloudConfig();
  if(!window.supabase){
    cloudStatus('正在加载同步组件…');
    try{await window.loadSupabaseSdk?.();}catch{return cloudStatus('同步组件未加载。请检查网络后重试。')}
    if(!window.supabase)return cloudStatus('同步组件未加载。请检查网络后重试。');
  }
  localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify({url,key}));
  saveDesktopSyncSettings();
  cloudClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  cloudClient.auth.onAuthStateChange((event,session)=>{cloudUser=session?.user||null;if(event==='PASSWORD_RECOVERY'&&cloudUser)cloudPasswordRecovery=true;if(event==='SIGNED_OUT')cloudPasswordRecovery=false;renderCloudSettings();if(cloudUser&&!cloudPasswordRecovery&&['INITIAL_SESSION','SIGNED_IN','USER_UPDATED'].includes(event))syncCloud(true)});
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

function cloudRecoveryRedirect(){
  // Electron 的 file:// 地址不能作为 Supabase 邮件重定向地址；此时由
  // Supabase 项目中配置的 Site URL 接收重设链接，避免写死错误的 Pages 地址。
  return location.protocol==='file:'?null:location.href.split('#')[0];
}

async function requestCloudPasswordReset(){
  if(!cloudClient)return cloudStatus('请先保存云端配置。');
  let email=$('#cloudEmail').value.trim();
  if(!email)return cloudStatus('请输入需要找回的登录邮箱。');
  localStorage.setItem(CLOUD_EMAIL_KEY,email);saveDesktopSyncSettings();
  cloudStatus('正在发送重设密码链接…');
  try{
    const redirectTo=cloudRecoveryRedirect();
    let {error}=await cloudClient.auth.resetPasswordForEmail(email,redirectTo?{redirectTo}:undefined);
    cloudStatus(error?`发送失败：${error.message}`:'重设链接已发送。请在邮件中打开链接，并在返回的页面设置新密码。');
  }catch(error){cloudStatus(`发送失败：${error.message||'无法连接同步服务。'}`)}
}

async function updateCloudPassword(){
  if(!cloudClient||!cloudUser||!cloudPasswordRecovery)return cloudStatus('请从重设密码邮件中的链接返回后，再设置新密码。');
  let password=$('#cloudNewPassword').value,confirmPassword=$('#cloudNewPasswordConfirm').value;
  if(password.length<6)return cloudStatus('新密码至少需要 6 位。');
  if(password!==confirmPassword)return cloudStatus('两次输入的新密码不一致。');
  cloudStatus('正在保存新密码…');
  try{
    let {error}=await cloudClient.auth.updateUser({password});
    if(error)return cloudStatus(`保存失败：${error.message}`);
    cloudPasswordRecovery=false;
    $('#cloudPassword').value='';
    renderCloudSettings();
    cloudStatus('新密码已保存。现在可在 iPhone、Windows 和 Android 使用该密码登录。');
    syncCloud(true);
  }catch(error){cloudStatus(`保存失败：${error.message||'请重新打开重设链接后再试。'}`)}
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

function cloudSnapshot(images=[],skipped=new Set()){
  let withoutSkipped=item=>({...item,images:(item.images||[]).filter(id=>!skipped.has(id))});
  return {version:2,records,notes:notes.map(withoutSkipped),diaries:diaries.map(withoutSkipped),plans:window.getInsightPlansForSync?.()||{},deleted:cloudDeletions(),images};
}

function stableCloudValue(value){if(Array.isArray(value))return value.map(stableCloudValue);if(value&&typeof value==='object')return Object.keys(value).sort().reduce((output,key)=>(output[key]=stableCloudValue(value[key]),output),{});return value}
function cloudComparablePayload(payload){if(!payload)return null;let sorted=(items,key)=>[...(items||[])].sort((a,b)=>String(key(a)).localeCompare(String(key(b))));return {version:payload.version||2,records:sorted(payload.records,item=>item.id||item.date),notes:sorted(payload.notes,item=>item.id),diaries:sorted(payload.diaries,item=>item.id||item.date),plans:payload.plans||{},deleted:sorted(payload.deleted,item=>`${item.kind}:${item.id}`),images:sorted(payload.images,item=>item.id)}}
function cloudPayloadSignature(payload){return payload?JSON.stringify(stableCloudValue(cloudComparablePayload(payload))):''}
function cloudPayloadEqual(left,right){return !!left&&!!right&&cloudPayloadSignature(left)===cloudPayloadSignature(right)}
function cloudLocalSignature(){return cloudPayloadSignature({version:2,records,notes,diaries,plans:window.getInsightPlansForSync?.()||{},deleted:cloudDeletions(),images:[]})}
function cloudCleanupDue(){let last=Number(localStorage.getItem(CLOUD_CLEANUP_LAST_KEY)||0);if(!last){localStorage.setItem(CLOUD_CLEANUP_LAST_KEY,String(Date.now()));return false}return Date.now()-last>=CLOUD_CLEANUP_INTERVAL}

async function decodeCloudImage(blob){
  if(window.createImageBitmap)return cloudTimed(()=>createImageBitmap(blob),CLOUD_IMAGE_PROCESS_TIMEOUT,'读取图片');
  return cloudTimed(()=>new Promise((resolve,reject)=>{let url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('图片无法读取'))};image.src=url}),CLOUD_IMAGE_PROCESS_TIMEOUT,'读取图片');
}
function cloudCanvasBlob(canvas,quality){return cloudTimed(()=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片压缩失败')),'image/jpeg',quality)),CLOUD_IMAGE_PROCESS_TIMEOUT,'压缩图片')}
async function compressCloudImage(image){
  let original={blob:image.blob,type:image.type||image.blob.type||'image/jpeg'};
  if(cloudImageMode()==='original'||image.blob.size<=CLOUD_IMAGE_LIMIT||original.type==='image/gif')return original;
  let source;
  try{
    source=await decodeCloudImage(image.blob);
    let originalWidth=source.width,originalHeight=source.height,scale=Math.min(1,2048/Math.max(originalWidth,originalHeight)),best;
    for(let round=0;round<3;round++){
      let canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(originalWidth*scale));canvas.height=Math.max(1,Math.round(originalHeight*scale));let context=canvas.getContext('2d');if(!context)throw new Error('无法创建图片画布');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);
      for(let quality of [.82,.62,.44]){let result=await cloudCanvasBlob(canvas,quality);if(!best||result.size<best.size)best=result;if(result.size<=CLOUD_IMAGE_LIMIT)return {blob:result,type:'image/jpeg'}}
      let ratio=Math.sqrt(CLOUD_IMAGE_LIMIT/Math.max(best?.size||CLOUD_IMAGE_LIMIT,1));scale*=Math.max(.42,Math.min(.78,ratio*.9));
    }
    return best&&best.size<image.blob.size?{blob:best,type:'image/jpeg'}:original;
  }catch{return original}finally{source?.close?.()}
}
async function uploadCloudImages(images){
  let cloudImageTypes=new Map(),uploadedBytes=0,cursor=0,completed=0,firstError=null,stopped=false;
  async function worker(){while(!stopped&&cursor<images.length){let index=cursor++,image=images[index],path=`${cloudUser.id}/${image.id}`,label=`图片“${image.name||index+1}”`;try{if(!image.blob||typeof image.blob.arrayBuffer!=='function'||!Number.isFinite(image.blob.size)||image.blob.size<=0)throw new Error(`${label}内容为空，请删除后重新添加`);cloudStatus(`正在处理图片 ${index+1}/${images.length}…`);let upload=await compressCloudImage(image),content=await cloudTimed(()=>upload.blob.arrayBuffer(),CLOUD_IMAGE_PROCESS_TIMEOUT,`${label}读取`);if(!content?.byteLength)throw new Error(`${label}内容为空，请删除后重新添加`);cloudStatus(`正在上传图片 ${completed+1}/${images.length}…`);await cloudOperation(()=>cloudClient.storage.from(CLOUD_IMAGE_BUCKET).upload(path,content,{upsert:true,contentType:upload.type}),`${label}上传`,{timeout:CLOUD_IMAGE_REQUEST_TIMEOUT,retries:1});cloudImageTypes.set(image.id,upload.type);uploadedBytes+=content.byteLength;completed++;cloudStatus(`已上传图片 ${completed}/${images.length}`)}catch(error){firstError=firstError||attachCloudImageContext(error,image);stopped=true}}}
  await Promise.all(Array.from({length:Math.min(CLOUD_IMAGE_CONCURRENCY,images.length)},()=>worker()));
  if(firstError)throw firstError;
  return {cloudImageTypes,uploadedBytes};
}
async function removeDeletedCloudImages(){
  let pending=cloudDeletions().filter(item=>item.imageIds?.length&&!item.imagesRemovedAt),paths=[...new Set(pending.flatMap(item=>item.imageIds.map(id=>`${cloudUser.id}/${id}`)))];
  for(let index=0;index<paths.length;index+=100)await cloudOperation(()=>cloudClient.storage.from(CLOUD_IMAGE_BUCKET).remove(paths.slice(index,index+100)),'清理已删除图片');
  if(pending.length)saveCloudDeletions(cloudDeletions().map(item=>pending.some(candidate=>candidate.kind===item.kind&&candidate.id===item.id)?{...item,imagesRemovedAt:new Date().toISOString()}:item));
  return paths.length;
}
async function removeOrphanCloudImages(activeImages){
  let activeIds=new Set(activeImages.map(image=>image.id)),objects=[],offset=0;
  while(true){let {data}=await cloudOperation(()=>cloudClient.storage.from(CLOUD_IMAGE_BUCKET).list(cloudUser.id,{limit:1000,offset,sortBy:{column:'name',order:'asc'}}),'读取云端图片清单');objects.push(...(data||[]));if(!data||data.length<1000)break;offset+=data.length}
  let stale=objects.filter(item=>item.name&&!item.name.includes('/')&&!activeIds.has(item.name)).map(item=>`${cloudUser.id}/${item.name}`);
  for(let index=0;index<stale.length;index+=100)await cloudOperation(()=>cloudClient.storage.from(CLOUD_IMAGE_BUCKET).remove(stale.slice(index,index+100)),'清理无主图片');
  return stale.length;
}

async function downloadCloudImages(images){
  let existing=new Set(await allNoteImageIds()),missing=[];
  let pending=(images||[]).filter(meta=>!existing.has(meta.id)),cursor=0,completed=0;
  let firstError=null,stopped=false;
  async function worker(){while(!stopped&&cursor<pending.length){let meta=pending[cursor++];try{let {data}=await cloudOperation(()=>cloudClient.storage.from(CLOUD_IMAGE_BUCKET).download(`${cloudUser.id}/${meta.id}`),`图片 ${meta.name||meta.id} 下载`,{timeout:CLOUD_IMAGE_REQUEST_TIMEOUT,retries:1});if(!data)throw new Error(`图片 ${meta.name||meta.id} 下载失败`);missing.push({...meta,blob:data});completed++;cloudStatus(`正在下载图片 ${completed}/${pending.length}…`)}catch(error){firstError=firstError||error;stopped=true}}}
  await Promise.all(Array.from({length:Math.min(CLOUD_IMAGE_CONCURRENCY,pending.length)},()=>worker()));
  if(firstError)throw firstError;
  if(missing.length)await restoreNoteImages(missing);
  return missing.length;
}

async function pullCloudData(){
  let localBefore=cloudLocalSignature();
  let {data}=await cloudOperation(()=>cloudClient.from('phd_sync_data').select('payload').eq('user_id',cloudUser.id).maybeSingle(),'检查云端更新');
  if(!data?.payload){cloudRemoteImageIds.clear();cloudRemoteImageTypes.clear();cloudRemotePayload=null;return {found:false,changed:false}}
  let remote=data.payload,deleted=saveCloudDeletions(keepRestoredItems([...cloudDeletions(),...(remote.deleted||[])]));
  cloudRemotePayload=remote;
  cloudRemoteImageIds=new Set((remote.images||[]).map(image=>image.id));
  cloudRemoteImageTypes=new Map((remote.images||[]).map(image=>[image.id,image.type]));
  records=mergeCloudList(records,remote.records||[],'date');
  notes=mergeCloudList(notes,remote.notes||[],'id');
  diaries=mergeCloudList(diaries,remote.diaries||[],'date');
  if(remote.plans)window.mergeInsightPlansFromCloud?.(remote.plans);
  await applyCloudDeletions(deleted);
  localStorage.setItem('phd-review-records',JSON.stringify(records));
  localStorage.setItem('phd-quick-notes',JSON.stringify(notes));
  localStorage.setItem('phd-diary-records',JSON.stringify(diaries));
  refreshCloudDeleteWatch();
  let deletedIds=deletionSet(deleted);
  let downloadedImages=await downloadCloudImages((remote.images||[]).filter(image=>!deletedIds.has(`note:${image.noteId}`)&&!deletedIds.has(`diary:${image.noteId}`)));
  let active=$('.page.active')?.id;if(active&&!window.goalSortingActive)page(active);
  return {found:true,changed:localBefore!==cloudLocalSignature()||downloadedImages>0,downloadedImages};
}

async function pushCloudData(cleanOrphans=false){
  let allLocalImageIds=await allNoteImageIds(),skipped=cloudSkippedImages();
  skipped=saveCloudSkippedImages([...skipped].filter(id=>allLocalImageIds.includes(id)));
  let localImageIds=allLocalImageIds.filter(id=>!skipped.has(id)),pendingIds=localImageIds.filter(id=>!cloudRemoteImageIds.has(id)),images=await noteImagesByIds(pendingIds);
  if(images.length!==pendingIds.length)throw new Error('本机图片索引不完整，请重新打开应用后再同步');
  let removedImages=await removeDeletedCloudImages();
  let {cloudImageTypes,uploadedBytes}=await uploadCloudImages(images);
  let remoteImages=new Map((cloudRemotePayload?.images||[]).map(image=>[image.id,image])),newImages=new Map(images.map(image=>[image.id,image]));
  let imageManifest=localImageIds.map(id=>{let source=newImages.get(id)||remoteImages.get(id);if(!source)throw new Error(`图片 ${id} 的同步信息缺失`);return {id,noteId:source.noteId,name:source.name,type:cloudImageTypes.get(id)||cloudRemoteImageTypes.get(id)||source.type||source.blob?.type||'image/jpeg'}});
  let payload=cloudSnapshot(imageManifest,skipped);
  let payloadChanged=!cloudPayloadEqual(payload,cloudRemotePayload),payloadBytes=0,removedOrphans=0;
  if(payloadChanged){cloudStatus(uploadedBytes?'正在保存记录…':'正在同步文字记录…');await cloudOperation(()=>cloudClient.from('phd_sync_data').upsert({user_id:cloudUser.id,payload,updated_at:new Date().toISOString()}),'保存同步记录');payloadBytes=new Blob([JSON.stringify(payload)]).size;cloudRemotePayload=payload;cloudRemoteImageIds=new Set(imageManifest.map(image=>image.id));cloudRemoteImageTypes=new Map(imageManifest.map(image=>[image.id,image.type]))}
  if(cleanOrphans){cloudStatus('正在整理云端图片…');removedOrphans=await removeOrphanCloudImages(localImageIds.map(id=>({id})));localStorage.setItem(CLOUD_CLEANUP_LAST_KEY,String(Date.now()))}
  return {bytes:uploadedBytes+payloadBytes,changed:payloadChanged||uploadedBytes>0||removedImages>0||removedOrphans>0};
}

async function syncCloud(pullFirst=false,queueIfBusy=false){
  if(!cloudClient||!cloudUser)return;
  if(cloudSyncing){if(queueIfBusy){cloudSyncQueued=true;cloudQueuedPullFirst=cloudQueuedPullFirst||pullFirst;cloudStatus('当前同步结束后将继续保存新修改…')}return}
  cloudSyncing=true;setCloudProblem(null);cloudStatus('正在同步…');cloudTransferSize(null);
  try{let restored=cloudRestorePending(),pulled={changed:false};if(pullFirst){cloudStatus('正在检查云端更新…');pulled=await pullCloudData()}let pushed=await pushCloudData(cloudCleanupDue());if(restored){localStorage.removeItem(CLOUD_RESTORE_PENDING_KEY);refreshCloudDeleteWatch()}cloudTransferSize(pushed.bytes);cloudStatus(pulled.changed||pushed.changed?`已同步：${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`:'数据已是最新')}catch(error){setCloudProblem(error.cloudImage);cloudStatus(`同步失败：${error.message}`)}finally{cloudSyncing=false;if(cloudSyncQueued){let nextPull=cloudQueuedPullFirst;cloudSyncQueued=false;cloudQueuedPullFirst=false;setTimeout(()=>syncCloud(nextPull),0)}}
}

window.scheduleCloudSync=()=>{
  watchCloudDeletes();
  if(!cloudClient||!cloudUser)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncCloud(true,true),1200);
};

ensureCloudSettings();
renderCloudSettings();
function startCloudClient(){let savedCloud=cloudConfig();if(savedCloud.url&&savedCloud.key&&window.supabase&&!cloudClient)connectCloud();}
if(window.supabase)startCloudClient();
window.addEventListener('phd-supabase-ready',startCloudClient);
async function restoreDesktopSyncSettings(){try{let saved=await window.phdDesktop?.loadSyncSettings?.();if(!saved)return;if(saved.email)localStorage.setItem(CLOUD_EMAIL_KEY,saved.email);if(saved.imageMode)localStorage.setItem(CLOUD_IMAGE_MODE_KEY,saved.imageMode);renderCloudSettings();if(!cloudClient)connectCloud()}catch{}}
restoreDesktopSyncSettings();
window.addEventListener('online',()=>syncCloud(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncCloud(true)});
setInterval(()=>syncCloud(true),300000);

// iOS Safari can occasionally discard Local Storage while keeping IndexedDB.
// Keep a second, local-only copy of the non-sensitive sync settings so that
// reopening the web app does not require entering the project settings again.
const CLOUD_WEB_SETTINGS_DB='phd-daily-review-settings',CLOUD_WEB_SETTINGS_STORE='settings',CLOUD_WEB_SETTINGS_ID='cloud-sync';
function openCloudWebSettings(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return resolve(null);let request=indexedDB.open(CLOUD_WEB_SETTINGS_DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(CLOUD_WEB_SETTINGS_STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function saveCloudWebSettings(){try{let db=await openCloudWebSettings();if(!db)return;let value={id:CLOUD_WEB_SETTINGS_ID,config:cloudConfig(),email:$('#cloudEmail')?.value.trim()||localStorage.getItem(CLOUD_EMAIL_KEY)||'',imageMode:$('#cloudImageMode')?.value||cloudImageMode()};await new Promise((resolve,reject)=>{let request=db.transaction(CLOUD_WEB_SETTINGS_STORE,'readwrite').objectStore(CLOUD_WEB_SETTINGS_STORE).put(value);request.onsuccess=resolve;request.onerror=()=>reject(request.error)});db.close()}catch{}}
async function restoreCloudWebSettings(){try{let db=await openCloudWebSettings();if(!db)return;let saved=await new Promise((resolve,reject)=>{let request=db.transaction(CLOUD_WEB_SETTINGS_STORE,'readonly').objectStore(CLOUD_WEB_SETTINGS_STORE).get(CLOUD_WEB_SETTINGS_ID);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});db.close();if(!saved)return;if(!localStorage.getItem(CLOUD_EMAIL_KEY)&&saved.email)localStorage.setItem(CLOUD_EMAIL_KEY,saved.email);if(!localStorage.getItem(CLOUD_IMAGE_MODE_KEY)&&saved.imageMode)localStorage.setItem(CLOUD_IMAGE_MODE_KEY,saved.imageMode);renderCloudSettings();if(!cloudClient)connectCloud()}catch{}}
let cloudSettingsSaveTimer=null;
document.addEventListener('input',event=>{if(!event.target.matches('#cloudEmail'))return;clearTimeout(cloudSettingsSaveTimer);cloudSettingsSaveTimer=setTimeout(saveCloudWebSettings,300)});
document.addEventListener('change',event=>{if(event.target.matches('#cloudImageMode'))saveCloudWebSettings()});
window.addEventListener('pagehide',saveCloudWebSettings);
saveCloudWebSettings();
restoreCloudWebSettings();
// Let iPhone's system password manager offer the saved credential securely.
$('#cloudEmail').autocomplete='email';
$('#cloudEmail').name='cloud-email';
$('#cloudPassword').autocomplete='current-password';
$('#cloudPassword').name='cloud-password';
