// Keep already rendered desktop tabs until their underlying records or picker
// state change. The mobile app keeps its existing render lifecycle.
if(window.phdDesktop){
  const versions={records:0,notes:0,diaries:0,observations:0};
  window.desktopDataVersion=kind=>versions[kind]||0;
  window.desktopDataChanged=kind=>{
    if(kind==='all')for(let key of Object.keys(versions))versions[key]++;
    else if(kind in versions)versions[kind]++;
  };
  function keepRendered(name,keyFor){
    let render=window[name],lastKey;
    if(typeof render!=='function')return;
    window[name]=function(...args){
      let key=keyFor();
      if(key===lastKey)return;
      lastKey=key;
      try{return render.apply(this,args)}catch(error){lastKey=undefined;throw error}
    };
  }
  keepRendered('home',()=>`${day()}|${versions.records}|${versions.notes}`);
  keepRendered('archive',()=>`${versions.records}|${versions.notes}|${versions.diaries}|${$('#archiveDate')?.value||''}|${$('#search')?.value||''}`);
  keepRendered('renderDiary',()=>`${day()}|${diaryEditingDate}|${versions.diaries}`);
  keepRendered('renderObservations',()=>`${versions.observations}|${observationFilterDate||''}`);
}
