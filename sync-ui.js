const CLOUD_CONFIG_KEY='phd-cloud-config',CLOUD_IMAGE_BUCKET='phd-note-images';
let cloudClient=null,cloudUser=null,cloudTimer=null,cloudSyncing=false;

function cloudConfig(){try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||'{}')}catch{return {}}}
function cloudStatus(text){let target=$('#cloudStatus');if(target)target.textContent=text}
function cloudHasContent(){return records.length||notes.length||diaries.length}
function cloudStamp(item){return new Date(item?.updatedAt||item?.createdAt||0).getTime()||0}
function mergeCloudList(local,remote,key){let output=new Map(local.map(item=>[item[key],item]));for(let item of remote||[]){let existing=output.get(item[key]);if(!existing||cloudStamp(item)>=cloudStamp(existing))output.set(item[key],item)}return [...output.values()]}

function renderCloudSettings(){
  let config=cloudConfig(),connected=!!cloudUser;
  $('#cloudUrl').value=config.url||'';
  $('#cloudKey').value=config.key||'';
  $('#cloudEmail').value=cloudUser?.email||'';
  $('#cloudEmail').disabled=connected;
  $('#cloudPassword').disabled=connected;
  $('#cloudPasswordLogin').hidden=connected;
  $('#cloudRegister').hidden=connected;
  $('#cloudLogin').hidden=connected;
  $('#cloudSyncNow').hidden=!connected;
  $('#cloudSignOut').hidden=!connected;
  $('#cloudStatus').textContent=connected?`已登录 ${cloudUser.email}，记录会自动同步。`:config.url?'请填写邮箱并发送登录链接。':'请先填写 Supabase 项目地址和匿名密钥。';
}

function ensureCloudSettings(){
  if($('#cloudSettings'))return;
  let section=document.createElement('article');
  section.id='cloudSettings';
  section.innerHTML='<h2>多端自动同步</h2><p>使用同一账号登录后，iPhone 网页版与 Windows 桌面版会自动同步复盘、随手记、日记和图片。</p><input id="cloudUrl" type="url" placeholder="Supabase Project URL"><input id="cloudKey" type="password" placeholder="Supabase anon public key"><button id="cloudConnect" type="button">保存云端配置</button><input id="cloudEmail" type="email" placeholder="登录邮箱"><input id="cloudPassword" type="password" placeholder="密码（Windows 与 iPhone 使用同一密码）"><button id="cloudPasswordLogin" type="button">邮箱密码登录</button><button id="cloudRegister" class="plain" type="button">首次注册账号</button><button id="cloudLogin" class="plain" type="button">或发送登录链接</button><button id="cloudSyncNow" type="button">立即同步</button><button id="cloudSignOut" class="plain" type="button">退出登录</button><p id="cloudStatus" class="status"></p>';
  $('#preferences').prepend(section);
  $('#cloudConnect').onclick=connectCloud;
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
  cloudClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  cloudClient.auth.onAuthStateChange((_event,session)=>{cloudUser=session?.user||null;renderCloudSettings();if(cloudUser)syncCloud(true)});
  let {data:{session}}=await cloudClient.auth.getSession();cloudUser=session?.user||null;
  renderCloudSettings();
}

async function sendCloudLogin(){
  if(!cloudClient)return cloudStatus('请先保存云端配置。');
  let email=$('#cloudEmail').value.trim();if(!email)return cloudStatus('请输入登录邮箱。');
  cloudStatus('正在发送登录链接…');
  let {error}=await cloudClient.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split('#')[0]}});
  cloudStatus(error?`发送失败：${error.message}`:'登录链接已发送，请在此设备的邮箱中打开链接。');
}

async function passwordCloudLogin(register){
  if(!cloudClient)return cloudStatus('请先保存云端配置。');
  let email=$('#cloudEmail').value.trim(),password=$('#cloudPassword').value;
  if(!email||password.length<6)return cloudStatus('请输入邮箱和至少 6 位的密码。');
  cloudStatus(register?'正在注册…':'正在登录…');
  let result=register?await cloudClient.auth.signUp({email,password,options:{emailRedirectTo:location.href.split('#')[0]}}):await cloudClient.auth.signInWithPassword({email,password});
  if(result.error)return cloudStatus(`${register?'注册':'登录'}失败：${result.error.message}`);
  if(register&&!result.data.session)cloudStatus('注册成功，请在邮箱中完成验证后，再回来点击“邮箱密码登录”。');
}

async function signOutCloud(){
  if(cloudClient)await cloudClient.auth.signOut();
  cloudUser=null;renderCloudSettings();cloudStatus('已退出登录。本机记录仍会保留。');
}

async function cloudSnapshot(){
  let images=await allNoteImages();
  return {version:1,records,notes,diaries,images:images.map(({id,noteId,name,type})=>({id,noteId,name,type}))};
}

async function uploadCloudImages(images){
  for(let image of images){
    let path=`${cloudUser.id}/${image.id}`;
    let {error}=await cloudClient.storage.from(CLOUD_IMAGE_BUCKET).upload(path,image.blob,{upsert:true,contentType:image.type||'image/jpeg'});
    if(error)throw error;
  }
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
  await uploadCloudImages(images);
  let payload=await cloudSnapshot();
  let {error}=await cloudClient.from('phd_sync_data').upsert({user_id:cloudUser.id,payload,updated_at:new Date().toISOString()});
  if(error)throw error;
}

async function syncCloud(pullFirst=false){
  if(!cloudClient||!cloudUser||cloudSyncing)return;
  cloudSyncing=true;cloudStatus('正在同步…');
  try{if(pullFirst)await pullCloudData();await pushCloudData();cloudStatus(`已同步：${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`)}catch(error){cloudStatus(`同步失败：${error.message}`)}finally{cloudSyncing=false}
}

window.scheduleCloudSync=()=>{
  if(!cloudClient||!cloudUser)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncCloud(false),1200);
};

ensureCloudSettings();
let savedCloud=cloudConfig();
if(savedCloud.url&&savedCloud.key)connectCloud();else renderCloudSettings();
window.addEventListener('online',()=>syncCloud(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncCloud(true)});
setInterval(()=>syncCloud(true),300000);
