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
@media (prefers-color-scheme:dark){.notes-timeline-list::before{background:#8e8e93!important}.timeline-stamp{color:#d1d1d6!important}.timeline-dot{background:#0a84ff!important;border-color:#1c1c1e!important;box-shadow:0 0 0 1px #64b5ff!important}}
`;
document.head.append(notesTimelineDarkContrastStyle);
const timelineDate=iso=>new Date(iso).toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
const timelineWeekday=iso=>new Date(iso).toLocaleDateString('zh-CN',{weekday:'short'});
const timelineTime=iso=>new Date(iso).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
async function renderTimelineImages(note,holder){
  let images=await getNoteImages(note.id);if(!holder.isConnected||!images.length)return;
  holder.innerHTML=images.map((image,index)=>`<button type="button" data-index="${index}" aria-label="查看原图"><img src="${URL.createObjectURL(image.blob)}" alt="随手记图片 ${index+1}"></button>`).join('');
  holder.querySelectorAll('button').forEach(button=>button.onclick=()=>openNoteImage(images[+button.dataset.index].blob));
}
window.renderNotesTimeline=async function(){
  let input=$('#notesTimelineSearch'),term=(input?.value||'').trim().toLowerCase();
  let list=notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(note=>!term||`${note.text||''} ${(note.template||'')}`.toLowerCase().includes(term));
  let root=$('#notesTimelineList');
  if(!list.length){root.innerHTML=`<p class="empty">${term?'没有匹配的随手记。':'还没有随手记。'}</p>`;return}
  root.innerHTML=list.map(note=>`<article class="timeline-entry" data-note-id="${note.id}"><div class="timeline-stamp"><b>${timelineDate(note.createdAt)}</b><span>${timelineWeekday(note.createdAt)}</span><time>${timelineTime(note.createdAt)}</time></div><i class="timeline-dot" aria-hidden="true"></i><div class="timeline-card">${noteContent(note.text)}<div class="timeline-images"></div></div></article>`).join('');
  for(let note of list){
    let entry=root.querySelector(`.timeline-entry[data-note-id="${note.id}"]`),content=entry.querySelector('.note-lines'),holder=entry.querySelector('.timeline-images');
    let firstLine=content?.querySelector('li');if(firstLine&&/^【[^】]+】$/.test(firstLine.textContent.trim()))firstLine.classList.add('timeline-category');
    if(content&&content.scrollHeight>205){
      content.classList.add('timeline-collapsed');
      let expand=document.createElement('button');expand.type='button';expand.className='timeline-expand';expand.textContent='展开全文';
      expand.onclick=()=>{let collapsed=content.classList.toggle('timeline-collapsed');expand.textContent=collapsed?'展开全文':'收起';};
      content.after(expand);
    }
    renderTimelineImages(note,holder);
  }
};
$('#notesTimelineSearch').oninput=()=>window.renderNotesTimeline();
