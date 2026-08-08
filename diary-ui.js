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
let diaryHistoryDate=day();
function diaryParagraphs(text){return indentDiary(text).split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${esc(line.trim().replace(/^　　/,''))}</p>`).join('')}
const diaryPosition=()=>new Promise(resolve=>{if(!navigator.geolocation)return resolve(null);navigator.geolocation.getCurrentPosition(position=>resolve(position),()=>resolve(null),{enableHighAccuracy:false,timeout:8000,maximumAge:300000})});
async function diaryPlace(){let position=await diaryPosition();if(!position)return '';try{let {latitude,longitude}=position.coords,response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=zh-CN`);if(!response.ok)return '';let address=(await response.json()).address||{};return [address.state,address.city||address.town||address.village,address.county||address.city_district,address.suburb,address.neighbourhood,address.road,address.building,address.amenity].filter((value,index,list)=>value&&list.indexOf(value)===index).join(' · ')}catch{return ''}}
let diaryPickerMonth=new Date();
function renderDiaryCalendar(){let panel=$('#diaryCalendar'),year=diaryPickerMonth.getFullYear(),month=diaryPickerMonth.getMonth(),first=(new Date(year,month,1).getDay()+6)%7,total=new Date(year,month+1,0).getDate(),dates=new Set(diaries.map(item=>item.date)),cells=[];for(let index=0;index<first;index++)cells.push('<button class="blank" disabled></button>');for(let date=1;date<=total;date++){let value=localDay(new Date(year,month,date));cells.push(`<button class="${dates.has(value)?'has-diary':''}" data-diary-date="${value}" type="button">${date}</button>`)}panel.innerHTML=`<div class="calendar-head"><button id="diaryPrevMonth" type="button">‹</button><b>${year} 年 ${month+1} 月</b><button id="diaryNextMonth" type="button">›</button></div><div class="calendar-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div><div class="calendar-grid">${cells.join('')}</div><p class="calendar-legend"><i></i>有日记</p>`;$('#diaryPrevMonth').onclick=()=>{diaryPickerMonth=new Date(year,month-1,1);renderDiaryCalendar()};$('#diaryNextMonth').onclick=()=>{diaryPickerMonth=new Date(year,month+1,1);renderDiaryCalendar()};$$('[data-diary-date]').forEach(button=>button.onclick=()=>{let value=button.dataset.diaryDate,entry=diaries.find(item=>item.date===value);$('#diaryCalendar').classList.add('hidden');if(entry)viewDiary(entry);else alert('这一天还没有日记。')})}
function ensureDiaryHistory(){if($('#diaryHistory'))return;let section=document.createElement('section');section.id='diaryHistory';section.className='diary-history';section.innerHTML='<div class="archive-date-control"><span>按日期查看</span><button id="diaryDateButton" class="plain" type="button"></button></div><div id="diaryCalendar" class="archive-calendar diary-calendar hidden"></div>';let editor=$('.diary-editor');editor.insertAdjacentElement('afterend',section);$('#diaryDateButton').onclick=()=>{let panel=$('#diaryCalendar');panel.classList.toggle('hidden');if(!panel.classList.contains('hidden')){diaryPickerMonth=new Date();renderDiaryCalendar()}}}

function renderDiary(){
  ensureDiaryHistory();
  let quote=quoteForToday();
  let today=diaries.find(item=>item.date===day());
  $('#quoteText').textContent=quote.text;
  $('#quoteSource').textContent=quote.source.replace(/（[^）]*）/g,'');
  $('#diaryDate').textContent=fmt(day());
  $('#diaryInput').value=today?indentDiary(today.text):INDENT;
  $('#diaryDateButton').textContent=fmt(day());
  $('#diary > h2').textContent='最近 7 天日记';
  let cutoff=new Date();cutoff.setDate(cutoff.getDate()-6);let recent=diaries.filter(item=>item.date>=localDay(cutoff)).sort((a,b)=>b.date.localeCompare(a.date));
  $('#diaryList').innerHTML=recent.length?recent.map(item=>`<div class="swipe-row diary-swipe" data-id="${item.id}"><button class="delete-record delete-diary" aria-label="删除 ${fmt(item.date)} 的日记">删除</button><div class="diary-row"><time>${fmt(item.date)}</time><p>${esc(diaryPreview(item.text))}</p></div></div>`).join(''):'<p class="empty">还没有日记。从今天开始写下值得记住的事。</p>';
  bindDiaryRows();
}

function viewDiary(entry){
  let paragraphs=indentDiary(entry.text).split(/\r?\n/).filter(line=>line.trim()).map(line=>`<p>${esc(line.trim().replace(/^　　/,''))}</p>`).join('');
  $('#detail').innerHTML=`<section class="diary-detail"><p class="diary-detail-label">日记 · 只读</p><h2>${fmt(entry.date)}</h2><div class="detail-item">${paragraphs}${entry.place?`<p class="diary-place">记录地点：${esc(entry.place)}</p>`:''}</div></section>`;
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

$('#saveDiary').onclick=async()=>{
  let raw=$('#diaryInput').value,index=diaries.findIndex(item=>item.date===day());
  if(!raw.replace(/　/g,'').trim()){
    if(index>=0){diaries.splice(index,1);saveDiaries();renderDiary()}
    return;
  }
  let button=$('#saveDiary'),oldText=button.textContent;button.disabled=true;button.textContent='正在记录地点…';let text=indentDiary(raw).replace(/\n+$/,''),place=await diaryPlace()||(index>=0?diaries[index].place||'':'');button.disabled=false;button.textContent=oldText;
  let entry={id:index>=0?diaries[index].id:crypto.randomUUID(),date:day(),text,place,updatedAt:new Date().toISOString()};
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

$('#preferences article:last-child p').textContent='记录保存在本设备浏览器内。保存日记时可请求定位，并仅保存解析后的地点名称；为将位置转为地名，会临时访问地图服务，不保存经纬度。';
