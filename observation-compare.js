document.querySelector('#close').onclick=()=>window.observationCompare.close();
document.addEventListener('keydown',event=>{if(event.key==='Escape')window.observationCompare.close()});
window.observationCompare.onData(data=>{
  document.querySelector('#title').textContent=data.title||'未命名观察';
  const render=window.renderObservationComparisonText||((value)=>String(value??''));
  document.querySelector('#original').innerHTML=render(data.originalText===null?'旧记录未留存首次原文':data.originalText);
  document.querySelector('#originalNote').textContent=data.originalSource==='legacy-baseline'?'旧记录：从首次再次编辑前的版本开始保留':'';
  document.querySelector('#analysis').innerHTML=render(data.analysis||'尚未填写分析');
  document.querySelector('#revised').innerHTML=render(data.text||'');
});
