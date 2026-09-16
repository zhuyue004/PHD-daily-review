// 随手记的 Markdown + LaTeX 渲染。原始文本始终保留，用于搜索、同步与备份。
(()=>{
  const KATEX_STYLE='vendor/katex/katex.min.css';
  if(!document.querySelector(`link[href="${KATEX_STYLE}"]`)){let link=document.createElement('link');link.rel='stylesheet';link.href=KATEX_STYLE;document.head.append(link)}
  const escapeHtml=value=>(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  function normalizeMath(source){
    let value=String(source||'').trim();
    // 兼容把 \[...\] 再包进 $...$ 的常见写法；转换为 KaTeX 可识别的多行公式。
    if(/^\\+\[/.test(value)&&/\\+\]/.test(value)){
      value=value.replace(/^\\+\[\s*/,'').replace(/\\+\]\s*\[?/g,'\n').replace(/\]\s*$/,'').replace(/\\{2,}%/g,'\\%').trim();
      let rows=value.split('\n').map(row=>row.trim()).filter(Boolean);
      return {source:rows.length>1?`\\begin{gathered}${rows.join('\\\\')}\\end{gathered}`:(rows[0]||''),display:true};
    }
    return {source:value,display:false};
  }
  function mathHtml(source,display){
    let normalized=normalizeMath(source);source=normalized.source;display=display||normalized.display;
    if(!window.katex)return `<code class="note-math-source">${escapeHtml(source)}</code>`;
    try{return window.katex.renderToString(source,{displayMode:display,throwOnError:false,strict:'ignore',trust:false})}
    catch{return `<code class="note-math-source">${escapeHtml(source)}</code>`}
  }
  function inline(source){
    let tokens=[],put=value=>{let key=`\uE000${tokens.length}\uE001`;tokens.push(value);return key};
    let value=escapeHtml(source);
    value=value.replace(/`([^`\n]+)`/g,(_,code)=>put(`<code>${code}</code>`));
    value=value.replace(/\$\$([\s\S]+?)\$\$/g,(_,formula)=>put(`<span class="note-display-math">${mathHtml(formula.trim(),true)}</span>`));
    // ChatGPT、MathJax 常复制为 \(...\)；也兼容复制后出现双反斜杠的文本。
    value=value.replace(/\\+\(([^\n]*?)\\+\)/g,(_,formula)=>put(mathHtml(formula.trim(),false)));
    value=value.replace(/(^|[^\\])\$([^$\n]+?)\$/g,(_,before,formula)=>`${before}${put(mathHtml(formula.trim(),false))}`);
    value=value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    value=value.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
    value=value.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>');
    return value.replace(/\uE000(\d+)\uE001/g,(_,index)=>tokens[+index]);
  }
  function renderNoteMarkup(text){
    let lines=String(text||'').replace(/\r/g,'').split('\n'),html=[],index=0;
    while(index<lines.length){
      let line=lines[index];
      if(!line.trim()){index++;continue}
      if(/^```/.test(line)){let code=[];index++;while(index<lines.length&&!/^```/.test(lines[index]))code.push(lines[index++]);if(index<lines.length)index++;html.push(`<pre class="note-code-block"><code>${escapeHtml(code.join('\n'))}</code></pre>`);continue}
      if(/^\$\$\s*$/.test(line.trim())){let formula=[];index++;while(index<lines.length&&!/^\$\$\s*$/.test(lines[index].trim()))formula.push(lines[index++]);if(index<lines.length)index++;html.push(`<div class="note-display-math">${mathHtml(formula.join('\n').trim(),true)}</div>`);continue}
      // 支持 \[...\]（包括用户输入成 \\[...\\] 的情况）作为独立显示公式。
      if(/^\\+\[/.test(line.trim())&&/\\+\]/.test(line)){html.push(`<div class="note-display-math">${mathHtml(line.trim(),true)}</div>`);index++;continue}
      let heading=line.match(/^(#{1,3})\s+(.+)$/);if(heading){let level=heading[1].length;html.push(`<h${level} class="note-heading">${inline(heading[2])}</h${level}>`);index++;continue}
      let quote=line.match(/^>\s?(.*)$/);if(quote){let quoteLines=[];while(index<lines.length&&/^>\s?/.test(lines[index]))quoteLines.push(lines[index++].replace(/^>\s?/,''));html.push(`<blockquote class="note-quote">${quoteLines.map(item=>inline(item)).join('<br>')}</blockquote>`);continue}
      let unordered=line.match(/^[-*+]\s+(.+)$/),ordered=line.match(/^\d+[.)]\s+(.+)$/);if(unordered||ordered){let isOrdered=!!ordered,items=[];while(index<lines.length){let found=lines[index].match(isOrdered?/^\d+[.)]\s+(.+)$/:/^[-*+]\s+(.+)$/);if(!found)break;items.push(`<li>${inline(found[1])}</li>`);index++}html.push(`<${isOrdered?'ol':'ul'} class="note-markdown-list">${items.join('')}</${isOrdered?'ol':'ul'}>`);continue}
      if(/^【[^】]+】\s*$/.test(line.trim())){html.push(`<p class="note-category">${escapeHtml(line.trim())}</p>`);index++;continue}
      let paragraph=[line];index++;while(index<lines.length&&lines[index].trim()&&!/^(#{1,3})\s+|^>\s?|^[-*+]\s+|^\d+[.)]\s+|^```|^\$\$\s*$/.test(lines[index]))paragraph.push(lines[index++]);html.push(`<p class="note-paragraph">${paragraph.map(inline).join('<br>')}</p>`);
    }
    return `<div class="note-markdown">${html.join('')}</div>`;
  }
  window.renderNoteMarkup=renderNoteMarkup;
  noteContent=renderNoteMarkup;
  // Some iPhone Safari restores a PWA page before all deferred UI scripts have
  // finished. Let every note surface redraw once formula rendering is ready.
  window.dispatchEvent(new Event('phd-note-format-ready'));
  requestAnimationFrame(()=>{
    if(document.querySelector('#home.active'))window.renderNotes?.();
    if(document.querySelector('#archive.active'))window.archive?.();
    if(document.querySelector('#notesTimeline.active'))window.renderNotesTimeline?.();
  });

  let input=$('#noteInput');if(!input)return;
  let toolbar=document.createElement('div');toolbar.className='note-format-toolbar';toolbar.innerHTML='<div class="note-format-switch" role="tablist" aria-label="随手记显示模式"><i aria-hidden="true"></i><button type="button" class="selected" data-mode="edit" role="tab">编辑</button><button type="button" data-mode="preview" role="tab">预览</button></div><small>支持 Markdown 与 $公式$</small>';
  let preview=document.createElement('div');preview.id='noteFormatPreview';preview.className='note-format-preview hidden';
  input.before(toolbar);input.after(preview);
  function show(mode){let previewing=mode==='preview',toggle=toolbar.querySelector('.note-format-switch');toggle.classList.toggle('previewing',previewing);toolbar.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button.dataset.mode===mode);button.setAttribute('aria-selected',String(button.dataset.mode===mode))});input.hidden=previewing;preview.classList.toggle('hidden',!previewing);if(previewing)preview.innerHTML=renderNoteMarkup(input.value)||'<p class="empty">还没有可预览的内容。</p>'}
  let toggle=toolbar.querySelector('.note-format-switch'),dragStart=null,skipClick=false;
  toolbar.querySelectorAll('button').forEach(button=>button.onclick=()=>{if(skipClick)return;show(button.dataset.mode)});
  toggle.addEventListener('pointerdown',event=>{dragStart=event.clientX;toggle.setPointerCapture?.(event.pointerId)});
  toggle.addEventListener('pointerup',event=>{if(dragStart===null)return;let delta=event.clientX-dragStart;dragStart=null;if(Math.abs(delta)<14)return;skipClick=true;show(delta>0?'preview':'edit');setTimeout(()=>skipClick=false,0)});
  toggle.addEventListener('pointercancel',()=>dragStart=null);
  input.addEventListener('input',()=>{if(!preview.classList.contains('hidden'))preview.innerHTML=renderNoteMarkup(input.value)});
})();
