let diaries=JSON.parse(localStorage.getItem('phd-diary-records')||'[]');
const INDENT='　　';
const indentDiary=text=>(text||'').split(/\r?\n/).map(line=>line.trim()?`${INDENT}${line.trim().replace(/^　　/,'')}`:'').join('\n');
const diaryPreview=text=>(text||'').split(/\r?\n/).find(line=>line.trim())?.trim().replace(/^　　/,'')||'';
function quoteForToday(){
  let date=new Date(`${day()}T12:00:00`),year=date.getFullYear(),month=date.getMonth(),dateOfMonth=date.getDate();
  if(month===1&&dateOfMonth===29)return LEAP_DAY_QUOTE;
  let index=Math.floor((date-new Date(year,0,1,12))/86400000);
  if(new Date(year,1,29).getMonth()===1&&month>1)index--;
  return YEAR_QUOTES[index];
}
const saveDiaries=()=>localStorage.setItem('phd-diary-records',JSON.stringify(diaries));
const basePage=page;
page=id=>{basePage(id);if(id==='diary')renderDiary()};

function renderDiary(){
  let quote=quoteForToday();
  let today=diaries.find(item=>item.date===day());
  $('#quoteText').textContent=quote.text;
  $('#quoteSource').textContent=quote.source.replace(/（[^）]*）/g,'');
  $('#diaryDate').textContent=fmt(day());
  $('#diaryInput').value=today?indentDiary(today.text):INDENT;
  let recent=diaries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
  $('#diaryList').innerHTML=recent.length?recent.map(item=>`<div class="swipe-row diary-swipe" data-id="${item.id}"><button class="delete-record delete-diary" aria-label="删除 ${fmt(item.date)} 的日记">删除</button><div class="diary-row"><time>${fmt(item.date)}</time><p>${esc(diaryPreview(item.text))}</p></div></div>`).join(''):'<p class="empty">还没有日记。从今天开始写下值得记住的事。</p>';
  bindDiaryRows();
}

function viewDiary(entry){
  let paragraphs=indentDiary(entry.text).split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${esc(line.trim().replace(/^　　/,''))}</p>`).join('');
  $('#detail').innerHTML=`<section class="diary-detail"><p class="diary-detail-label">日记 · 只读</p><h2>${fmt(entry.date)}</h2><div class="detail-item">${paragraphs}</div></section>`;
  $('#modal').classList.remove('hidden');
}

function bindDiaryRows(){
  $$('.delete-diary').forEach(button=>button.onclick=()=>{
    let id=button.closest('.diary-swipe').dataset.id;
    if(confirm('确定删除这篇日记吗？此操作无法撤销。')){
      diaries=diaries.filter(item=>item.id!==id);
      saveDiaries();
      renderDiary();
    }
  });
  $$('.diary-swipe').forEach(row=>{
    let start=0,delta=0,card=row.querySelector('.diary-row');
    row.addEventListener('pointerdown',event=>{start=event.clientX;delta=0;row.setPointerCapture?.(event.pointerId)});
    row.addEventListener('pointermove',event=>{
      if(!start)return;
      delta=Math.min(0,Math.max(-84,event.clientX-start));
      if(delta<0)card.style.transform=`translateX(${delta}px)`;
    });
    row.addEventListener('pointerup',()=>{
      if(!start)return;
      card.style.transform='';
      if(row.classList.contains('swiped')&&delta>-12){row.classList.remove('swiped');start=0;return}
      if(delta<-42)row.classList.add('swiped');
      else viewDiary(diaries.find(item=>item.id===row.dataset.id));
      start=0;
    });
    row.addEventListener('pointercancel',()=>{card.style.transform='';start=0});
  });
}

$('#saveDiary').onclick=()=>{
  let raw=$('#diaryInput').value,index=diaries.findIndex(item=>item.date===day());
  if(!raw.replace(/　/g,'').trim()){
    if(index>=0){diaries.splice(index,1);saveDiaries();renderDiary()}
    return;
  }
  let text=indentDiary(raw).replace(/\n+$/,'');
  let entry={id:index>=0?diaries[index].id:crypto.randomUUID(),date:day(),text,updatedAt:new Date().toISOString()};
  if(index>=0)diaries[index]=entry;else diaries.push(entry);
  saveDiaries();
  renderDiary();
};

$('#diaryInput').addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing)return;
  event.preventDefault();
  let input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd,before=input.value.slice(0,start),after=input.value.slice(end),insert='\n　　';
  input.value=before+insert+after;
  input.selectionStart=input.selectionEnd=start+insert.length;
});

$('#diaryInput').addEventListener('focus',event=>{
  let input=event.currentTarget;
  if(!input.value.trim()){
    input.value=INDENT;
    input.selectionStart=input.selectionEnd=INDENT.length;
  }
});
