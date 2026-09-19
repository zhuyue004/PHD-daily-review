// 洞见计划：按周（周一开始）或按自然月独立保存，并随云端完整备份同步。
const INSIGHT_PLANS_KEY='phd-insight-plans';
const planNow=()=>new Date().toISOString();
function normalizeInsightPlans(value){
  let source=value&&typeof value==='object'?value:{};
  let clean=kind=>Object.fromEntries(Object.entries(source[kind]||{}).map(([key,entry])=>{
    let items=Array.isArray(entry?.items)?entry.items.filter(item=>item&&item.id).map(item=>({id:item.id,text:String(item.text||''),done:!!item.done,createdAt:item.createdAt||entry?.updatedAt||'',updatedAt:item.updatedAt||entry?.updatedAt||''})):[];
    return [key,{updatedAt:entry?.updatedAt||'',items}];
  }));
  return {week:clean('week'),month:clean('month')};
}
let insightPlans=normalizeInsightPlans(JSON.parse(localStorage.getItem(INSIGHT_PLANS_KEY)||'{}'));
function saveInsightPlans(){localStorage.setItem(INSIGHT_PLANS_KEY,JSON.stringify(insightPlans));window.scheduleCloudSync?.()}
function mergeInsightPlans(local,remote){
  let left=normalizeInsightPlans(local),right=normalizeInsightPlans(remote),merged={week:{},month:{}};
  for(let kind of ['week','month'])for(let key of new Set([...Object.keys(left[kind]),...Object.keys(right[kind])])){let a=left[kind][key],b=right[kind][key];merged[kind][key]=!a?b:!b?a:(Date.parse(b.updatedAt||0)>Date.parse(a.updatedAt||0)?b:a)}
  return normalizeInsightPlans(merged);
}
function setInsightPlans(value,{sync=true}={}){insightPlans=normalizeInsightPlans(value);localStorage.setItem(INSIGHT_PLANS_KEY,JSON.stringify(insightPlans));if(sync)window.scheduleCloudSync?.()}
window.getInsightPlansForSync=()=>normalizeInsightPlans(insightPlans);
// Applying a cloud snapshot is not a new local edit. Keep it silent so a
// completed pull cannot schedule another pull forever.
window.mergeInsightPlansFromCloud=remote=>setInsightPlans(mergeInsightPlans(insightPlans,remote),{sync:false});
window.restoreInsightPlans=(restored,mode,restoredAt)=>{if(!restored)return 0;let stamped=normalizeInsightPlans(restored);for(let kind of ['week','month'])for(let entry of Object.values(stamped[kind])){entry.updatedAt=restoredAt;entry.items.forEach(item=>item.updatedAt=restoredAt)}setInsightPlans(mode==='replace'?stamped:mergeInsightPlans(insightPlans,stamped));return Object.values(stamped.week).reduce((count,item)=>count+item.items.length,0)+Object.values(stamped.month).reduce((count,item)=>count+item.items.length,0)};
window.insightPlanExportRows=()=>['week','month'].flatMap(kind=>Object.entries(insightPlans[kind]).flatMap(([key,entry])=>entry.items.map(item=>({周期:kind==='week'?'周计划':'月计划',范围:key.replace(/^week:/,'').replace(/^month:/,''),状态:item.done?'已完成':'待完成',计划:item.text,更新时间:item.updatedAt||entry.updatedAt||''}))));

function currentPlanEntry(bounds){let kind=insightMode==='week'?'week':'month',entry=insightPlans[kind][bounds.key]||{items:[],updatedAt:''};return {kind,entry:{...entry,items:[...(entry.items||[])]}}}
function writePlan(bounds,kind,entry){insightPlans[kind][bounds.key]={...entry,updatedAt:planNow()};saveInsightPlans()}
function renderInsightPlan(bounds){
  // 保存、删除和勾选都会局部重绘；先替换旧卡片，避免短暂叠出第二张计划卡。
  $('#insightPlan')?.remove();
  let {kind,entry}=currentPlanEntry(bounds),title=kind==='week'?'本周计划':'本月计划',total=entry.items.length,done=entry.items.filter(item=>item.done).length;
  let section=document.createElement('article');section.className='insight-plan-card';section.id='insightPlan';
  section.innerHTML=`<h2 class="insight-section-title">${title}</h2><p class="plan-intro">先写清想完成什么，再在复盘中回看结果。</p><div class="plan-progress"><b>${done} / ${total}</b><span>${total?'已完成':'添加 1–5 个关键条目'}</span></div><ul class="insight-plan-list">${entry.items.map(item=>`<li data-plan-id="${item.id}" class="${item.done?'done':''}"><button class="plan-toggle" type="button" aria-label="${item.done?'标记为未完成':'标记为已完成'}">${item.done?'✓':''}</button><span>${esc(item.text)}</span><button class="plain edit-plan" type="button">编辑</button></li>`).join('')}</ul><button class="plain add-plan" type="button">＋ 添加条目</button>`;
  section.querySelector('.add-plan').onclick=()=>{
    // 新增时只在当前卡片中打开编辑器；点击保存前不写入本地或云端。
    let list=section.querySelector('.insight-plan-list'),existing=list.querySelector('.plan-new-form');
    if(existing){existing.querySelector('textarea')?.focus();return}
    let form=document.createElement('li');form.className='plan-new-form';
    form.innerHTML='<textarea class="plan-edit-input" placeholder="写下这一周期最重要的计划…"></textarea><div><button class="save-new-plan" type="button">保存</button><button class="plain cancel-new-plan" type="button">取消</button></div>';
    list.append(form);let input=form.querySelector('textarea');input.focus();
    form.querySelector('.save-new-plan').onclick=()=>{let text=input.value.trim();if(!text){input.focus();return}let now=planNow();entry.items.push({id:crypto.randomUUID(),text,done:false,createdAt:now,updatedAt:now});writePlan(bounds,kind,entry);renderInsightPlan(bounds)};
    form.querySelector('.cancel-new-plan').onclick=()=>form.remove();
  };
  section.querySelectorAll('.plan-toggle').forEach(button=>button.onclick=()=>{let item=entry.items.find(value=>value.id===button.closest('li').dataset.planId);if(!item)return;item.done=!item.done;item.updatedAt=planNow();writePlan(bounds,kind,entry);renderInsightPlan(bounds)});
  section.querySelectorAll('.edit-plan').forEach(button=>button.onclick=()=>{let row=button.closest('li'),item=entry.items.find(value=>value.id===row.dataset.planId);if(!item||row.classList.contains('editing'))return;row.classList.add('editing');row.innerHTML=`<textarea class="plan-edit-input">${esc(item.text)}</textarea><div><button class="save-plan" type="button">保存</button><button class="plain delete-plan" type="button">删除</button></div>`;let input=row.querySelector('textarea');input.focus();input.setSelectionRange(input.value.length,input.value.length);row.querySelector('.save-plan').onclick=()=>{let text=input.value.trim();if(!text)return row.querySelector('.delete-plan').click();item.text=text;item.updatedAt=planNow();writePlan(bounds,kind,entry);renderInsightPlan(bounds)};row.querySelector('.delete-plan').onclick=()=>{entry.items=entry.items.filter(value=>value.id!==item.id);writePlan(bounds,kind,entry);renderInsightPlan(bounds)}});
  $('#summary')?.closest('article')?.before(section);
}
// 周一及每月 1 日承接上一周期的「行动重点」。只追加一次，不改动本期已有推进。
function previousInsightPeriod(bounds){
  let kind=bounds.key.startsWith('week:')?'week':'month',start=insightDate(bounds.start),previousStart,previousEnd=new Date(start);
  previousEnd.setDate(previousEnd.getDate()-1);
  if(kind==='week'){previousStart=new Date(start);previousStart.setDate(previousStart.getDate()-7)}
  else previousStart=new Date(previousEnd.getFullYear(),previousEnd.getMonth(),1);
  return {kind,key:`${kind}:${dateKey(previousStart)}`,start:previousStart,end:previousEnd};
}
function previousActionItems(period){
  let state=insightState()[period.key]?.tomorrow||{},removed=new Set(state.removed||[]),rows=insightRows(period);
  let automatic=summaryItems(rows,'tomorrow').slice(0,10).filter(item=>!removed.has(`${item.date}:${item.index}`)).map(item=>({id:`${item.date}:${item.index}`,text:state.changes?.[`${item.date}:${item.index}`]??item.text}));
  return [...automatic,...(state.added||[])].filter(item=>item.text?.trim()&&item.text.trim()!=='新建条目');
}
function ensureInsightCarryover(bounds){
  if(insightDate(dateKey(new Date()))<bounds.start)return;
  let previous=previousInsightPeriod(bounds),all=insightState(),current=all[bounds.key]||{};
  if(current.carryoverApplied===previous.key)return;
  let source=previousActionItems(previous);
  if(!source.length)return;
  let completed=current.completed||{removed:[],changes:{},added:[]};completed.added=[...(completed.added||[])];
  let existing=new Set(completed.added.map(item=>String(item.text||'').trim()));
  for(let item of source){let text=item.text.trim(),id=`carry:${previous.key}:${item.id}`;if(existing.has(text))continue;completed.added.push({id,text});existing.add(text)}
  current.completed=completed;current.carryoverApplied=previous.key;all[bounds.key]=current;saveInsightState(all);
}
const renderSummaryBeforeCarryover=renderPeriodSummary;
renderPeriodSummary=function(rows,period,label){
  let bounds=insightBounds();
  if(bounds.key===period)ensureInsightCarryover(bounds);
  renderSummaryBeforeCarryover(rows,period,label);
  let month=period.startsWith('month:');
  $('#summary .summary-group[data-group="completed"] h3').textContent=month?'本月推进':'本周推进';
  $('#summary .summary-group[data-group="tomorrow"] h3').textContent=month?'下月行动重点':'下周行动重点';
  $('#summary').querySelectorAll('.summary-group[data-group="completed"] .summary-item[data-id^="carry:"]').forEach(row=>{
    let label=document.createElement('time');label.textContent=month?'承接自上月 · 待推进':'承接自上周 · 待推进';row.querySelector('span')?.after(label);
  });
};
const insightPlansDashboard=insights;
insights=function(){insightPlansDashboard();let toolbar=$('#insights .segmented');if(toolbar){let buttons=$$('[data-insight-mode]',toolbar);if(buttons[0])buttons[0].textContent='周视图';if(buttons[1])buttons[1].textContent='月视图'}$('#summary')?.closest('article')?.querySelector('h2')?.classList.add('insight-section-title');renderInsightPlan(insightBounds())};
