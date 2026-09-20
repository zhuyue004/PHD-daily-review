let observations=JSON.parse(localStorage.getItem('phd-observation-records')||'[]');
const observationDraftKey='phd-observation-drafts';
let observationEditingId=null,observationDraftTimer=null,observationStatusTimer=null,observationFilterDate=null,observationPickerMonth=new Date(),observationEditPlace='';
const saveObservations=()=>{localStorage.setItem('phd-observation-records',JSON.stringify(observations));if($('#diary').classList.contains('observation-mode'))updateObservationHeader();window.scheduleCloudSync?.()};
const observationDrafts=()=>{try{return JSON.parse(localStorage.getItem(observationDraftKey)||'{}')}catch{return {}}};
const observationWords=text=>[...(text||'').replace(/\s/g,'')].length;
const observationEditorKey=()=>observationEditingId||'new';
const observationEsc=text=>esc(String(text||''));
const observationParagraphs=text=>String(text||'').split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${observationEsc(line.trim().replace(/^　　/,''))}</p>`).join('');
function observationComparison(entry){
  const original=typeof entry.originalText==='string'?entry.originalText:null;
  return {title:entry.title||'',date:entry.date||'',originalText:original,originalSource:entry.originalSource||'',analysis:entry.analysis||'',text:entry.text||''};
}
function openObservationComparison(entry){
  if(!entry)return;
  const data=observationComparison(entry),overlay=document.createElement('div');
  overlay.className='observation-compare-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','观察练习对比');
  overlay.innerHTML='<div class="observation-compare-sheet"><header><div><small>观察练习对比</small><h2></h2></div><button type="button" class="observation-compare-close" aria-label="关闭对比">×</button></header><section class="observation-compare-column"><h3>修改前</h3><small class="observation-original-note"></small><div class="observation-compare-text"></div></section><section class="observation-compare-column"><h3>分析</h3><div class="observation-compare-text"></div></section><section class="observation-compare-column"><h3>修改后</h3><div class="observation-compare-text"></div></section></div>';
  overlay.querySelector('h2').textContent=data.title;
  overlay.querySelector('.observation-original-note').textContent=data.originalSource==='legacy-baseline'?'旧记录：从首次再次编辑前的版本开始保留':data.originalText===null?'旧记录未留存首次原文':'';
  const columns=overlay.querySelectorAll('.observation-compare-text');
  columns[0].textContent=data.originalText??'旧记录未留存首次原文';columns[1].textContent=data.analysis||'尚未填写分析';columns[2].textContent=data.text;
  const close=()=>overlay.remove();overlay.querySelector('.observation-compare-close').onclick=close;overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  document.body.append(overlay);
}
function setObservationAnalysisOpen(open){
  $('#observationAnalysisPanel').hidden=!open;
  $('#toggleObservationAnalysis').setAttribute('aria-expanded',String(open));
  $('#toggleObservationAnalysis').classList.toggle('active',open);
}

function showObservationDraftStatus(message,settled=false){
  const target=$('#observationDraftStatus');if(!target)return;
  clearTimeout(observationStatusTimer);target.textContent=message;target.classList.toggle('settled',settled);
  if(settled)observationStatusTimer=setTimeout(()=>target.textContent='',1800);
}
function saveObservationDraftNow(){
  clearTimeout(observationDraftTimer);
  const drafts=observationDrafts(),key=observationEditorKey();
  const entry=observations.find(item=>item.id===observationEditingId);
  drafts[key]={date:entry?.date||day(),title:$('#observationTitle').value,text:$('#observationText').value,analysis:$('#observationAnalysis').value,place:observationEditPlace||entry?.place||'',updatedAt:new Date().toISOString()};
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
  const key=observationEditorKey(),draft=observationDrafts()[key];
  const useDraft=draft&&(!entry||Date.parse(draft.updatedAt)>Date.parse(entry.updatedAt||0));
  const source=useDraft?draft:entry||{};
  observationEditPlace=source.place||entry?.place||'';
  $('#observationEditPlaceStatus').textContent=observationEditPlace?`记录地点：${observationEditPlace}`:'尚未记录地点；保存时会尝试定位。';
  $('#observationTitle').value=source.title||'';
  $('#observationText').value=source.text||'';
  $('#observationAnalysis').value=source.analysis||'';
  setObservationAnalysisOpen(Boolean(source.analysis?.trim()));
  $('#saveObservation').textContent='保存';
  $('#observationWordCount').textContent=`已写 ${observationWords(source.text)} 字`;
  $('#observationDraftStatus').textContent='';
  if(entry)$('#observationEditor').scrollIntoView({block:'start',behavior:'smooth'});
}
function renderObservations(){
  const list=$('#observationList');if(!list)return;
  const sorted=observations.filter(item=>!observationFilterDate||item.date===observationFilterDate).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
  $('#observationDateButton').textContent=observationFilterDate?fmt(observationFilterDate):'选择日期';
  $('#observationShowAll').hidden=!observationFilterDate;
  let lastDate='';
  list.innerHTML=sorted.length?sorted.map(entry=>{
    const heading=entry.date===lastDate?'':`<h3 class="observation-date-heading">${observationEsc(fmt(entry.date))}</h3>`;
    lastDate=entry.date;
    const analysis=entry.analysis?.trim()?'<span class="observation-analysis-badge">已有分析</span>':'';
    return `${heading}<div class="swipe-row observation-swipe" data-observation-id="${observationEsc(entry.id)}"><div class="diary-row-actions"><button type="button" class="edit-record observation-edit" aria-label="编辑观察练习">编辑</button><button type="button" class="delete-record observation-delete" aria-label="删除观察练习">删除</button></div><article class="observation-item" role="button" tabindex="0" aria-label="查看${observationEsc(entry.title)}的修改对比"><h3>${observationEsc(entry.title)}</h3>${analysis}</article></div>`;
  }).join(''):observationFilterDate?'<p class="empty">这一天还没有观察练习。</p>':'<p class="empty">还没有观察练习。今天有什么值得仔细看的细节？</p>';
  $$('.observation-swipe').forEach(row=>{
    const card=row.querySelector('.observation-item');
    const id=row.dataset.observationId;
    row.onclick=event=>{if(event.target.closest('.diary-row-actions')||Date.now()-Number(row.dataset.swipeAt||0)<400)return;openObservationComparison(observations.find(item=>item.id===id))};
    card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click()}};
    row.querySelector('.observation-edit').onclick=event=>{event.stopPropagation();saveObservationDraftNow();openObservationEditor(observations.find(item=>item.id===id))};
    row.querySelector('.observation-delete').onclick=async event=>{
      event.stopPropagation();
      if(!await confirmFourDigitDelete('观察练习'))return;
      observations=observations.filter(item=>item.id!==id);saveObservations();clearObservationDraft(id);
      if(observationEditingId===id)openObservationEditor();renderObservations();
    };
    let start=null,delta=0,moved=0;
    row.addEventListener('pointerdown',event=>{if(event.target.closest('.diary-row-actions'))return;start=event.clientX;delta=0;moved=0;row.setPointerCapture?.(event.pointerId)});
    row.addEventListener('pointermove',event=>{if(start===null)return;moved=event.clientX-start;delta=Math.min(0,Math.max(-168,moved));if(delta<0)card.style.transform=`translateX(${delta}px)`});
    row.addEventListener('pointerup',event=>{if(start===null)return;card.style.transform='';if(Math.abs(moved)>12)row.dataset.swipeAt=Date.now();if(delta<-42)row.classList.add('swiped');else if(moved>42||Math.abs(moved)<12)row.classList.remove('swiped');start=null});
    row.addEventListener('pointercancel',()=>{card.style.transform='';start=null});
  });
}
function updateObservationHeader(){
  $('header h1').textContent='观察练习';
  updateHeaderStat('diary');
  $('#headerStat').textContent=`累计 ${observations.reduce((total,item)=>total+observationWords(item.text),0).toLocaleString('zh-CN')} 字`;
}
function renderObservationCalendar(){
  const panel=$('#observationCalendar'),year=observationPickerMonth.getFullYear(),month=observationPickerMonth.getMonth(),offset=(new Date(year,month,1).getDay()+6)%7,total=new Date(year,month+1,0).getDate(),recordedDates=new Set(observations.map(item=>item.date)),cells=[];
  for(let index=0;index<offset;index++)cells.push('<button class="blank" disabled></button>');
  for(let date=1;date<=total;date++){const value=localDay(new Date(year,month,date));cells.push(`<button class="${recordedDates.has(value)?'has-diary':''}" data-observation-date="${value}" type="button">${date}</button>`)}
  panel.innerHTML=`<div class="calendar-head"><button id="observationPrevMonth" type="button">‹</button><b>${year} 年 ${month+1} 月</b><button id="observationNextMonth" type="button">›</button></div><div class="calendar-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-grid">${cells.join('')}</div><p class="calendar-legend"><i></i>有观察练习</p>`;
  $('#observationPrevMonth').onclick=()=>{observationPickerMonth=new Date(year,month-1,1);renderObservationCalendar()};
  $('#observationNextMonth').onclick=()=>{observationPickerMonth=new Date(year,month+1,1);renderObservationCalendar()};
  $$('[data-observation-date]').forEach(button=>button.onclick=()=>{observationFilterDate=button.dataset.observationDate;panel.classList.add('hidden');renderObservations();$('#observationList').scrollIntoView({block:'start',behavior:'smooth'})});
}
function showDiarySubview(mode){
  const observation=mode==='observation';
  $('#diary').classList.toggle('observation-mode',observation);
  $$('.diary-subview button').forEach(button=>{const active=button.dataset.diarySubview===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  if(observation){updateObservationHeader();renderObservations()}else{$('header h1').textContent='日记';updateHeaderStat('diary');bindDiaryReadMore()}
}

const diaryQuote=$('#diary .quote-card');
const observationTabs=document.createElement('div');observationTabs.className='diary-subview';observationTabs.setAttribute('role','tablist');
observationTabs.innerHTML='<button type="button" data-diary-subview="diary" role="tab" aria-selected="true">日记</button><button type="button" data-diary-subview="observation" role="tab" aria-selected="false">观察练习</button>';
const observationPane=document.createElement('section');observationPane.id='observationPane';
observationPane.innerHTML='<article id="observationEditor" class="observation-editor"><input id="observationTitle" class="observation-title" type="text" maxlength="80" aria-label="观察标题" placeholder="给这篇观察起个标题"><textarea id="observationText" aria-label="观察正文" placeholder="留意一个人、一种动作、一处声音或一个瞬间……"></textarea><div class="observation-editor-actions"><button id="saveObservation" type="button">保存</button><button id="toggleObservationAnalysis" type="button" aria-controls="observationAnalysisPanel" aria-expanded="false">分析</button><div class="observation-editor-meta"><span id="observationWordCount">已写 0 字</span><span id="observationDraftStatus" class="local-draft-status"></span></div></div><div id="observationAnalysisPanel" class="observation-analysis-panel" hidden><label for="observationAnalysis">分析</label><textarea id="observationAnalysis" aria-label="观察分析" placeholder="这件事让我想到什么？还有哪些疑问或值得继续观察的地方？"></textarea></div></article><section id="observationHistory" class="diary-history"><div class="archive-date-control"><span>按日期查看</span><button id="observationDateButton" class="plain" type="button">选择日期</button></div><div id="observationCalendar" class="archive-calendar diary-calendar hidden"></div><button id="observationShowAll" type="button" class="plain" hidden>查看全部观察记录</button></section><h2 class="observation-list-heading">观察记录</h2><div id="observationList"></div>';
const observationEditPlaceRow=document.createElement('div');observationEditPlaceRow.className='observation-edit-place';observationEditPlaceRow.innerHTML='<p id="observationEditPlaceStatus" class="status"></p><button id="refreshObservationPlace" class="plain" type="button">更新为当前位置</button>';observationPane.querySelector('#observationAnalysisPanel').after(observationEditPlaceRow);
diaryQuote.after(observationTabs,observationPane);
openObservationEditor();
$$('.diary-subview button').forEach(button=>button.onclick=()=>showDiarySubview(button.dataset.diarySubview));
$('#observationDateButton').onclick=()=>{const panel=$('#observationCalendar');panel.classList.toggle('hidden');if(!panel.classList.contains('hidden')){observationPickerMonth=observationFilterDate?new Date(`${observationFilterDate}T12:00:00`):new Date();renderObservationCalendar()}};
$('#observationShowAll').onclick=()=>{observationFilterDate=null;renderObservations()};
$$('#observationEditor input,#observationEditor textarea').forEach(input=>input.addEventListener('input',queueObservationDraft));
$('#toggleObservationAnalysis').onclick=()=>{const open=$('#observationAnalysisPanel').hidden;setObservationAnalysisOpen(open);if(open)$('#observationAnalysis').focus()};
$('#refreshObservationPlace').onclick=async()=>{let button=$('#refreshObservationPlace');button.disabled=true;$('#observationEditPlaceStatus').textContent='正在获取当前位置…';let location=await diaryPlaceResult();button.disabled=false;if(location.place)observationEditPlace=location.place;$('#observationEditPlaceStatus').textContent=location.place?`记录地点：${observationEditPlace}`:`未能更新地点：${location.reason}`;queueObservationDraft()};
$('#saveObservation').onclick=async()=>{
  const title=$('#observationTitle').value.trim(),text=$('#observationText').value.trim(),analysis=$('#observationAnalysis').value.trim();
  if(!title)return $('#observationTitle').focus();
  if(!text)return $('#observationText').focus();
  const old=observations.find(item=>item.id===observationEditingId),button=$('#saveObservation');
  button.disabled=true;
  button.textContent='正在记录地点…';
  const location=observationEditPlace?{place:observationEditPlace,reason:''}:await diaryPlaceResult(),place=location.place||old?.place||'',date=old?.date||day();
  const now=new Date().toISOString();
  const entry={...old,id:old?.id||crypto.randomUUID(),date,title,text,analysis,place,createdAt:old?.createdAt||now,updatedAt:now,originalText:old?(typeof old.originalText==='string'?old.originalText:old.text):text,originalSource:old?(old.originalSource||'legacy-baseline'):'first-save'};
  if(old)observations[observations.findIndex(item=>item.id===old.id)]=entry;else observations.push(entry);
  if(!old)observationFilterDate=null;
  saveObservations();clearObservationDraft();button.disabled=false;
  openObservationEditor();renderObservations();
  showObservationLocationStatus(place?`已保存 · ${place}`:`已保存，但未记录地点。${location.reason}`);
};
function showObservationLocationStatus(message){let status=$('#observationLocationStatus');if(!status){status=document.createElement('p');status.id='observationLocationStatus';status.className='status';$('#observationEditor').append(status)}status.textContent=message}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
window.addEventListener('pagehide',()=>{if($('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
const pageBeforeObservation=page;
page=id=>{pageBeforeObservation(id);if(id==='diary')showDiarySubview($('#diary').classList.contains('observation-mode')?'observation':'diary')};
