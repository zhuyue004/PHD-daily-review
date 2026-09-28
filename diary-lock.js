// Windows-only diary privacy gate. This hides the UI; it does not encrypt backups or cloud data.
(()=>{
  if(!window.phdDesktop)return;
  const KEY='riji-desktop-diary-lock-v1';
  const ITERATIONS=210000;
  let unlocked=false,returnTo='home',pending=null;
  const overlay=document.createElement('div');overlay.id='desktopDiaryLock';overlay.hidden=true;
  overlay.innerHTML='<div class="diary-lock-card" role="dialog" aria-modal="true" aria-labelledby="diaryLockTitle"><h2 id="diaryLockTitle"></h2><p id="diaryLockHint"></p><form id="diaryLockForm"></form><p class="diary-lock-error" id="diaryLockError" role="alert"></p><div class="diary-lock-actions" id="diaryLockActions"></div></div>';
  document.body.append(overlay);
  const $lock=id=>overlay.querySelector('#'+id);
  const config=()=>{try{const value=JSON.parse(localStorage.getItem(KEY));return value?.password?.salt&&value?.recovery?.salt?value:null}catch{return null}};
  const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
  const hex=array=>Array.from(array,x=>x.toString(16).padStart(2,'0')).join('');
  const normalizedCode=value=>String(value||'').replace(/[^a-fA-F0-9]/g,'').toLowerCase();
  async function digest(value,salt){
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(value),'PBKDF2',false,['deriveBits']);
    return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g).map(x=>parseInt(x,16))),iterations:ITERATIONS,hash:'SHA-256'},key,256)));
  }
  async function credential(value){const salt=hex(bytes(16));return {salt,hash:await digest(value,salt)}}
  async function matches(value,entry){const actual=await digest(value,entry.salt);let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^entry.hash.charCodeAt(i);return diff===0}
  function error(message){$lock('diaryLockError').textContent=message}
  function action(label,handler,kind=''){const button=document.createElement('button');button.type='button';button.textContent=label;if(kind)button.className=kind;button.onclick=handler;$lock('diaryLockActions').append(button)}
  function form(title,hint,fields,submit){
    $lock('diaryLockTitle').textContent=title;$lock('diaryLockHint').textContent=hint;error('');
    $lock('diaryLockForm').innerHTML=fields.map(([id,label,type,autocomplete])=>`<label for="${id}">${label}</label><input id="${id}" type="${type}" autocomplete="${autocomplete||'off'}" required>`).join('');
    $lock('diaryLockActions').replaceChildren();
    $lock('diaryLockForm').onsubmit=event=>{event.preventDefault();submit()};
    overlay.hidden=false;document.body.classList.add('diary-lock-open');
    requestAnimationFrame(()=>$lock(fields[0][0])?.focus());
  }
  function back(){overlay.hidden=true;document.body.classList.remove('diary-lock-open');pending=null;previousPage(returnTo)}
  async function showRecoveryCode(password){
    try{
      const code=hex(bytes(16)).toUpperCase().match(/.{1,4}/g).join('-');
      pending={password:await credential(password),recovery:await credential(normalizedCode(code))};
      form('保存恢复码','忘记密码时只能用此恢复码重设。请先抄写并妥善保管；它不会上传云端。',[],()=>{});
      $lock('diaryLockForm').innerHTML=`<div class="diary-lock-code" id="diaryRecoveryCode">${code}</div><label class="diary-lock-check"><input id="diaryCodeSaved" type="checkbox">我已保存恢复码</label>`;
      action('完成并进入日记',()=>{if(!$lock('diaryCodeSaved').checked){error('请先保存恢复码并勾选确认。');return}localStorage.setItem(KEY,JSON.stringify(pending));pending=null;unlock()});
      action('返回',back,'secondary');
    }catch{error('无法建立安全密码，请确认系统支持安全加密。')}
  }
  function showSetup(){
    form('设置日记密码','首次使用请设置独立的本机密码，至少 6 位。此密码与云端同步密码无关。',[["diaryNewPassword","新密码","password","new-password"],["diaryConfirmPassword","确认密码","password","new-password"]],()=>{
      const first=$lock('diaryNewPassword').value,second=$lock('diaryConfirmPassword').value;
      if(first.length<6)return error('密码至少需要 6 位。');if(first!==second)return error('两次输入的密码不一致。');showRecoveryCode(first);
    });
    action('下一步',()=>$lock('diaryLockForm').requestSubmit());action('返回',back,'secondary');
  }
  function showUnlock(){
    form('解锁日记','请输入这台电脑的日记密码。',[["diaryPassword","日记密码","password","current-password"]],async()=>{
      const password=$lock('diaryPassword').value;try{if(await matches(password,config().password))unlock();else error('密码不正确。')}catch{error('无法验证密码，请稍后重试。')}
    });
    action('解锁',()=>$lock('diaryLockForm').requestSubmit());action('返回',back,'secondary');action('忘记密码',showForgot,'link');
  }
  function showForgot(){
    form('重设日记密码','输入首次设置时保存的恢复码，再设置新密码。',[["diaryRecoveryInput","恢复码","text"],["diaryNewPassword","新密码（至少 6 位）","password","new-password"],["diaryConfirmPassword","确认新密码","password","new-password"]],async()=>{
      const code=normalizedCode($lock('diaryRecoveryInput').value),first=$lock('diaryNewPassword').value,second=$lock('diaryConfirmPassword').value;
      if(first.length<6)return error('新密码至少需要 6 位。');if(first!==second)return error('两次输入的密码不一致。');
      try{if(!await matches(code,config().recovery))return error('恢复码不正确。');await showRecoveryCode(first)}catch{error('无法验证恢复码，请稍后重试。')}
    });
    action('重设密码',()=>$lock('diaryLockForm').requestSubmit());action('返回解锁',showUnlock,'secondary');
    action('恢复码也丢失？',()=>error('恢复码和密码都丢失时无法验证身份。请先导出完整备份，再联系维护者处理本机锁定。'),'link');
  }
  function unlock(){unlocked=true;overlay.hidden=true;document.body.classList.remove('diary-lock-open');document.querySelector('#diaryPassword')?.blur();}
  const previousPage=page;
  page=function(id){
    if(id==='diary'&&!unlocked){
      const current=document.querySelector('.page.active')?.id;
      if(current&&current!=='diary')returnTo=current;
      document.body.classList.add('diary-lock-open');previousPage(id);config()?showUnlock():showSetup();return;
    }
    if(id!=='diary'){unlocked=false;overlay.hidden=true;document.body.classList.remove('diary-lock-open')}
    previousPage(id);
  };
  // Archive diary previews are otherwise a direct way around the tab gate.
  const previousArchive=archive;
  archive=function(){previousArchive();if(unlocked)return;document.querySelectorAll('.archive-note[data-diary-id]').forEach(card=>{
    const time=card.querySelector('time')?.textContent||'日记';card.replaceChildren();const date=document.createElement('time');date.textContent=time;
    const message=document.createElement('span');message.textContent='日记已锁定 · 点击解锁查看';card.append(date,message);card.onclick=()=>page('diary');
  })};
  document.querySelector('#search').oninput=()=>archive();
  document.addEventListener('contextmenu',event=>{if(!unlocked&&event.target.closest('.archive-note[data-diary-id]')){event.preventDefault();event.stopImmediatePropagation();page('diary')}},true);
  window.desktopDiaryLock={isUnlocked:()=>unlocked};
})();
