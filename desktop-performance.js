// Keep already rendered desktop tabs until their underlying records or picker
// state change. The mobile app keeps its existing render lifecycle.
if(window.phdDesktop){
  const versions={records:0,notes:0,diaries:0,observations:0,references:0,manuscripts:0};
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
  keepRendered('archive',()=>`${localStorage.getItem('phd-archive-mode')||'daily'}|${localStorage.getItem('phd-archive-note-serial-order')||'desc'}|${versions.records}|${versions.notes}|${versions.diaries}|${versions.references}|${versions.manuscripts}|${$('#archiveDate')?.value||''}|${$('#search')?.value||''}`);
  keepRendered('renderDiary',()=>`${day()}|${diaryEditingDate}|${versions.diaries}`);
  keepRendered('renderObservations',()=>`${versions.observations}|${observationFilterDate||''}|${localStorage.getItem('phd-observation-sort')||''}`);

  // A Windows mouse commonly reports one wheel notch as a large 100-120px
  // delta. Chromium applies that jump immediately, which feels especially
  // abrupt in the app's narrow reading window. Shape only the document wheel:
  // one deliberate notch stays small, while a quick sequence accumulates into
  // a longer, continuous movement. Nested editors, dialogs and horizontal
  // tables keep their native scrolling.
  let wheelFrame=0,wheelTarget=0,lastWheelAt=0;
  const documentScroller=()=>document.scrollingElement||document.documentElement;
  function canScrollInside(target,direction){
    for(let node=target instanceof Element?target:null;node&&node!==document.body;node=node.parentElement){
      const style=getComputedStyle(node),scrollable=/(auto|scroll)/.test(style.overflowY);
      if(!scrollable||node.scrollHeight<=node.clientHeight+1)continue;
      if(direction<0&&node.scrollTop>0)return true;
      if(direction>0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)return true;
    }
    return false;
  }
  function animateWheel(){
    const root=documentScroller(),current=root.scrollTop,max=Math.max(0,root.scrollHeight-root.clientHeight);
    wheelTarget=Math.max(0,Math.min(wheelTarget,max));
    const remaining=wheelTarget-current;
    if(Math.abs(remaining)<.6){root.scrollTop=wheelTarget;wheelFrame=0;return}
    root.scrollTop=current+remaining*.34;
    wheelFrame=requestAnimationFrame(animateWheel);
  }
  window.addEventListener('wheel',event=>{
    if(event.defaultPrevented||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    if(event.target instanceof Element&&event.target.closest('.modal:not(.hidden),.notes-directory-mask'))return;
    const direction=Math.sign(event.deltaY);
    if(!direction||canScrollInside(event.target,direction))return;
    const root=documentScroller(),now=performance.now();
    let delta=event.deltaY;
    if(event.deltaMode===WheelEvent.DOM_DELTA_LINE)delta*=18;
    else if(event.deltaMode===WheelEvent.DOM_DELTA_PAGE)delta*=root.clientHeight*.82;
    const magnitude=Math.abs(delta);
    // Preserve fine touchpad deltas. Compress a discrete mouse notch so a
    // gentle turn cannot unexpectedly move several cards at once.
    const shaped=magnitude<=24?delta:direction*Math.min(68,24+Math.sqrt(magnitude)*4);
    if(now-lastWheelAt>90||!wheelFrame)wheelTarget=root.scrollTop;
    wheelTarget+=shaped;
    lastWheelAt=now;
    event.preventDefault();
    if(!wheelFrame)wheelFrame=requestAnimationFrame(animateWheel);
  },{passive:false,capture:true});

  const cancelWheel=()=>{
    if(wheelFrame)cancelAnimationFrame(wheelFrame);
    wheelFrame=0;
    wheelTarget=documentScroller().scrollTop;
  };
  window.addEventListener('pointerdown',cancelWheel,{capture:true});
  window.addEventListener('keydown',event=>{
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancelWheel();
  },{capture:true});
}
