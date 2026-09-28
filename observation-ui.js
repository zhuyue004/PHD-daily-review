let observations=JSON.parse(localStorage.getItem('phd-observation-records')||'[]');
const observationDraftKey='phd-observation-drafts';
let observationEditingId=null,observationDraftTimer=null,observationStatusTimer=null,observationFilterDate=null,observationPickerMonth=new Date();
const saveObservations=()=>{localStorage.setItem('phd-observation-records',JSON.stringify(observations));window.desktopDataChanged?.('observations');if($('#diary').classList.contains('observation-mode'))updateObservationHeader();window.scheduleCloudSync?.()};
const observationDrafts=()=>{try{return JSON.parse(localStorage.getItem(observationDraftKey)||'{}')}catch{return {}}};
const observationWords=text=>[...(text||'').replace(/\s/g,'')].length;
function chineseChapterNumber(value){
  if(/^\d+$/.test(value))return Number(value);
  const digits={零:0,〇:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9},units={十:10,百:100,千:1000};
  let total=0,current=0;
  for(const char of value){if(char in digits)current=digits[char];else if(char in units){total+=(current||1)*units[char];current=0}else return null}
  return total+current||null;
}
function writingChapter(title){
  const found=String(title||'').match(/第\s*([0-9零〇一二两三四五六七八九十百千]+)\s*章/),number=found?chineseChapterNumber(found[1]):null;
  return number===null?{key:'unassigned',label:'未分章',number:Number.MAX_SAFE_INTEGER}:{key:`chapter-${number}`,label:`第${number}章`,number};
}
function writingOrder(entry){return Number.isFinite(entry.writingOrder)?entry.writingOrder:Number.MAX_SAFE_INTEGER}
const observationEditorKey=()=>observationEditingId||'new';
const observationEsc=text=>esc(String(text||''));
const observationParagraphs=text=>String(text||'').split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${observationEsc(line.trim().replace(/^　　/,''))}</p>`).join('');
function observationComparison(entry){
  const original=typeof entry.originalText==='string'?entry.originalText:null;
  return {title:entry.title||'',date:entry.date||'',originalText:original,originalSource:entry.originalSource||'',analysis:entry.analysis||'',text:entry.text||''};
}
function openObservationComparison(entry){
  if(!entry)return;
  const comparison=observationComparison(entry);
  if(window.phdDesktop?.openObservationCompare){window.phdDesktop.openObservationCompare(comparison);return}
  const render=window.renderObservationComparisonText||observationParagraphs;
  const original=comparison.originalText===null?'旧记录未留存首次原文':comparison.originalText;
  $('#detail').innerHTML=`<section class="observation-mobile-detail"><p class="diary-detail-label">写作 · 修改对比</p><h2>${observationEsc(comparison.title||'未命名写作')}</h2><p class="writing-record-meta"><time datetime="${observationEsc(comparison.date)}">${observationEsc(fmt(comparison.date))}</time><span>${observationWords(comparison.text)} 字</span></p><section><h3>修改后</h3>${render(comparison.text)}</section><section class="analysis"><h3>分析</h3>${render(comparison.analysis||'尚未填写分析')}</section><section><h3>修改前</h3>${comparison.originalSource==='legacy-baseline'?'<p class="observation-original-note">旧记录：从首次再次编辑前的版本开始保留</p>':''}${render(original)}</section></section>`;
  $('#modal').classList.remove('hidden');
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
  drafts[key]={date:entry?.date||day(),title:$('#observationTitle').value,text:$('#observationText').value,analysis:$('#observationAnalysis').value,place:entry?.place||'',updatedAt:new Date().toISOString()};
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
  const groups=new Map();
  for(const entry of observations){const chapter=writingChapter(entry.title);if(!groups.has(chapter.key))groups.set(chapter.key,{...chapter,entries:[]});groups.get(chapter.key).entries.push(entry)}
  const sortedGroups=[...groups.values()].sort((a,b)=>a.number-b.number);
  list.innerHTML=sortedGroups.length?sortedGroups.map(group=>{
    const entries=group.entries.sort((a,b)=>writingOrder(a)-writingOrder(b)||(a.createdAt||'').localeCompare(b.createdAt||'')||a.id.localeCompare(b.id));
    return `<section class="writing-chapter" data-chapter-key="${group.key}"><h3 class="observation-date-heading">${observationEsc(group.label)}<span>${entries.length} 篇</span></h3>${entries.map(entry=>`<div class="swipe-row observation-swipe" data-observation-id="${observationEsc(entry.id)}" data-chapter-key="${group.key}"><div class="diary-row-actions"><button type="button" class="edit-record observation-edit" aria-label="编辑写作">编辑</button><button type="button" class="delete-record observation-delete" aria-label="删除写作">删除</button></div><article class="observation-item" role="button" tabindex="0" aria-label="查看${observationEsc(entry.title)}的修改对比"><div class="observation-item-main"><h3>${observationEsc(entry.title)}</h3><p class="writing-record-meta"><time datetime="${observationEsc(entry.date)}">${observationEsc(fmt(entry.date))}</time><span>${observationWords(entry.text)} 字</span></p></div></article></div>`).join('')}</section>`;
  }).join(''):'<p class="empty">还没有写作记录。可以从一个场景、一段对话或一个人物开始写。</p>';
  $$('.observation-swipe').forEach(row=>{
    const card=row.querySelector('.observation-item');
    const id=row.dataset.observationId;
    card.onclick=()=>{if(row.dataset.justSorted)return;openObservationComparison(observations.find(item=>item.id===id))};
    card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click()}};
    row.querySelector('.observation-edit').onclick=event=>{event.stopPropagation();saveObservationDraftNow();openObservationEditor(observations.find(item=>item.id===id))};
    row.querySelector('.observation-delete').onclick=async event=>{
      event.stopPropagation();
      if(!await confirmFourDigitDelete('写作记录'))return;
      observations=observations.filter(item=>item.id!==id);saveObservations();clearObservationDraft(id);
      if(observationEditingId===id)openObservationEditor();renderObservations();
    };
    enableWritingSorting(row);
    if(window.phdDesktop){row.oncontextmenu=event=>{event.preventDefault();event.stopPropagation();document.querySelector('#desktopNoteMenu')?.remove();const menu=document.createElement('div');menu.id='desktopNoteMenu';menu.className='desktop-note-menu';menu.innerHTML='<button type="button" data-action="edit">编辑</button><button type="button" data-action="delete">删除</button>';document.body.append(menu);menu.style.left=`${Math.max(12,Math.min(event.clientX,window.innerWidth-menu.offsetWidth-12))}px`;menu.style.top=`${Math.max(12,Math.min(event.clientY,window.innerHeight-menu.offsetHeight-12))}px`;menu.querySelector('[data-action="edit"]').onclick=()=>{menu.remove();row.querySelector('.observation-edit').click()};menu.querySelector('[data-action="delete"]').onclick=()=>{menu.remove();row.querySelector('.observation-delete').click()};setTimeout(()=>document.addEventListener('pointerdown',click=>{if(!click.target.closest('#desktopNoteMenu'))menu.remove()},{once:true,capture:true}),0)};return}
    let start=null,delta=0;
    row.addEventListener('pointerdown',event=>{if(event.target.closest('.diary-row-actions'))return;start=event.clientX;delta=0});
    row.addEventListener('pointermove',event=>{if(start===null)return;delta=Math.min(0,Math.max(-168,event.clientX-start));if(delta<0)card.style.transform=`translateX(${delta}px)`});
    row.addEventListener('pointerup',event=>{if(start===null)return;card.style.transform='';if(event.target.closest('.diary-row-actions')){start=null;return}if(row.classList.contains('swiped')&&delta>-12){row.classList.remove('swiped');start=null;return}if(delta<-42)row.classList.add('swiped');start=null});
    row.addEventListener('pointercancel',()=>{card.style.transform='';start=null});
  });
}
function enableWritingSorting(row){
  const card=row.querySelector('.observation-item');let pointerId=null,sorting=false,startX=0,startY=0,holdTimer=null;
  const cancelHold=()=>{clearTimeout(holdTimer);holdTimer=null};
  const move=event=>{
    if(event.pointerId!==pointerId)return;event.preventDefault();
    if(!sorting){if(Math.hypot(event.clientX-startX,event.clientY-startY)>8)cancelHold();return}
    const chapter=row.closest('.writing-chapter'),siblings=[...chapter.querySelectorAll('.observation-swipe')].filter(item=>item!==row),next=siblings.find(item=>{const rect=item.getBoundingClientRect();return event.clientY<rect.top+rect.height/2});
    if(next)chapter.insertBefore(row,next);else chapter.append(row);
  };
  const finish=event=>{
    if(event.pointerId!==pointerId)return;cancelHold();window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);card.releasePointerCapture?.(pointerId);card.style.touchAction='';pointerId=null;
    if(!sorting)return;sorting=false;row.classList.remove('writing-sorting');row.dataset.justSorted='1';setTimeout(()=>delete row.dataset.justSorted,180);
    const ids=[...row.closest('.writing-chapter').querySelectorAll('.observation-swipe')].map(item=>item.dataset.observationId),stamp=new Date().toISOString();
    ids.forEach((id,index)=>{const entry=observations.find(item=>item.id===id);if(entry){entry.writingOrder=index;entry.updatedAt=stamp}});saveObservations();
  };
  card.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;pointerId=event.pointerId;startX=event.clientX;startY=event.clientY;
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
    holdTimer=setTimeout(()=>{sorting=true;row.classList.add('writing-sorting');card.style.touchAction='none';card.setPointerCapture?.(pointerId);navigator.vibrate?.(10)},320);
  });
}
function updateObservationHeader(){
  $('header h1').textContent='写作';
  updateHeaderStat('diary');
  $('#headerStat').textContent=`累计 ${observations.reduce((total,item)=>total+observationWords(item.text),0).toLocaleString('zh-CN')} 字`;
}
function renderObservationCalendar(){
  const panel=$('#observationCalendar'),year=observationPickerMonth.getFullYear(),month=observationPickerMonth.getMonth(),offset=(new Date(year,month,1).getDay()+6)%7,total=new Date(year,month+1,0).getDate(),recordedDates=new Set(observations.map(item=>item.date)),cells=[];
  for(let index=0;index<offset;index++)cells.push('<button class="blank" disabled></button>');
  for(let date=1;date<=total;date++){const value=localDay(new Date(year,month,date));cells.push(`<button class="${recordedDates.has(value)?'has-diary':''}" data-observation-date="${value}" type="button">${date}</button>`)}
  panel.innerHTML=`<div class="calendar-head"><button id="observationPrevMonth" type="button">‹</button><b>${year} 年 ${month+1} 月</b><button id="observationNextMonth" type="button">›</button></div><div class="calendar-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-grid">${cells.join('')}</div><p class="calendar-legend"><i></i>有写作记录</p>`;
  $('#observationPrevMonth').onclick=()=>{observationPickerMonth=new Date(year,month-1,1);renderObservationCalendar()};
  $('#observationNextMonth').onclick=()=>{observationPickerMonth=new Date(year,month+1,1);renderObservationCalendar()};
  $$('[data-observation-date]').forEach(button=>button.onclick=()=>{observationFilterDate=button.dataset.observationDate;panel.classList.add('hidden');renderObservations();$('#observationList').scrollIntoView({block:'start',behavior:'smooth'})});
}
function showDiarySubview(mode){
  const observation=mode==='observation';
  $('#diary').classList.toggle('observation-mode',observation);
  $$('.diary-subview button').forEach(button=>{const active=button.dataset.diarySubview===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});
  if(observation){updateObservationHeader();renderObservations()}else{$('header h1').textContent='日记';updateHeaderStat('diary')}
}

const diaryQuote=$('#diary .quote-card');
const observationTabs=document.createElement('div');observationTabs.className='diary-subview';observationTabs.setAttribute('role','tablist');
observationTabs.innerHTML='<button type="button" data-diary-subview="diary" role="tab" aria-selected="true">日记</button><button type="button" data-diary-subview="observation" role="tab" aria-selected="false">写作</button>';
const observationPane=document.createElement('section');observationPane.id='observationPane';
observationPane.innerHTML='<article id="observationEditor" class="observation-editor"><input id="observationTitle" class="observation-title" type="text" maxlength="80" aria-label="写作标题" placeholder="标题中写明第几章，例如：第1章 初见"><textarea id="observationText" aria-label="写作正文" placeholder="写下这一章的片段、场景、对话或修改稿……"></textarea><div class="observation-editor-actions"><button id="saveObservation" type="button">保存</button><button id="toggleObservationAnalysis" type="button" aria-controls="observationAnalysisPanel" aria-expanded="false">分析</button><div class="observation-editor-meta"><span id="observationWordCount">已写 0 字</span><span id="observationDraftStatus" class="local-draft-status"></span></div></div><div id="observationAnalysisPanel" class="observation-analysis-panel" hidden><label for="observationAnalysis">分析</label><textarea id="observationAnalysis" aria-label="写作分析" placeholder="这段文字有哪些优点、问题，以及下一步准备怎样修改？"></textarea></div></article><h2 class="observation-list-heading">写作记录</h2><div id="observationList"></div>';
diaryQuote.after(observationTabs,observationPane);
openObservationEditor();
$$('.diary-subview button').forEach(button=>button.onclick=()=>showDiarySubview(button.dataset.diarySubview));
$$('#observationEditor input,#observationEditor textarea').forEach(input=>input.addEventListener('input',queueObservationDraft));
$('#toggleObservationAnalysis').onclick=()=>{const open=$('#observationAnalysisPanel').hidden;setObservationAnalysisOpen(open);if(open)$('#observationAnalysis').focus()};
$('#saveObservation').onclick=async()=>{
  const title=$('#observationTitle').value.trim(),text=$('#observationText').value.trim(),analysis=$('#observationAnalysis').value.trim();
  if(!title)return $('#observationTitle').focus();
  if(!text)return $('#observationText').focus();
  const old=observations.find(item=>item.id===observationEditingId),button=$('#saveObservation');
  button.disabled=true;
  button.textContent=window.phdDesktop?'正在保存…':'正在记录地点…';
  const place=window.phdDesktop?(old?.place||''):(await diaryPlace()||old?.place||''),date=old?.date||day();
  const now=new Date().toISOString();
  const chapter=writingChapter(title),oldChapter=old?writingChapter(old.title):null,maxOrder=Math.max(-1,...observations.filter(item=>item.id!==old?.id&&writingChapter(item.title).key===chapter.key).map(item=>Number.isFinite(item.writingOrder)?item.writingOrder:-1));
  const entry={...old,id:old?.id||crypto.randomUUID(),date,title,text,analysis,place,createdAt:old?.createdAt||now,updatedAt:now,writingOrder:old&&oldChapter.key===chapter.key&&Number.isFinite(old.writingOrder)?old.writingOrder:maxOrder+1,originalText:old?(typeof old.originalText==='string'?old.originalText:old.text):text,originalSource:old?(old.originalSource||'legacy-baseline'):'first-save'};
  if(old)observations[observations.findIndex(item=>item.id===old.id)]=entry;else observations.push(entry);
  saveObservations();clearObservationDraft();button.disabled=false;
  openObservationEditor();renderObservations();
  showObservationDraftStatus(window.phdDesktop||place?'写作记录已保存':'已保存；未能获取地点，请检查定位权限与高德 Key',true);
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
window.addEventListener('pagehide',()=>{if($('#diary').classList.contains('observation-mode'))saveObservationDraftNow()});
const pageBeforeObservation=page;
page=id=>{if(id!=='diary')window.phdDesktop?.closeObservationCompare?.();pageBeforeObservation(id);if(id==='diary')showDiarySubview($('#diary').classList.contains('observation-mode')?'observation':'diary')};
