// Read-only cross-date quick-note timeline. Editing intentionally stays in Archive.
const notesTimelineStyle=document.createElement('style');
notesTimelineStyle.textContent=`
nav{left:0!important;right:0!important;width:100vw!important;transform:none!important;justify-content:space-between!important;gap:0!important;padding:4px 0 calc(4px + env(safe-area-inset-bottom))!important}nav button{flex:0 0 auto;width:20%;min-width:0;padding:2px 0!important}nav button svg{display:block;width:20px;height:20px;margin:auto;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}nav button span{margin-top:0!important;white-space:nowrap}.notes-timeline-tools{margin:2px 0 14px}.notes-timeline-list{position:relative;padding:0 0 12px}.notes-timeline-list::before{content:'';position:absolute;left:74px;top:14px;bottom:20px;width:1px;background:#c7c7cc}.timeline-entry{position:relative;display:grid;grid-template-columns:60px 28px minmax(0,1fr);gap:0;margin:0 0 13px;padding:0;background:transparent;border-radius:0;color:#1c1c1e}.timeline-stamp{padding:4px 8px 0 0;text-align:center;color:#636366}.timeline-stamp b,.timeline-stamp span,.timeline-stamp time,.timeline-note-number{display:block;font-size:12px;line-height:1.3}.timeline-stamp b{font-weight:600}.timeline-stamp span{margin:1px 0}.timeline-stamp time{margin-top:2px}.timeline-note-number{margin-top:7px;color:#007aff;font-style:normal;font-weight:700;letter-spacing:.01em}.timeline-dot{position:relative;z-index:1;display:block;width:10px;height:10px;margin:9px auto 0;border-radius:50%;background:#007aff;border:2px solid #f2f2f7;box-shadow:0 0 0 1px #007aff}.timeline-card{background:#fff;border-radius:15px;padding:13px 14px;min-height:52px;box-shadow:0 1px 1px #00000008}.timeline-card .note-lines{font-size:14px}.timeline-card .note-lines.timeline-collapsed{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:8}.timeline-expand{display:block;margin:7px 0 0;padding:2px 0;background:transparent;color:#007aff;font-size:13px;font-weight:500}.timeline-images{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.timeline-images:empty{display:none}.timeline-images button{padding:0;background:transparent}.timeline-images img{display:block;width:62px;height:62px;object-fit:cover;border-radius:9px;background:#e5e5ea}@media (prefers-color-scheme:dark){.notes-timeline-list::before{background:#48484a}.timeline-entry{color:#f2f2f7}.timeline-stamp{color:#98989d}.timeline-dot{border-color:#000;box-shadow:0 0 0 1px #0a84ff}.timeline-card{background:#1c1c1e;box-shadow:none}}`;
document.head.append(notesTimelineStyle);
if(window.phdDesktop)document.body.classList.add('desktop-app');
const notesTimelineReadingStyle=document.createElement('style');
notesTimelineReadingStyle.textContent=`
.timeline-card .note-lines{margin:0;padding-left:1.35em;line-height:1.76;letter-spacing:.01em;color:#111;text-align:justify;text-justify:inter-ideograph}.timeline-card .note-lines li{margin:5px 0;padding-left:3px;text-align:justify;text-justify:inter-ideograph}.timeline-card .note-lines li::marker{color:#8e8e93;font-size:.82em}.timeline-card .note-lines li.timeline-category{list-style:none;margin:0 0 9px;padding:4px 8px;border-radius:7px;background:#eaf3ff;color:#007aff;font-size:12px;font-weight:600;letter-spacing:0;text-align:left}.timeline-card .note-lines:has(.timeline-category){padding-left:0}.timeline-card .note-lines:has(.timeline-category) li:not(.timeline-category){margin-left:1.35em}.timeline-card .note-lines.timeline-collapsed{max-height:14.2em;overflow:hidden;position:relative}.timeline-card .note-lines.timeline-collapsed::after{content:'';position:absolute;right:0;bottom:0;width:42%;height:2.1em;background:linear-gradient(90deg,transparent,#fff 78%)}@media (prefers-color-scheme:dark){.timeline-card .note-lines{color:#f2f2f7}.timeline-card .note-lines li::marker{color:#98989d}.timeline-card .note-lines li.timeline-category{background:#12395c;color:#8fc9ff}.timeline-card .note-lines.timeline-collapsed::after{background:linear-gradient(90deg,transparent,#1c1c1e 78%)}}
`;
document.head.append(notesTimelineReadingStyle);
const notesTimelineWidthStyle=document.createElement('style');
notesTimelineWidthStyle.textContent=`
.notes-timeline-list::before{left:66px}.timeline-entry{grid-template-columns:56px 20px minmax(0,1fr)}.timeline-stamp{padding-right:4px}.timeline-stamp b,.timeline-stamp span,.timeline-stamp time,.timeline-note-number{font-size:11px}.timeline-stamp b{white-space:nowrap;letter-spacing:-.6px}.timeline-dot{width:9px;height:9px}
`;
document.head.append(notesTimelineWidthStyle);
const notesTimelineDarkContrastStyle=document.createElement('style');
notesTimelineDarkContrastStyle.textContent=`
@media (prefers-color-scheme:dark){#notesTimeline .notes-timeline-list::before{background:#a1a1a6!important;opacity:1!important}#notesTimeline .timeline-stamp{color:#f2f2f7!important}#notesTimeline .timeline-dot{display:block!important;background:#0a84ff!important;border-color:#1c1c1e!important;box-shadow:0 0 0 1px #64b5ff!important}}
`;
document.head.append(notesTimelineDarkContrastStyle);
const notesTimelineContinuousLineStyle=document.createElement('style');
notesTimelineContinuousLineStyle.textContent=`
#notesTimeline .notes-timeline-list::before{display:none}#notesTimeline .timeline-entry::after{content:'';position:absolute;z-index:0;left:65.5px;top:13px;bottom:-14px;width:1px;background:#c7c7cc}#notesTimeline .timeline-entry:last-child::after{display:none}@media (prefers-color-scheme:dark){#notesTimeline .timeline-entry::after{background:#a1a1a6!important}}
`;
document.head.append(notesTimelineContinuousLineStyle);
const notesTimelineScrollStyle=document.createElement('style');
notesTimelineScrollStyle.textContent=`
/* 与档案的记录页共用自然文档流：只有真实卡片与“加载更多”决定页面末尾。 */
#notesTimeline.active{position:static;display:block;width:auto;min-height:0;height:auto;transform:none}.notes-timeline-tools{margin:2px 0 14px;padding:0;background:transparent}.notes-timeline-list{min-height:0;height:auto;overflow:visible;padding:0}
/* 两端均由页面本身滚动；不再建立仅包含卡片的独立滚动区。 */
@media(max-width:699px){body.notes-timeline-active{overflow-y:auto!important}body.notes-timeline-active main{height:auto!important;min-height:0!important;overflow:visible!important}#notesTimeline.active{position:static!important;z-index:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;display:block!important;width:auto!important;height:auto!important;min-height:0!important;overflow:visible!important;transform:none!important}.notes-timeline-list,#notesTimeline.active .notes-timeline-list{display:block!important;min-height:0!important;height:auto!important;overflow:visible!important;flex:none!important;padding:0 0 12px!important}}
body.desktop-app.notes-timeline-active{overflow-y:auto!important}body.desktop-app.notes-timeline-active main{height:auto!important;min-height:0!important;overflow:visible!important}body.desktop-app.notes-timeline-active #notesTimeline.active{position:static!important;display:block!important;height:auto!important;min-height:0!important;overflow:visible!important}body.desktop-app.notes-timeline-active #notesTimeline.active .notes-timeline-list{height:auto!important;min-height:0!important;overflow:visible!important}body.desktop-app.notes-timeline-active header{padding-bottom:4px!important}body.desktop-app.notes-timeline-active #notesTimeline.active .notes-timeline-tools{margin-top:0!important;margin-bottom:10px!important}
`;
document.head.append(notesTimelineScrollStyle);
const compactHeaderTitleStyle=document.createElement('style');
compactHeaderTitleStyle.textContent=`header h1{font-size:28px!important;letter-spacing:-.6px!important}`;
document.head.append(compactHeaderTitleStyle);
const compactMobileNavStyle=document.createElement('style');
compactMobileNavStyle.textContent=`@media (max-width:699px){body:not(.desktop-app) nav{justify-content:center!important;gap:10px!important;padding-left:0!important;padding-right:0!important}body:not(.desktop-app) nav button{flex:0 0 60px!important;width:60px!important;letter-spacing:-.45px}body:not(.desktop-app) nav button svg{width:19px;height:19px}body:not(.desktop-app) nav button span{font-size:9px!important}}`;
document.head.append(compactMobileNavStyle);
const compactPageTopSpacingStyle=document.createElement('style');
compactPageTopSpacingStyle.textContent=`#diary.active>.quote-card{margin-top:4px}#notesTimeline.active .notes-timeline-tools{padding-top:0}`;
document.head.append(compactPageTopSpacingStyle);
const headerStatStyle=document.createElement('style');
headerStatStyle.textContent=`header{position:relative}#headerStat{position:absolute;right:auto;bottom:20px;color:#8e8e93;font-size:12px;line-height:1;font-weight:400;white-space:nowrap}@media (prefers-color-scheme:dark){#headerStat{color:#98989d}}`;
document.head.append(headerStatStyle);
// iPhone 随手记不用页面本身滚动。直接把可滚动范围限定到条目列表，
// “加载更多”便是这个范围的最后一个元素，Safari 也无法在它后面保留旧高度。
window.resetNotesTimelineScrollShell=()=>{
  let page=$('#notesTimeline'),list=$('#notesTimelineList'),main=document.querySelector('main');
  for(let element of [document.documentElement,document.body,main,page,list])if(element)element.removeAttribute('style');
};
window.updateNotesTimelineLayout=()=>{};
if(window.phdDesktop){
  const desktopBottomNavStyle=document.createElement('style');
  desktopBottomNavStyle.textContent=`
  .desktop-app nav{position:fixed!important;left:0!important;right:0!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;transform:none!important;padding:6px 12px!important;border-radius:0;border-left:0;border-right:0}.desktop-app nav button{width:20%;flex:1 1 20%;min-width:0;padding:2px 0!important}.desktop-app nav button svg{width:20px;height:20px}.desktop-app nav button span{font-size:10px;overflow:hidden;text-overflow:ellipsis}@media (prefers-color-scheme:dark){.desktop-app nav{border-left-color:#38383a;border-right-color:#38383a}}
  `;
  document.head.append(desktopBottomNavStyle);
}
const notesTimelineParagraphStyle=document.createElement('style');
notesTimelineParagraphStyle.textContent=`
.timeline-card .note-paragraph{margin:0 0 7px!important;color:#111!important;font-size:14px;line-height:1.76;text-indent:2em;text-align:justify!important;text-justify:inter-ideograph}.timeline-card .note-paragraph:last-of-type{margin-bottom:0!important}.timeline-card:has(.note-paragraph).timeline-collapsed{max-height:232px;overflow:hidden;position:relative}.timeline-card:has(.note-paragraph).timeline-collapsed::after{content:'';position:absolute;right:0;bottom:0;width:100%;height:48px;background:linear-gradient(transparent,#fff 80%);pointer-events:none}@media (prefers-color-scheme:dark){.timeline-card .note-paragraph{color:#f2f2f7!important}.timeline-card:has(.note-paragraph).timeline-collapsed::after{background:linear-gradient(transparent,#1c1c1e 80%)}}
`;
document.head.append(notesTimelineParagraphStyle);
// This renderer deliberately does not call noteContent(): archive-date.js
// replaces that shared helper with paragraph markup after this file loads.
const notesTimelineOwnContentStyle=document.createElement('style');
notesTimelineOwnContentStyle.textContent=`.timeline-text{color:#000;font-size:14px;line-height:1.76;letter-spacing:.01em;text-align:left}.timeline-text .timeline-category{margin:0 0 10px;padding:4px 8px;border-radius:7px;background:#eaf3ff;color:#007aff;font-size:12px;font-weight:600;letter-spacing:0;text-align:left}.timeline-text .timeline-body{white-space:pre-wrap;overflow-wrap:anywhere}.timeline-text .timeline-body.timeline-collapsed{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:4;white-space:pre-wrap}.note-place{display:block;margin-top:8px;color:#636366;font-size:12px;line-height:1.45;text-align:left}@media (prefers-color-scheme:dark){.timeline-text{color:#f2f2f7}.timeline-text .timeline-category{background:#12395c;color:#8fc9ff}.note-place{color:#aeaeb2}}`;
document.head.append(notesTimelineOwnContentStyle);
const notesDirectoryStyle=document.createElement('style');
notesDirectoryStyle.textContent=`.notes-timeline-tools{display:flex;align-items:center;gap:8px}.notes-timeline-tools input{min-width:0;flex:1}.notes-directory-trigger{display:inline-flex;flex:0 0 auto;align-items:center;gap:3px;height:38px;margin:0;padding:0 10px!important;border:1px solid #d1d1d6!important;border-radius:9px!important;background:#fff!important;color:#007aff!important;font-size:12px!important;font-weight:650!important;line-height:1!important}.notes-directory-trigger:first-letter{font-size:17px}.notes-directory-mask{position:fixed;z-index:1000;inset:0;display:flex;align-items:flex-end;background:#0005}.notes-directory-panel{width:min(100%,620px);max-height:min(76vh,680px);margin:auto 0 0;overflow:hidden;border-radius:18px 18px 0 0;background:#f7f7fa;box-shadow:0 -8px 28px #0003}.notes-directory-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px 11px;border-bottom:1px solid #dedee3}.notes-directory-head h2{margin:0;color:#1c1c1e;font-size:18px}.notes-directory-head small{display:block;margin-top:3px;color:#8e8e93;font-size:12px}.notes-directory-close{width:32px;height:32px;padding:0;border-radius:50%;background:#e5e5ea;color:#636366;font-size:22px;line-height:1}.notes-directory-list{max-height:calc(min(76vh,680px) - 76px);padding:6px 10px calc(14px + env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch}.notes-directory-item{display:flex;width:100%;min-width:0;gap:9px;padding:11px 7px;border-bottom:1px solid #e5e5ea;background:transparent;color:#1c1c1e;text-align:left}.notes-directory-item:last-child{border-bottom:0}.notes-directory-item time{flex:0 0 70px;color:#007aff;font-size:12px;font-weight:650;line-height:1.45}.notes-directory-item span{min-width:0;overflow:hidden;color:#3a3a3c;font-size:13px;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}.notes-directory-empty{margin:18px 8px;color:#8e8e93;text-align:center}@media (prefers-color-scheme:dark){.notes-directory-trigger{border-color:#48484a!important;background:#2c2c2e!important;color:#64b5ff!important}.notes-directory-mask{background:#0009}.notes-directory-panel{background:#1c1c1e}.notes-directory-head{border-color:#38383a}.notes-directory-head h2,.notes-directory-item{color:#f2f2f7}.notes-directory-close{background:#3a3a3c;color:#d1d1d6}.notes-directory-item{border-color:#38383a}.notes-directory-item span{color:#d1d1d6}}
`;
document.head.append(notesDirectoryStyle);
const notesDirectoryVisibilityStyle=document.createElement('style');
notesDirectoryVisibilityStyle.textContent='.notes-directory-mask.hidden{display:none!important}';
document.head.append(notesDirectoryVisibilityStyle);
const timelineDate=iso=>{let date=new Date(iso),options={month:'long',day:'numeric'};if(date.getFullYear()!==new Date().getFullYear())options.year='numeric';return date.toLocaleDateString('zh-CN',options)};
const timelineWeekday=iso=>new Date(iso).toLocaleDateString('zh-CN',{weekday:'short'});
const timelineTime=iso=>new Date(iso).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
const timelineText=text=>{let source=String(text||'').replace(/\r/g,'').trim(),body=window.renderNoteMarkup?window.renderNoteMarkup(source):esc(source);return `<div class="timeline-text"><div class="timeline-body timeline-markdown-body">${body}</div></div>`};
const timelineListKey=term=>`${term}|${notes.map(note=>`${note.id}:${note.updatedAt||note.createdAt||''}:${note.serial||''}`).join('|')}`;
const directoryPlainText=text=>String(window.plainNoteText?window.plainNoteText(text):text||'').replace(/\r/g,'').replace(/\[\[[^:：\]]+[::：]([^\]]+)\]\]/g,'$1');
const directoryLine=text=>String(text||'').replace(/^[#>*\-\s]+/,'').replace(/[*_`]/g,'').replace(/\s+/g,' ').trim();
function noteDirectorySummary(note){
  let raw=directoryPlainText(note.text),lines=raw.split('\n').map(directoryLine).filter(Boolean),category=(raw.match(/【([^】]+)】/)||[])[1]||'';
  let fields=new Map();for(let line of lines){let match=line.match(/^([^：:]{1,24})[：:]\s*(.+)$/);if(match)fields.set(match[1].trim(),directoryLine(match[2]));}
  let refMatch=raw.match(/\bREF[-\s]?0*(\d{1,})\b/i),reference=refMatch?`REF-${String(refMatch[1]).padStart(4,'0')}`:'';
  let title=fields.get('论文题目')||fields.get('文献题目')||'';
  let priority=['关键词摘录','和我课题的关系','核心内容','我的理解','关键观点','问题','结果','结论'];
  let summary=priority.map(key=>fields.get(key)).find(Boolean)||'';
  if(!summary){summary=lines.find(line=>line!==`【${category}】`&&!/^（?(论文题目|文献题目|论文编号|原文位置|日期|时间)[：:]/.test(line)&&line!==title)||'';}
  let text=category==='读文献'?[reference,summary].filter(Boolean).join('｜'):[category?`【${category}】`:'' ,summary||title||lines.find(line=>!/^【[^】]+】$/.test(line))||'未填写内容'].filter(Boolean).join(' ');
  return text||'未填写内容';
}
function ensureNotesDirectory(){
  let tools=$('.notes-timeline-tools');if(!tools)return null;
  let trigger=$('#notesTimelineDirectory');if(!trigger){trigger=document.createElement('button');trigger.id='notesTimelineDirectory';trigger.type='button';trigger.className='notes-directory-trigger plain';trigger.setAttribute('aria-haspopup','dialog');trigger.innerHTML='☷<span>目录</span>';tools.append(trigger);}
  let mask=$('#notesTimelineDirectoryMask');if(!mask){mask=document.createElement('div');mask.id='notesTimelineDirectoryMask';mask.className='notes-directory-mask hidden';mask.innerHTML='<section class="notes-directory-panel" role="dialog" aria-modal="true" aria-labelledby="notesDirectoryTitle"><div class="notes-directory-head"><div><h2 id="notesDirectoryTitle">随手记目录</h2><small>点一条记录即可跳转</small></div><button type="button" class="notes-directory-close" aria-label="关闭目录">×</button></div><div id="notesTimelineDirectoryList" class="notes-directory-list"></div></section>';document.body.append(mask);mask.querySelector('.notes-directory-close').onclick=()=>closeNotesDirectory();mask.onclick=event=>{if(event.target===mask)closeNotesDirectory();};}
  trigger.onclick=()=>openNotesDirectory();return mask;
}
function closeNotesDirectory(){let mask=$('#notesTimelineDirectoryMask'),trigger=$('#notesTimelineDirectory');if(mask)mask.classList.add('hidden');if(trigger)trigger.setAttribute('aria-expanded','false');}
function openNotesDirectory(){
  let mask=ensureNotesDirectory(),list=$('#notesTimelineDirectoryList'),trigger=$('#notesTimelineDirectory');if(!mask||!list)return;
  let ordered=notes.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  list.innerHTML=ordered.length?ordered.map(note=>`<button type="button" class="notes-directory-item" data-note-id="${esc(note.id)}" title="${esc(noteDirectorySummary(note))}"><time>#${noteSerial(note)}<br>${esc(timelineDate(note.createdAt))}</time><span>${esc(noteDirectorySummary(note))}</span></button>`).join(''):'<p class="notes-directory-empty">还没有随手记。</p>';
  list.querySelectorAll('.notes-directory-item').forEach(button=>button.onclick=()=>{let note=notes.find(item=>item.id===button.dataset.noteId);if(!note)return;closeNotesDirectory();let input=$('#notesTimelineSearch');input.value=`#${noteSerial(note)}`;window.renderNotesTimeline?.();requestAnimationFrame(()=>$('#notesTimelineList .timeline-entry')?.scrollIntoView({block:'start',behavior:'smooth'}));});
  mask.classList.remove('hidden');trigger?.setAttribute('aria-expanded','true');
}
async function renderTimelineImages(note,holder){
  let images=await getNoteImages(note.id);if(!holder.isConnected||!images.length)return;
  let used=window.hydrateNoteInlineImages?.(holder.closest('.timeline-card'),images)||new Set(),remaining=images.filter(image=>!used.has(image.id));
  holder.innerHTML=remaining.map((image,index)=>`<button type="button" data-index="${index}" aria-label="查看原图"><img src="${URL.createObjectURL(image.blob)}" alt="随手记图片 ${index+1}"></button>`).join('');
  holder.querySelectorAll('button').forEach(button=>button.onclick=()=>openNoteImage(remaining[+button.dataset.index].blob));
  requestAnimationFrame(()=>window.fitNotesTimelineTail?.());
}
window.fitNotesTimelineTail=()=>{};
function applyTimelineCollapse(entry){
  let textBlock=entry?.querySelector('.timeline-body');
  if(!textBlock||textBlock.dataset.collapseReady==='1')return true;
  // 后台预加载时页面处于隐藏状态，无法得到可靠高度；进入随手记后再测量。
  if(!entry.getClientRects().length)return false;
  if(textBlock.scrollHeight<=99){textBlock.dataset.collapseReady='1';return true;}
  // iPhone WebKit 会把 line-clamp 隐藏的长正文继续计入祖先滚动高度。
  // 收起时保存完整标记、只放入真正的短预览；展开再恢复，避免产生幽灵空白。
  let mobile=!window.phdDesktop&&matchMedia('(max-width:699px)').matches;
  if(mobile){
    textBlock.dataset.timelineFullMarkup=textBlock.innerHTML;
    textBlock.dataset.timelinePreviewText=(textBlock.textContent||'').replace(/\s+/g,' ').trim().slice(0,180);
    textBlock.textContent=`${textBlock.dataset.timelinePreviewText}…`;
  }
  textBlock.classList.add('timeline-collapsed');
  requestAnimationFrame(()=>window.fitNotesTimelineTail?.());
  let expand=document.createElement('button');expand.type='button';expand.className='timeline-expand';expand.textContent=mobile?'全文':'展开全文';
  expand.onclick=()=>{
    let collapsed=textBlock.classList.contains('timeline-collapsed');
    if(collapsed){
      if(mobile&&textBlock.dataset.timelineFullMarkup!==undefined)textBlock.innerHTML=textBlock.dataset.timelineFullMarkup;
      textBlock.classList.remove('timeline-collapsed');expand.textContent='收起';
    }else{
      if(mobile){let preview=textBlock.dataset.timelinePreviewText||'';textBlock.textContent=`${preview}…`;}
      textBlock.classList.add('timeline-collapsed');expand.textContent=mobile?'全文':'展开全文';
    }
  };
  if(mobile)entry.querySelector('.timeline-card')?.append(expand);else textBlock.after(expand);textBlock.dataset.collapseReady='1';return true;
}
function refreshTimelineCollapses(root){root?.querySelectorAll('.timeline-entry').forEach(entry=>applyTimelineCollapse(entry));}
let timelineMobileState={key:''};
window.renderNotesTimeline=async function(){
  // 重绘内容不能重置 iPhone 的独立滚动壳；否则异步格式化或加载更多后，
  // 页面会重新获得一段旧的外层可滚动高度。
  if($('#notesTimeline')?.classList.contains('active'))requestAnimationFrame(()=>window.updateNotesTimelineLayout?.());
  if($('#notesTimeline')?.classList.contains('active'))updateHeaderStat?.('notesTimeline');
  let input=$('#notesTimelineSearch'),term=(input?.value||'').trim().toLowerCase();
  let list=notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(note=>noteMatchesSearch(note,term));
  let root=$('#notesTimelineList'),batchSize=30,next=0;
  let key=timelineListKey(term);
  if(timelineMobileState.key===key&&root.childElementCount){if($('#notesTimeline')?.classList.contains('active'))requestAnimationFrame(()=>{refreshTimelineCollapses(root);window.fitNotesTimelineTail?.()});return;}
  timelineMobileState.key=key;
  if(!list.length){root.innerHTML=`<p class="empty">${term?'没有匹配的随手记。':'还没有随手记。'}</p>`;return}
  root.innerHTML='<button type="button" class="timeline-load-more plain">加载更多</button>';
  let more=root.querySelector('.timeline-load-more');
  function appendBatch(){
    if(next>=list.length)return;
    let batch=list.slice(next,next+batchSize);next+=batch.length;
    more.insertAdjacentHTML('beforebegin',batch.map(note=>`<article class="timeline-entry" data-note-id="${esc(note.id)}"><div class="timeline-stamp"><b>${timelineDate(note.createdAt)}</b><span>${timelineWeekday(note.createdAt)}</span><time>${timelineTime(note.createdAt)}</time><em class="timeline-note-number">#${noteSerial(note)}</em></div><i class="timeline-dot" aria-hidden="true"></i><div class="timeline-card">${timelineText(note.text)}${note.place?`<small class="note-place">⌖ ${esc(note.place)}</small>`:''}<div class="timeline-images"></div></div></article>`).join(''));
    for(let note of batch){
      let entry=root.querySelector(`.timeline-entry[data-note-id="${note.id}"]`),holder=entry.querySelector('.timeline-images');
      requestAnimationFrame(()=>applyTimelineCollapse(entry));
      renderTimelineImages(note,holder);
    }
    if(next>=list.length)more.remove();
    requestAnimationFrame(()=>window.fitNotesTimelineTail?.());
  }
  more.onclick=appendBatch;
  appendBatch();
};
if(window.phdDesktop){
  const desktopTimelineBatch=30;
  let timelineState={key:'',generation:0,imageObserver:null};
  window.renderNotesTimeline=function(){
    let root=$('#notesTimelineList'),term=($('#notesTimelineSearch')?.value||'').trim().toLowerCase();
    let key=`${window.desktopDataVersion?.('notes')||0}|${term}`;
    if(timelineState.key===key&&root.childElementCount){if($('#notesTimeline')?.classList.contains('active'))requestAnimationFrame(()=>refreshTimelineCollapses(root));return;}
    timelineState.imageObserver?.disconnect();
    let generation=++timelineState.generation;
    let list=notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(note=>noteMatchesSearch(note,term));
    timelineState.key=key;
    if(!list.length){root.innerHTML=`<p class="empty">${term?'没有匹配的随手记。':'还没有随手记。'}</p>`;return}
    root.innerHTML='<button type="button" class="timeline-load-more plain">加载更多</button>';
    let more=root.querySelector('.timeline-load-more'),next=0;
    timelineState.imageObserver=new IntersectionObserver(entries=>{
      for(let observed of entries){
        if(!observed.isIntersecting||timelineState.generation!==generation)continue;
        timelineState.imageObserver.unobserve(observed.target);
        let note=list[Number(observed.target.dataset.noteIndex)],holder=observed.target.querySelector('.timeline-images');
        if(note&&holder)renderTimelineImages(note,holder);
      }
    },{root:null,rootMargin:'250px'});
    function appendBatch(){
      if(timelineState.generation!==generation||next>=list.length)return;
      let start=next,batch=list.slice(start,start+desktopTimelineBatch);next+=batch.length;
      more.insertAdjacentHTML('beforebegin',batch.map((note,index)=>`<article class="timeline-entry" data-note-index="${start+index}" data-note-id="${esc(note.id)}"><div class="timeline-stamp"><b>${timelineDate(note.createdAt)}</b><span>${timelineWeekday(note.createdAt)}</span><time>${timelineTime(note.createdAt)}</time><em class="timeline-note-number">#${noteSerial(note)}</em></div><i class="timeline-dot" aria-hidden="true"></i><div class="timeline-card">${timelineText(note.text)}<div class="timeline-images"></div></div></article>`).join(''));
      let entry=more.previousElementSibling;
      for(let index=batch.length-1;index>=0;index--){
        let current=entry;entry=entry.previousElementSibling;
        timelineState.imageObserver.observe(current);
        requestAnimationFrame(()=>{if(timelineState.generation===generation)applyTimelineCollapse(current)});
      }
    if(next>=list.length)more.remove();
    }
    more.onclick=appendBatch;
    appendBatch();
    // “加载更多” is deliberately manual. Reaching the page bottom never
    // fetches another batch; the user decides when more timeline cards appear.
  };
}
$('#notesTimelineSearch').oninput=()=>window.renderNotesTimeline();
ensureNotesDirectory();
// 与档案页一致：只在该页真正显示后生成首批内容，避免 iOS 以隐藏状态的页面高度
// 作为滚动上限。“加载更多”仍然完全由用户触发。
window.preloadNotesTimeline=()=>{};
// If iPhone restores this screen before note-format.js has executed, redraw it
// after the formatter announces that KaTeX is available.
window.addEventListener('phd-note-format-ready',()=>{
  if(document.querySelector('#notesTimeline.active'))window.renderNotesTimeline();
});
