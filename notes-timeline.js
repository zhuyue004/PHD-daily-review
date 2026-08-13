// Read-only cross-date quick-note timeline. Editing intentionally stays in Archive.
const notesTimelineStyle=document.createElement('style');
notesTimelineStyle.textContent=`
nav{left:0!important;right:0!important;width:100vw!important;transform:none!important;justify-content:space-between!important;gap:0!important;padding:4px 0 calc(4px + env(safe-area-inset-bottom))!important}nav button{flex:0 0 auto;width:20%;min-width:0;padding:2px 0!important}nav button svg{display:block;width:20px;height:20px;margin:auto;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}nav button span{margin-top:0!important;white-space:nowrap}.notes-timeline-tools{margin:2px 0 14px}.notes-timeline-list{position:relative;padding:0 0 12px}.notes-timeline-list::before{content:'';position:absolute;left:74px;top:14px;bottom:20px;width:1px;background:#c7c7cc}.timeline-entry{position:relative;display:grid;grid-template-columns:60px 28px minmax(0,1fr);gap:0;margin:0 0 13px;padding:0;background:transparent;border-radius:0;color:#1c1c1e}.timeline-stamp{padding:4px 8px 0 0;text-align:center;color:#636366}.timeline-stamp b,.timeline-stamp span,.timeline-stamp time{display:block;font-size:12px;line-height:1.3}.timeline-stamp b{font-weight:600}.timeline-stamp span{margin:1px 0}.timeline-stamp time{margin-top:2px}.timeline-dot{position:relative;z-index:1;display:block;width:10px;height:10px;margin:9px auto 0;border-radius:50%;background:#007aff;border:2px solid #f2f2f7;box-shadow:0 0 0 1px #007aff}.timeline-card{background:#fff;border-radius:15px;padding:13px 14px;min-height:52px;box-shadow:0 1px 1px #00000008}.timeline-card .note-lines{font-size:14px}.timeline-card .note-lines.timeline-collapsed{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:8}.timeline-expand{display:block;margin:7px 0 0;padding:2px 0;background:transparent;color:#007aff;font-size:13px;font-weight:500}.timeline-images{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.timeline-images:empty{display:none}.timeline-images button{padding:0;background:transparent}.timeline-images img{display:block;width:62px;height:62px;object-fit:cover;border-radius:9px;background:#e5e5ea}@media (prefers-color-scheme:dark){.notes-timeline-list::before{background:#48484a}.timeline-entry{color:#f2f2f7}.timeline-stamp{color:#98989d}.timeline-dot{border-color:#000;box-shadow:0 0 0 1px #0a84ff}.timeline-card{background:#1c1c1e;box-shadow:none}}`;
document.head.append(notesTimelineStyle);
const notesTimelineReadingStyle=document.createElement('style');
notesTimelineReadingStyle.textContent=`
.timeline-card .note-lines{margin:0;padding-left:1.35em;line-height:1.76;letter-spacing:.01em;color:#111;text-align:justify;text-justify:inter-ideograph}.timeline-card .note-lines li{margin:5px 0;padding-left:3px;text-align:justify;text-justify:inter-ideograph}.timeline-card .note-lines li::marker{color:#8e8e93;font-size:.82em}.timeline-card .note-lines li.timeline-category{list-style:none;margin:0 0 9px;padding:4px 8px;border-radius:7px;background:#eaf3ff;color:#007aff;font-size:12px;font-weight:600;letter-spacing:0;text-align:left}.timeline-card .note-lines:has(.timeline-category){padding-left:0}.timeline-card .note-lines:has(.timeline-category) li:not(.timeline-category){margin-left:1.35em}.timeline-card .note-lines.timeline-collapsed{max-height:14.2em;overflow:hidden;position:relative}.timeline-card .note-lines.timeline-collapsed::after{content:'';position:absolute;right:0;bottom:0;width:42%;height:2.1em;background:linear-gradient(90deg,transparent,#fff 78%)}@media (prefers-color-scheme:dark){.timeline-card .note-lines{color:#f2f2f7}.timeline-card .note-lines li::marker{color:#98989d}.timeline-card .note-lines li.timeline-category{background:#12395c;color:#8fc9ff}.timeline-card .note-lines.timeline-collapsed::after{background:linear-gradient(90deg,transparent,#1c1c1e 78%)}}
`;
document.head.append(notesTimelineReadingStyle);
const notesTimelineWidthStyle=document.createElement('style');
notesTimelineWidthStyle.textContent=`
.notes-timeline-list::before{left:58px}.timeline-entry{grid-template-columns:48px 20px minmax(0,1fr)}.timeline-stamp{padding-right:4px}.timeline-stamp b,.timeline-stamp span,.timeline-stamp time{font-size:11px}.timeline-dot{width:9px;height:9px}
`;
document.head.append(notesTimelineWidthStyle);
const notesTimelineDarkContrastStyle=document.createElement('style');
notesTimelineDarkContrastStyle.textContent=`
@media (prefers-color-scheme:dark){#notesTimeline .notes-timeline-list::before{background:#a1a1a6!important;opacity:1!important}#notesTimeline .timeline-stamp{color:#f2f2f7!important}#notesTimeline .timeline-dot{display:block!important;background:#0a84ff!important;border-color:#1c1c1e!important;box-shadow:0 0 0 1px #64b5ff!important}}
`;
document.head.append(notesTimelineDarkContrastStyle);
const notesTimelineContinuousLineStyle=document.createElement('style');
notesTimelineContinuousLineStyle.textContent=`
#notesTimeline .notes-timeline-list::before{display:none}#notesTimeline .timeline-entry::after{content:'';position:absolute;z-index:0;left:57.5px;top:13px;bottom:-14px;width:1px;background:#c7c7cc}#notesTimeline .timeline-entry:last-child::after{display:none}@media (prefers-color-scheme:dark){#notesTimeline .timeline-entry::after{background:#a1a1a6!important}}
`;
document.head.append(notesTimelineContinuousLineStyle);
const notesTimelineScrollStyle=document.createElement('style');
notesTimelineScrollStyle.textContent=`
body.notes-timeline-active{overflow:hidden}body.notes-timeline-active header{position:relative;z-index:5;background:#f2f2f7}#notesTimeline.active{position:fixed;z-index:1;top:var(--notes-timeline-top,112px);bottom:54px;left:50%;display:flex;width:min(680px,calc(100vw - 32px));min-height:0;transform:translateX(-50%);flex-direction:column}.notes-timeline-tools{flex:0 0 auto;margin:0;padding:2px 0 12px;background:#f2f2f7}.notes-timeline-list{min-height:0;flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;padding:0 0 16px}@media (prefers-color-scheme:dark){body.notes-timeline-active header,.notes-timeline-tools{background:#000}}@media (min-width:700px){#notesTimeline.active{bottom:56px}.desktop-app #notesTimeline.active{width:min(680px,calc(100vw - 32px))}}
`;
document.head.append(notesTimelineScrollStyle);
const compactHeaderTitleStyle=document.createElement('style');
compactHeaderTitleStyle.textContent=`header h1{font-size:28px!important;letter-spacing:-.6px!important}`;
document.head.append(compactHeaderTitleStyle);
const compactMobileNavStyle=document.createElement('style');
compactMobileNavStyle.textContent=`@media (max-width:699px){nav{padding-left:0!important;padding-right:0!important}nav button{letter-spacing:-.45px}nav button svg{width:19px;height:19px}nav button span{font-size:9px!important}}`;
document.head.append(compactMobileNavStyle);
const compactPageTopSpacingStyle=document.createElement('style');
compactPageTopSpacingStyle.textContent=`#diary.active>.quote-card{margin-top:4px}#notesTimeline.active .notes-timeline-tools{padding-top:0}`;
document.head.append(compactPageTopSpacingStyle);
const headerStatStyle=document.createElement('style');
headerStatStyle.textContent=`header{position:relative}#headerStat{position:absolute;right:auto;bottom:20px;color:#8e8e93;font-size:12px;line-height:1;font-weight:400;white-space:nowrap}@media (prefers-color-scheme:dark){#headerStat{color:#98989d}}`;
document.head.append(headerStatStyle);
window.updateNotesTimelineLayout=()=>{let header=document.querySelector('header'),page=document.querySelector('#notesTimeline');if(!header||!page)return;page.style.setProperty('--notes-timeline-top',`${Math.ceil(header.getBoundingClientRect().bottom)+4}px`)};
window.addEventListener('resize',()=>{if(document.body.classList.contains('notes-timeline-active'))window.updateNotesTimelineLayout()});
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
notesTimelineOwnContentStyle.textContent=`.timeline-text{color:#000;font-size:14px;line-height:1.76;letter-spacing:.01em;text-align:left}.timeline-text .timeline-category{margin:0 0 10px;padding:4px 8px;border-radius:7px;background:#eaf3ff;color:#007aff;font-size:12px;font-weight:600;letter-spacing:0;text-align:left}.timeline-text .timeline-body{white-space:pre-wrap;overflow-wrap:anywhere}.timeline-text .timeline-body.timeline-collapsed{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:4;white-space:pre-wrap}@media (prefers-color-scheme:dark){.timeline-text{color:#f2f2f7}.timeline-text .timeline-category{background:#12395c;color:#8fc9ff}}`;
document.head.append(notesTimelineOwnContentStyle);
const timelineDate=iso=>new Date(iso).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
const timelineWeekday=iso=>new Date(iso).toLocaleDateString('zh-CN',{weekday:'short'});
const timelineTime=iso=>new Date(iso).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
const timelineText=text=>{let lines=(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean),category=/^【[^】]+】$/.test(lines[0]||'')?lines.shift():'';return `<div class="timeline-text">${category?`<div class="timeline-category">${esc(category)}</div>`:''}<div class="timeline-body">${esc(lines.join('\n'))}</div></div>`};
async function renderTimelineImages(note,holder){
  let images=await getNoteImages(note.id);if(!holder.isConnected||!images.length)return;
  holder.innerHTML=images.map((image,index)=>`<button type="button" data-index="${index}" aria-label="查看原图"><img src="${URL.createObjectURL(image.blob)}" alt="随手记图片 ${index+1}"></button>`).join('');
  holder.querySelectorAll('button').forEach(button=>button.onclick=()=>openNoteImage(images[+button.dataset.index].blob));
}
window.renderNotesTimeline=async function(){
  updateHeaderStat?.('notesTimeline');
  let input=$('#notesTimelineSearch'),term=(input?.value||'').trim().toLowerCase();
  let list=notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(note=>!term||`${note.text||''} ${(note.template||'')}`.toLowerCase().includes(term));
  let root=$('#notesTimelineList');
  if(!list.length){root.innerHTML=`<p class="empty">${term?'没有匹配的随手记。':'还没有随手记。'}</p>`;return}
  root.innerHTML=list.map(note=>`<article class="timeline-entry" data-note-id="${note.id}"><div class="timeline-stamp"><b>${timelineDate(note.createdAt)}</b><span>${timelineWeekday(note.createdAt)}</span><time>${timelineTime(note.createdAt)}</time></div><i class="timeline-dot" aria-hidden="true"></i><div class="timeline-card">${timelineText(note.text)}<div class="timeline-images"></div></div></article>`).join('');
  for(let note of list){
    let entry=root.querySelector(`.timeline-entry[data-note-id="${note.id}"]`),holder=entry.querySelector('.timeline-images'),textBlock=entry.querySelector('.timeline-body');
    // Measure after layout: a single long paragraph needs collapsing too.
    requestAnimationFrame(()=>{
      if(!textBlock?.isConnected||textBlock.scrollHeight<=99)return;
      textBlock.classList.add('timeline-collapsed');
      let expand=document.createElement('button');expand.type='button';expand.className='timeline-expand';expand.textContent='展开全文';
      expand.onclick=()=>{let collapsed=textBlock.classList.toggle('timeline-collapsed');expand.textContent=collapsed?'展开全文':'收起';};
      textBlock.after(expand);
    });
    renderTimelineImages(note,holder);
  }
};
$('#notesTimelineSearch').oninput=()=>window.renderNotesTimeline();
