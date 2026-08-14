const baseHome=home,goalCard=$('.goal-card'),goalList=$('#goalList'),goalInput=$('#homeGoals'),editGoals=$('#editHomeGoals'),saveGoals=$('#saveHomeGoals'),cancelGoals=$('#cancelHomeGoals');
let suppressGoalClick=false;

home=()=>{baseHome();renderGoalList()};

function currentGoalText(){return records.find(r=>r.date===day())?.goals||previousTomorrow()}
function goalLines(text=currentGoalText()){return text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean)}
function todayGoalRecord(){return records.find(r=>r.date===day())}

function renderGoalList(){
  let record=todayGoalRecord(),lines=goalLines(),checks=record?.goalChecks||[];
  goalList.innerHTML=lines.length?lines.map((line,index)=>`<button type="button" class="goal-item ${checks[index]?'done':''}" data-index="${index}"><i>${checks[index]?'✓':''}</i><span>${esc(line)}</span></button>`).join(''):'<p class="goal-empty">点击“编辑今日目标”添加今天的目标。</p>';
  $$('.goal-item').forEach(button=>{
    button.onclick=event=>{
      if(suppressGoalClick){event.preventDefault();return}
      toggleGoal(+button.dataset.index);
    };
    enableGoalSorting(button);
  });
}

function toggleGoal(index){
  let text=currentGoalText(),lines=goalLines(text),record=todayGoalRecord();
  if(!record){record={id:crypto.randomUUID(),date:day(),goals:text,goalChecks:lines.map(()=>false)};records.push(record)}
  record.goalChecks=lines.map((_,i)=>i===index?!record.goalChecks?.[i]:!!record.goalChecks?.[i]);
  record.updatedAt=new Date().toISOString();
  save();renderGoalList();
}

function saveGoalOrder(){
  let order=[...goalList.querySelectorAll('.goal-item')].map(button=>+button.dataset.index),lines=goalLines(),checks=todayGoalRecord()?.goalChecks||[];
  if(order.every((value,index)=>value===index))return;
  let record=todayGoalRecord();
  if(!record){record={id:crypto.randomUUID(),date:day(),goals:currentGoalText(),goalChecks:lines.map(()=>false)};records.push(record)}
  record.goals=order.map(index=>lines[index]).join('\n');
  record.goalChecks=order.map(index=>!!checks[index]);
  record.updatedAt=new Date().toISOString();
  save();renderGoalList();
}

function moveGoalItem(button,next){
  let before=new Map([...goalList.querySelectorAll('.goal-item')].map(item=>[item,item.getBoundingClientRect().top]));
  if(next)goalList.insertBefore(button,next);else goalList.append(button);
  [...goalList.querySelectorAll('.goal-item')].forEach(item=>{
    if(item===button)return;
    let delta=before.get(item)-item.getBoundingClientRect().top;
    if(!delta)return;
    item.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});
  });
}

function enableGoalSorting(button){
  let timer,pointerId,sorting=false,startY=0,tracking=false;
  const cancelTimer=()=>{if(timer){clearTimeout(timer);timer=null}};
  const stopTracking=()=>{if(!tracking)return;tracking=false;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish)};
  const move=event=>{
    if(event.pointerId!==pointerId)return;
    if(!sorting){if(Math.abs(event.clientY-startY)>8){cancelTimer();stopTracking()}return}
    event.preventDefault();
    let siblings=[...goalList.querySelectorAll('.goal-item')].filter(item=>item!==button),next=siblings.find(item=>{let rect=item.getBoundingClientRect();return event.clientY<rect.top+rect.height/2});
    if((next&&button.nextElementSibling!==next)||(!next&&button!==goalList.lastElementChild))moveGoalItem(button,next);
  };
  const finish=event=>{
    if(event.pointerId!==pointerId)return;
    cancelTimer();stopTracking();
    if(!sorting)return;
    sorting=false;button.classList.remove('sorting');suppressGoalClick=true;
    setTimeout(()=>suppressGoalClick=false,80);saveGoalOrder();
  };
  button.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    pointerId=event.pointerId;startY=event.clientY;tracking=true;
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
    timer=setTimeout(()=>{sorting=true;button.classList.add('sorting');navigator.vibrate?.(10)},450);
  });
}

function setEditing(editing){
  goalCard.classList.toggle('editing',editing);goalInput.hidden=!editing;saveGoals.hidden=!editing;cancelGoals.hidden=!editing;
  if(editing){goalInput.value=currentGoalText();goalInput.focus()}else renderGoalList();
}

editGoals.onclick=()=>setEditing(true);
cancelGoals.onclick=()=>setEditing(false);
saveGoals.onclick=()=>{
  let value=goalInput.value.trim(),oldLines=goalLines(currentGoalText()),oldChecks=todayGoalRecord()?.goalChecks||[],newLines=goalLines(value),index=records.findIndex(r=>r.date===day()),record=index<0?{id:crypto.randomUUID(),date:day()}:{...records[index]};
  record.goals=value;
  record.goalChecks=newLines.map((line,i)=>oldLines[i]===line?!!oldChecks[i]:false);
  record.updatedAt=new Date().toISOString();
  if(index<0)records.push(record);else records[index]=record;
  save();setEditing(false);home();
};

home();
