let observations=JSON.parse(localStorage.getItem('phd-observation-records')||'[]');
const observationDraftKey='phd-observation-drafts';
let observationEditingId=null,observationDraftTimer=null,observationStatusTimer=null;
const saveObservations=()=>localStorage.setItem('phd-observation-records',JSON.stringify(observations));
const observationDrafts=()=>{try{return JSON.parse(localStorage.getItem(observationDraftKey)||'{}')}catch{return {}}};
const observationWords=text=>[...(text||'').replace(/\s/g,'')].length;
const observationEditorKey=()=>observationEditingId||'new';
const observationEsc=text=>esc(String(text||''));

function showObservationDraftStatus(message,settled=false){
  const target=$('#observationDraftStatus');if(!target)return;
  clearTimeout(observationStatusTimer);target.textContent=message;target.classList.toggle('settled',settled);
  if(settled)observationStatusTimer=setTimeout(()=>target.textContent='',1800);
}
function saveObservationDraftNow(){
  clearTimeout(observationDraftTimer);
  const drafts=observationDrafts(),key=observationEditorKey();
  drafts[key]={date:$('#observationDate').value,title:$('#observationTitle').value,text:$('#observationText').value,place:$('#observationPlace').value,updatedAt:new Date().toISOString()};
  localStorage.setItem(observationDraftKey,JSON.stringify(drafts));showObservationDraftStatus('草稿已保存到本机',true);
}
function queueObservationDraft(){
  clearTimeout(observationDraftTimer);showObservationDraftStatus('正在自动保存本地…');
  observationDraftTimer=setTimeout(saveObservationDraftNow,350);
  $('#observationWordCount').textContent=`已写 ${observationWords($('#observationText').value)} 字`;
}
function clearObservationDraft(key=observationEditorKey()){
  clearTimeout(observationDraftTimer);const drafts=observationDrafts();delete drafts[key];localStorage.setItem(observationDraftKey,JSON.stringify(drafts));
}
function openObservationEditor(entry=null){
  observationEditingId=entry?.id||null;
  $('#observationDate').max=day();
  const key=observationEditorKey(),draft=observationDrafts()[key];
  const useDraft=draft&&(!entry||Date.parse(draft.updatedAt)>Date.parse(entry.updatedAt||0));
  const source=useDraft?draft:entry||{};
  $('#observationDate').value=source.date||day();
  $('#observationDateText').textContent=fmt(source.date||day());
  $('#observationTitle').value=source.title||'';
  $('#observationText').value=source.text||'';
  $('#observationPlace').value=source.place||'';
  $('#observationEditorHeading').textContent=entry?'编辑观察练习':'写一篇观察';
  $('#saveObservation').textContent=entry?'保存修改':'保存这篇观察';
  $('#observationWordCount').textContent=`已写 ${observationWords(source.text)} 字`;
  $('#observationDraftStatus').textContent='';
  if(entry)$('#observationEditor').scrollIntoView({block:'start',behavior:'smooth'});
}
function renderObservations(){
  const list=$('#observationList');if(!list)return;
  const sorted=[...observations].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
  let lastDate='';
  list.innerHTML=sorted.length?sorted.map(entry=>{
    const heading=entry.date===lastDate?'':`<h3 class="observation-date-heading">${observationEsc(fmt(entry.date))}</h3>`;
    lastDate=entry.date;
    const time=entry.createdAt?new Date(entry.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';
    const paragraphs=entry.text.split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${observationEsc(line.trim().replace(/^　　/,''))}</p>`).join('');
    return `${heading}<article class="observation-item" data-observation-id="${observationEsc(entry.id)}"><div class="observation-item-top"><time>${observationEsc(time)}</time><span>${observationWords(entry.text)} 字</span></div><h3>${observationEsc(entry.title)}</h3><div class="observation-item-text">${paragraphs}</div><button type="button" class="observation-more plain" hidden>全文</button>${entry.place?`<small class="observation-item-place">⌖ ${observationEsc(entry.place)}</small>`:''}<div class="observation-item-actions"><button type="button" class="observation-edit plain">编辑</button><button type="button" class="observation-delete plain">删除</button></div></article>`;
  }).join(''):'<p class="empty">还没有观察练习。今天有什么值得仔细看的细节？</p>';
  $$('.observation-item').forEach(card=>{
    const id=card.dataset.observationId,text=card.querySelector('.observation-item-text'),more=card.querySelector('.observation-more');
    if(text.scrollHeight>text.clientHeight+2){more.hidden=false;more.onclick=()=>{const expanded=card.classList.toggle('expanded');more.textContent=expanded?'收起':'全文'}}
    card.querySelector('.observation-edit').onclick=()=>{saveObservationDraftNow();openObservationEditor(observations.find(item=>item.id===id))};
    card.querySelector('.observation-delete').onclick=async()=>{
      if(!await confirmFourDigitDelete('观察练习'))return;
      observations=observations.filter(item=>item.id!==id);saveObservations();clearObservationDraft(id);
      if(observationEditingId===id)openObservationEditor();renderObservations();
    };
  });
}
function showDiarySubview(mode){
  const observation=mode==='observation';
  $('#diary').classList.toggle('observation-mode',observation);
  $$('.diary-subview button').forEach(button=>{const active=button.dataset.diarySubview===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  if(observation)renderObservations();
}

const diaryQuote=$('#diary .quote-card');
const observationTabs=document.createElement('div');observationTabs.className='diary-subview';observationTabs.setAttribute('role','tablist');
observationTabs.innerHTML='<button type="button" data-diary-subview="diary" role="tab" aria-selected="true">日记</button><button type="button" data-diary-subview="observation" role="tab" aria-selected="false">观察练习</button>';
const observationPane=document.createElement('section');observationPane.id='observationPane';
observationPane.innerHTML='<article id="observationEditor" class="observation-editor"><div class="observation-write-date"><span id="observationDateText"></span><label>记录日期<input id="observationDate" type="date"></label></div><div class="observation-editor-heading"><h2 id="observationEditorHeading">写一篇观察</h2><button id="newObservation" type="button" class="plain">新建一篇</button></div><input id="observationTitle" class="observation-title" type="text" maxlength="80" aria-label="观察标题" placeholder="给这个细节起个标题"><textarea id="observationText" aria-label="观察正文" placeholder="留意一个人、一种动作、一处声音或一个瞬间……"></textarea><div class="observation-editor-meta"><span id="observationDraftStatus" class="local-draft-status"></span><span id="observationWordCount">已写 0 字</span></div><div class="observation-place-row"><input id="observationPlace" type="text" aria-label="记录地点" placeholder="地点（可自动获取或手动填写）"><button id="locateObservation" type="button" class="plain">获取地点</button></div><button id="saveObservation" type="button">保存这篇观察</button><p class="observation-backup-notice">目前仅保存在本机；请定期导出完整备份包。云端同步将在桌面版兼容后启用。</p></article><h2 class="observation-list-heading">观察记录</h2><div id="observationList"></div>';
diaryQuote.after(observationTabs,observationPane);
$('#observationDate').max=day();
openObservationEditor();
$$('.diary-subview button').forEach(button=>button.onclick=()=>showDiarySubview(button.dataset.diarySubview));
$('#newObservation').onclick=()=>{
  if(!observationEditingId){
    if(($('#observationTitle').value.trim()||$('#observationText').value.trim())&&!confirm('当前这篇尚未保存，确定清空草稿并新建吗？'))return;
    clearObservationDraft('new');
  }else saveObservationDraftNow();
  openObservationEditor();$('#observationTitle').focus();
};
$$('#observationEditor input,#observationEditor textarea').forEach(input=>input.addEventListener('input',queueObservationDraft));
$('#observationDate').addEventListener('change',event=>{$('#observationDateText').textContent=fmt(event.target.value||day())});
$('#locateObservation').onclick=async()=>{const button=$('#locateObservation');button.disabled=true;button.textContent='正在定位…';const place=await diaryPlace();button.disabled=false;button.textContent='获取地点';if(place){$('#observationPlace').value=place;queueObservationDraft()}else showObservationDraftStatus('未能获取地点，可手动填写',true)};
$('#saveObservation').onclick=async()=>{
  const date=$('#observationDate').value,title=$('#observationTitle').value.trim(),text=$('#observationText').value.trim();
  if(!date)return $('#observationDate').focus();
  if(!title)return $('#observationTitle').focus();
  if(!text)return $('#observationText').focus();
  const old=observations.find(item=>item.id===observationEditingId),button=$('#saveObservation');
  button.disabled=true;
  let place=$('#observationPlace').value.trim();
  if(!place&&!old&&date===day()){button.textContent='正在记录地点…';place=await diaryPlace()||''}
  const now=new Date().toISOString();
  const entry={id:old?.id||crypto.randomUUID(),date,title,text,place,createdAt:old?.createdAt||now,updatedAt:now};
  if(old)observations[observations.findIndex(item=>item.id===old.id)]=entry;else observations.push(entry);
  saveObservations();clearObservationDraft();button.disabled=false;
  openObservationEditor();renderObservations();
  showObservationDraftStatus(place?'已保存这篇观察':'已保存；地点未获取，可之后编辑补充',true);
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
window.addEventListener('pagehide',()=>{if($('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
const pageBeforeObservation=page;
page=id=>{pageBeforeObservation(id);if(id==='diary')showDiarySubview($('#diary').classList.contains('observation-mode')?'observation':'diary')};
