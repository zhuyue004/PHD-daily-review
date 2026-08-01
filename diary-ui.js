let diaries=JSON.parse(localStorage.getItem('phd-diary-records')||'[]');
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
  $('#quoteSource').textContent=quote.source;
  $('#diaryDate').textContent=fmt(day());
  $('#diaryInput').value=today?.text||'';
  let recent=diaries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
  $('#diaryList').innerHTML=recent.length?recent.map(item=>`<div class="swipe-row diary-swipe" data-id="${item.id}"><button class="delete-record delete-diary" aria-label="删除 ${fmt(item.date)} 的日记">删除</button><div class="diary-row"><time>${fmt(item.date)}</time><p>${esc(item.text)}</p></div></div>`).join(''):'<p class="empty">还没有日记。从今天开始写下值得记住的事。</p>';
  bindDiaryRows();
}

function viewDiary(entry){
  $('#detail').innerHTML=`<section class="diary-detail"><p class="diary-detail-label">日记 · 只读</p><h2>${fmt(entry.date)}</h2><div class="detail-item"><p>${esc(entry.text).replace(/\n/g,'<br>')}</p></div></section>`;
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
    card.onclick=()=>{
      if(row.classList.contains('swiped')){row.classList.remove('swiped');return}
      viewDiary(diaries.find(item=>item.id===row.dataset.id));
    };
    row.addEventListener('pointerdown',event=>{start=event.clientX;delta=0;row.setPointerCapture?.(event.pointerId)});
    row.addEventListener('pointermove',event=>{
      if(!start)return;
      delta=Math.min(0,Math.max(-84,event.clientX-start));
      if(delta<0)card.style.transform=`translateX(${delta}px)`;
    });
    row.addEventListener('pointerup',()=>{
      if(!start)return;
      card.style.transform='';
      row.classList.toggle('swiped',delta<-42);
      start=0;
    });
    row.addEventListener('pointercancel',()=>{card.style.transform='';start=0});
  });
}

$('#saveDiary').onclick=()=>{
  let text=$('#diaryInput').value.trim(),index=diaries.findIndex(item=>item.date===day());
  if(!text){
    if(index>=0){diaries.splice(index,1);saveDiaries();renderDiary()}
    return;
  }
  let entry={id:index>=0?diaries[index].id:crypto.randomUUID(),date:day(),text,updatedAt:new Date().toISOString()};
  if(index>=0)diaries[index]=entry;else diaries.push(entry);
  saveDiaries();
  renderDiary();
};
