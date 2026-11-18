// Mermaid flowcharts embedded in notes. The original source remains in the note;
// this module only creates a scalable SVG reading view.
(()=>{
  const escapeHtml=value=>String(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const diagramPattern=/^(?:flowchart|graph)\s+(?:TB|TD|BT|LR|RL)\b/i;
  const cache=new Map(),pending=new Map();
  let renderSequence=0,renderQueue=Promise.resolve(),initialized=false,mermaidLoading;

  function normalizeSource(value){
    let source=String(value||'').replace(/\r/g,'').replace(/(?:&#x20;|&nbsp;)/gi,' ').replace(/&gt;/gi,'>').replace(/&lt;/gi,'<').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&amp;/gi,'&');
    let lines=source.split('\n').map(line=>line.replace(/\\[ \t]*$/,'').replace(/[ \t]+$/,''));
    while(lines.length&&!lines[0].trim())lines.shift();
    while(lines.length&&!lines.at(-1).trim())lines.pop();
    return lines.join('\n').trim();
  }
  function rawSource(value){let source=normalizeSource(value);return diagramPattern.test(source)?source:''}
  function placeholder(value){let source=normalizeSource(value);return source?`<div class="note-mermaid" data-mermaid-source="${escapeHtml(encodeURIComponent(source))}"><div class="note-mermaid-loading">流程图生成中…</div></div>`:''}

  function initialize(){
    if(initialized)return;
    window.mermaid.initialize({
      startOnLoad:false,
      securityLevel:'strict',
      theme:'base',
      themeVariables:{
        fontFamily:'"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif',
        primaryColor:'#ffe4d2',primaryTextColor:'#71300f',primaryBorderColor:'#dfc6b7',
        lineColor:'#8e8e93',secondaryColor:'#fff7f1',tertiaryColor:'#ffffff',
        clusterBkg:'#ffffff',clusterBorder:'#e5e5ea',edgeLabelBackground:'#ffffff'
      },
      flowchart:{htmlLabels:true,useMaxWidth:false,curve:'basis'}
    });
    initialized=true;
  }
  function loadMermaid(){
    if(window.mermaid){initialize();return Promise.resolve(window.mermaid)}
    if(mermaidLoading)return mermaidLoading;
    mermaidLoading=new Promise((resolve,reject)=>{let script=document.createElement('script');script.src='vendor/mermaid/mermaid.min.js';script.async=true;script.onload=()=>{try{initialize();resolve(window.mermaid)}catch(error){reject(error)}};script.onerror=()=>reject(new Error('流程图组件加载失败'));document.head.append(script)});
    return mermaidLoading;
  }
  function diagramSvg(source){
    if(cache.has(source))return Promise.resolve(cache.get(source));
    if(pending.has(source))return pending.get(source);
    let task=renderQueue.then(async()=>{
      await loadMermaid();
      let id=`note-mermaid-${Date.now()}-${++renderSequence}`,result=await window.mermaid.render(id,source),svg=result?.svg||'';
      if(!svg)throw new Error('没有生成流程图');
      cache.set(source,svg);
      return svg;
    });
    renderQueue=task.catch(()=>{});
    pending.set(source,task);
    task.finally(()=>pending.delete(source));
    return task;
  }

  let viewer,stage,canvas,zoomLabel,viewerWidth=1200,viewerHeight=800,scale=1,pinchStart=0,pinchScale=1;
  function ensureViewer(){
    if(viewer)return viewer;
    viewer=document.createElement('div');viewer.id='noteDiagramViewer';viewer.className='note-diagram-viewer hidden';
    viewer.innerHTML='<div class="note-diagram-toolbar"><button type="button" data-diagram-action="minus" aria-label="缩小流程图">−</button><button type="button" data-diagram-action="fit" aria-label="适应屏幕">适应</button><span>100%</span><button type="button" data-diagram-action="plus" aria-label="放大流程图">＋</button><button type="button" class="note-diagram-close" data-diagram-action="close" aria-label="关闭流程图">×</button></div><div class="note-diagram-stage"><div class="note-diagram-canvas"></div></div>';
    document.body.append(viewer);stage=viewer.querySelector('.note-diagram-stage');canvas=viewer.querySelector('.note-diagram-canvas');zoomLabel=viewer.querySelector('.note-diagram-toolbar span');
    viewer.querySelector('[data-diagram-action=minus]').onclick=()=>setScale(scale/1.25);
    viewer.querySelector('[data-diagram-action=plus]').onclick=()=>setScale(scale*1.25);
    viewer.querySelector('[data-diagram-action=fit]').onclick=fitWidth;
    viewer.querySelector('[data-diagram-action=close]').onclick=closeViewer;
    viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer()});
    stage.addEventListener('wheel',event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();setScale(scale*(event.deltaY<0?1.12:.89))},{passive:false});
    stage.addEventListener('touchstart',event=>{if(event.touches.length!==2)return;pinchStart=touchDistance(event.touches);pinchScale=scale},{passive:true});
    stage.addEventListener('touchmove',event=>{if(event.touches.length!==2||!pinchStart)return;event.preventDefault();setScale(pinchScale*touchDistance(event.touches)/pinchStart)},{passive:false});
    stage.addEventListener('touchend',event=>{if(event.touches.length<2)pinchStart=0},{passive:true});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!viewer.classList.contains('hidden'))closeViewer()});
    return viewer;
  }
  function touchDistance(touches){let x=touches[0].clientX-touches[1].clientX,y=touches[0].clientY-touches[1].clientY;return Math.hypot(x,y)}
  function setScale(value){scale=Math.min(6,Math.max(.12,value));let svg=canvas?.querySelector('svg');if(!svg)return;svg.style.width=`${Math.round(viewerWidth*scale)}px`;svg.style.height=`${Math.round(viewerHeight*scale)}px`;zoomLabel.textContent=`${Math.round(scale*100)}%`}
  function fitWidth(){if(!stage)return;setScale(Math.min(1,(stage.clientWidth-32)/viewerWidth));stage.scrollTo({top:0,left:0})}
  function closeViewer(){viewer?.classList.add('hidden');canvas?.replaceChildren();document.body.classList.remove('note-diagram-viewer-open')}
  function openViewer(svgMarkup){
    ensureViewer();canvas.innerHTML=svgMarkup;let svg=canvas.querySelector('svg'),viewBox=svg?.viewBox?.baseVal;
    viewerWidth=viewBox?.width||parseFloat(svg?.getAttribute('width'))||1200;viewerHeight=viewBox?.height||parseFloat(svg?.getAttribute('height'))||800;
    if(svg){svg.removeAttribute('width');svg.removeAttribute('height');svg.setAttribute('role','img');svg.setAttribute('aria-label','随手记流程图')}
    viewer.classList.remove('hidden');document.body.classList.add('note-diagram-viewer-open');requestAnimationFrame(fitWidth);
  }

  async function renderHolder(holder){
    if(holder.dataset.renderState)return;
    holder.dataset.renderState='loading';
    try{
      let source=decodeURIComponent(holder.dataset.mermaidSource||''),svgMarkup=await diagramSvg(source);
      if(!holder.isConnected)return;
      let button=document.createElement('button');button.type='button';button.className='note-mermaid-open';button.setAttribute('aria-label','打开流程图大图');button.innerHTML=`<span class="note-mermaid-svg">${svgMarkup}</span><span class="note-mermaid-hint">点击放大查看完整流程图</span>`;
      button.querySelector('svg')?.setAttribute('aria-hidden','true');
      button.onclick=event=>{event.preventDefault();event.stopPropagation();openViewer(svgMarkup)};
      holder.replaceChildren(button);holder.dataset.renderState='ready';
      window.dispatchEvent(new CustomEvent('phd-note-diagram-ready',{detail:{holder}}));
    }catch(error){
      holder.dataset.renderState='error';holder.innerHTML=`<div class="note-mermaid-error"><b>流程图生成失败</b><span>${escapeHtml(error?.message||'请检查 Mermaid 代码')}</span></div>`;
    }
  }
  function hydrate(root=document){root?.querySelectorAll?.('.note-mermaid[data-mermaid-source]').forEach(renderHolder)}

  const style=document.createElement('style');style.id='note-diagram-style';style.textContent=`
  .note-mermaid{margin:12px 0;text-indent:0}.note-mermaid-loading,.note-mermaid-error{display:grid;gap:3px;min-height:72px;place-content:center;padding:12px;border:1px solid #dedee3;border-radius:10px;background:#fff7f1;color:#8e8e93;text-align:center}.note-mermaid-error b{color:#c53b3b}.note-mermaid-error span{font-size:12px}.note-mermaid-open{position:relative;display:block;width:100%;max-height:min(72vh,720px);margin:0;padding:0;overflow:hidden;border:1px solid #dedee3;border-radius:10px;background:#fff;color:#1c1c1e}.note-mermaid-svg{display:block;width:100%;padding:10px}.note-mermaid-svg svg{display:block;width:100%!important;height:auto!important;max-width:none!important}.note-mermaid-hint{position:absolute;right:8px;bottom:8px;padding:5px 9px;border-radius:999px;background:#000a;color:#fff;font-size:12px;font-weight:500;line-height:1.2}.note-diagram-viewer{position:fixed;z-index:30;inset:0;display:flex;flex-direction:column;background:#000e}.note-diagram-viewer.hidden{display:none}.note-diagram-toolbar{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;background:#111e;color:#fff}.note-diagram-toolbar button{width:auto;min-width:40px;height:36px;margin:0;padding:0 11px;border-radius:9px;background:#ffffff24;color:#fff;font-size:16px}.note-diagram-toolbar span{min-width:52px;font-size:13px;text-align:center}.note-diagram-toolbar .note-diagram-close{position:absolute;right:12px;bottom:8px;border-radius:50%;font-size:24px}.note-diagram-stage{flex:1;min-height:0;overflow:auto;padding:16px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:#f5f5f7}.note-diagram-canvas{width:max-content;min-width:100%;min-height:100%;text-align:center}.note-diagram-canvas svg{display:block;max-width:none!important;margin:0 auto;background:#fff;transform-origin:top left}.note-diagram-viewer-open{overflow:hidden}@media(prefers-color-scheme:dark){.note-mermaid-loading,.note-mermaid-error{border-color:#48484a;background:#1c1c1e}.note-mermaid-open{border-color:#48484a}.note-diagram-stage{background:#111}}
  `;document.head.append(style);

  window.normalizeNoteMermaidSource=normalizeSource;
  window.noteMermaidRawSource=rawSource;
  window.noteMermaidPlaceholder=placeholder;
  window.hydrateNoteMermaid=hydrate;
  window.openNoteMermaid=openViewer;
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;hydrate()})}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>hydrate());else hydrate();
})();
