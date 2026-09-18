// 随手记的 Markdown + LaTeX 渲染。原始文本始终保留，用于搜索、同步与备份。
(()=>{
  const KATEX_STYLE='vendor/katex/katex.min.css';
  if(!document.querySelector(`link[href="${KATEX_STYLE}"]`)){let link=document.createElement('link');link.rel='stylesheet';link.href=KATEX_STYLE;document.head.append(link)}
  const typographyStyle=document.createElement('style');
  typographyStyle.id='note-unified-typography';
  typographyStyle.textContent=`
  #noteInput{font-size:15px;line-height:1.72;letter-spacing:.01em;color:#111;tab-size:2}
  .note-format-preview,.note-markdown{font-size:15px;font-weight:400;line-height:1.72;letter-spacing:.01em;color:#111}
  .note-markdown .note-paragraph{margin:0 0 9px;line-height:1.72;text-indent:2em;white-space:pre-wrap;text-align:left}
  .note-markdown .note-paragraph.note-field-paragraph{padding-left:0;text-indent:0}
  .note-markdown .note-blank-line{height:.65em}
  .note-markdown .note-blank-line.note-blank-line-double{height:1.3em}
  .note-field-label{color:#1c1c1e;font-weight:400}
  .note-field-value{color:inherit;font-weight:400}
  .note-markdown strong{color:#111;font-weight:700}.note-markdown em{color:#3a3a3c}
  .note-markdown .note-heading{color:#1c1c1e;font-weight:700;letter-spacing:-.2px}.note-markdown h1.note-heading{font-size:20px}.note-markdown h2.note-heading{font-size:18px}.note-markdown h3.note-heading{font-size:16px}
  .note-markdown .note-category,.timeline-text .note-markdown .note-category{display:inline-flex!important;align-items:center;width:auto;margin:0 0 11px;padding:4px 9px;border:1px solid #b9dec3;border-radius:7px;background:#edf8f0;color:#248a3d;font-size:12px;font-weight:650;line-height:1.3;text-indent:0}
  .note-markdown .note-markdown-list{margin:7px 0 10px;padding-left:1.5em;line-height:1.68}.note-markdown .note-markdown-list li{margin:4px 0;padding-left:2px;text-indent:0}.note-markdown .note-markdown-list li::marker{color:#8e8e93}
  .note-markdown .note-quote{margin:9px 0;padding:7px 11px;border-left:3px solid #8e8e93;border-radius:0 7px 7px 0;background:#f2f2f7;color:#636366;line-height:1.68}
  .note-markdown .note-code-block{margin:9px 0;padding:11px;border-radius:9px;background:#1c1c1e;color:#f2f2f7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.58;white-space:pre-wrap;overflow:auto}
  .note-markdown code,.note-math-source{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.note-display-math{margin:10px 0;text-align:center}
  .note-annotation{padding:1px 2px;border-radius:3px;color:inherit}.note-highlight-yellow{background:#f3edc7}.note-highlight-green{background:#dfeee3}.note-highlight-red{background:#f1dddd}.note-underline-blue{padding-bottom:1px;border-bottom:2px solid #7fa7c4}.note-deleted{color:#8e8e93;text-decoration-thickness:1.5px}
  .note-annotate-wrap{position:relative}.note-annotate-toggle{height:31px!important;margin:0!important;padding:0 9px!important;border-radius:8px!important;background:#edf0f3!important;color:#5f6872!important;font-size:13px!important;font-weight:500!important}.note-annotate-menu{position:absolute;z-index:12;top:37px;left:0;display:grid;grid-template-columns:repeat(3,max-content);gap:6px;width:max-content;padding:8px;border:1px solid #dedee3;border-radius:11px;background:#fff;box-shadow:0 8px 24px #0002}.note-annotate-menu.hidden{display:none}.note-annotate-menu button{display:flex;align-items:center;gap:5px;margin:0!important;padding:6px 8px!important;border-radius:7px!important;background:#f2f2f7!important;color:#3a3a3c!important;font-size:12px!important;font-weight:400!important}.note-annotate-menu i{width:14px;height:14px;border-radius:3px}.note-annotate-menu [data-annotation=yellow] i{background:#f3edc7}.note-annotate-menu [data-annotation=green] i{background:#dfeee3}.note-annotate-menu [data-annotation=red] i{background:#f1dddd}.note-annotate-menu [data-annotation=underline] i{border-bottom:2px solid #7fa7c4}.note-annotate-menu [data-annotation=delete] i{position:relative}.note-annotate-menu [data-annotation=delete] i::after{content:'';position:absolute;left:0;right:0;top:6px;border-top:1px solid #8e8e93}
  .timeline-text,.timeline-text .note-markdown{color:#111;font-size:14px;line-height:1.72;text-align:left}.timeline-card .timeline-text .note-markdown .note-paragraph{color:#111!important;line-height:1.72!important;text-align:left!important}.timeline-card .timeline-text .note-markdown .note-field-paragraph{text-indent:0!important}
  @media (prefers-color-scheme:dark){#noteInput,.note-format-preview,.note-markdown,.timeline-text,.timeline-text .note-markdown{color:#f2f2f7}.note-field-label,.note-markdown .note-heading,.note-markdown strong{color:#f2f2f7}.note-markdown em{color:#d1d1d6}.note-markdown .note-category,.timeline-text .note-markdown .note-category{border-color:#376947;background:#173d25;color:#7edb94}.note-markdown .note-quote{border-left-color:#8e8e93;background:#2c2c2e;color:#d1d1d6}.note-highlight-yellow{background:#514a2f}.note-highlight-green{background:#294637}.note-highlight-red{background:#503336}.note-underline-blue{border-bottom-color:#78a9ca}.note-deleted{color:#98989d}.note-annotate-toggle{background:#33383e!important;color:#d1d1d6!important}.note-annotate-menu{border-color:#48484a;background:#2c2c2e;box-shadow:0 8px 24px #0008}.note-annotate-menu button{background:#3a3a3c!important;color:#f2f2f7!important}.timeline-card .timeline-text .note-markdown .note-paragraph{color:#f2f2f7!important}}
  `;
  document.head.append(typographyStyle);
  const escapeHtml=value=>(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const FIELD_LABELS=new Set(['问题','尝试','结果','不确定','下一步','现象','我猜','已有证据','条件 / 版本','做了什么','可能原因','论文 / 概念','关键观点','原文位置（页码 / 图表 / 章节）','和我课题的关系','要核实','研究问题','方法','当前结果','不确定处','书 / 章节','核心内容','我的理解','和研究或生活的关联','想继续追问 / 行动','和谁讨论','达成结论 / 仍有分歧','我准备采取的动作','要做的选择','备选方案','考虑因素','当前决定','之后验证','想到','为什么可能有用','最小验证']);
  const fieldMatch=line=>{let match=String(line||'').match(/^([　 \t]*)([^：:\n]{1,24})([：:])([　 \t]*)(.*)$/);if(!match)return null;return FIELD_LABELS.has(match[2].replace(/\s+/g,' ').trim())?match:null};
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
    // ChatGPT Markdown copies often escape underscores (P\_f). Inside math,
    // that should be a subscript rather than a printed underscore character.
    source=source.replace(/\\_/g,'_');
    if(!window.katex)return `<code class="note-math-source">${escapeHtml(source)}</code>`;
    try{return window.katex.renderToString(source,{displayMode:display,throwOnError:false,strict:'ignore',trust:false})}
    catch{return `<code class="note-math-source">${escapeHtml(source)}</code>`}
  }
  function inline(source){
    let tokens=[],put=value=>{let key=`\uE000${tokens.length}\uE001`;tokens.push(value);return key};
    let value=escapeHtml(source);
    value=value.replace(/`([^`\n]+)`/g,(_,code)=>put(`<code>${code}</code>`));
    value=value.replace(/\$\$([\s\S]+?)\$\$/g,(_,formula)=>put(`<span class="note-display-math">${mathHtml(formula.trim(),true)}</span>`));
    // Support ChatGPT/MathJax display delimiters anywhere in a line, including
    // formula + Chinese text and multiple adjacent formulas.
    value=value.replace(/\\+\[([^\n]*?)\\+\]/g,(_,formula)=>put(`<span class="note-display-math">${mathHtml(formula.trim(),true)}</span>`));
    // ChatGPT、MathJax 常复制为 \(...\)；也兼容复制后出现双反斜杠的文本。
    value=value.replace(/\\+\(([^\n]*?)\\+\)/g,(_,formula)=>put(mathHtml(formula.trim(),false)));
    value=value.replace(/(^|[^\\])\$([^$\n]+?)\$/g,(_,before,formula)=>`${before}${put(mathHtml(formula.trim(),false))}`);
    value=value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    value=value.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
    value=value.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>');
    value=value.replace(/~~([^~\n]+)~~/g,'<del class="note-deleted">$1</del>');
    value=value.replace(/\[\[(黄|绿|红|下划线)::([^\]\n]+?)\]\]/g,(_,kind,content)=>`<span class="note-annotation ${kind==='黄'?'note-highlight-yellow':kind==='绿'?'note-highlight-green':kind==='红'?'note-highlight-red':'note-underline-blue'}">${content}</span>`);
    return value.replace(/\uE000(\d+)\uE001/g,(_,index)=>tokens[+index]);
  }
  function plainNoteText(text){return String(text||'').replace(/\[\[(?:黄|绿|红|下划线)::([^\]\n]+?)\]\]/g,'$1').replace(/~~([^~\n]+)~~/g,'$1')}
  function formattedLine(line){let match=fieldMatch(line);if(!match)return inline(line);return `${inline(match[1])}<span class="note-field-label">${inline(match[2]+match[3])}</span>${inline(match[4])}<span class="note-field-value">${inline(match[5])}</span>`}
  function prepareCopiedDisplayMath(text){
    let formulas=[];
    let source=String(text||'').replace(/\r/g,'').replace(/(?:\*\*\s*)?\\+\[([\s\S]*?)\\+\](?:\s*\*\*)?(?:\s*(?:&#x20;|&nbsp;))?/gi,(_,formula)=>{
      let cleaned=formula.replace(/\*\*/g,'').replace(/\\[ \t]*\n/g,' ').replace(/\n+/g,' ').replace(/(?:&#x20;|&nbsp;)/gi,' ').replace(/\s+/g,' ').trim();
      let token=`\uE100${formulas.length}\uE101`;formulas.push(cleaned);return `\n${token}\n`;
    });
    return {source,formulas};
  }
  function renderNoteMarkup(text){
    let prepared=prepareCopiedDisplayMath(text),lines=prepared.source.split('\n'),html=[],index=0;
    while(index<lines.length){
      let line=lines[index];
      if(!line.trim()){let blankCount=0;while(index<lines.length&&!lines[index].trim()){blankCount++;index++}if(html.length&&index<lines.length)html.push(`<div class="note-blank-line${blankCount>1?' note-blank-line-double':''}" aria-hidden="true"></div>`);continue}
      let copiedDisplay=line.trim().match(/^\uE100(\d+)\uE101$/);if(copiedDisplay){html.push(`<div class="note-display-math">${mathHtml(prepared.formulas[+copiedDisplay[1]],true)}</div>`);index++;continue}
      if(/^```/.test(line)){let code=[];index++;while(index<lines.length&&!/^```/.test(lines[index]))code.push(lines[index++]);if(index<lines.length)index++;html.push(`<pre class="note-code-block"><code>${escapeHtml(code.join('\n'))}</code></pre>`);continue}
      if(/^\$\$\s*$/.test(line.trim())){let formula=[];index++;while(index<lines.length&&!/^\$\$\s*$/.test(lines[index].trim()))formula.push(lines[index++]);if(index<lines.length)index++;html.push(`<div class="note-display-math">${mathHtml(formula.join('\n').trim(),true)}</div>`);continue}
      // A line containing only one or more \[...\] formulas renders each
      // formula as its own display block. Text following a formula falls
      // through to inline(), which preserves that text.
      let displayMatches=[...line.trim().matchAll(/\\+\[([^\n]*?)\\+\]/g)];
      let displayRemainder=line.trim().replace(/\\+\[[^\n]*?\\+\]/g,'').trim();
      if(displayMatches.length&&!displayRemainder){displayMatches.forEach(match=>html.push(`<div class="note-display-math">${mathHtml(match[1].trim(),true)}</div>`));index++;continue}
      let heading=line.match(/^(#{1,3})\s+(.+)$/);if(heading){let level=heading[1].length;html.push(`<h${level} class="note-heading">${inline(heading[2])}</h${level}>`);index++;continue}
      let quote=line.match(/^>\s?(.*)$/);if(quote){let quoteLines=[];while(index<lines.length&&/^>\s?/.test(lines[index]))quoteLines.push(lines[index++].replace(/^>\s?/,''));html.push(`<blockquote class="note-quote">${quoteLines.map(item=>inline(item)).join('<br>')}</blockquote>`);continue}
      let unordered=line.match(/^[-*+]\s+(.+)$/),ordered=line.match(/^\d+[.)]\s+(.+)$/);if(unordered||ordered){let isOrdered=!!ordered,items=[];while(index<lines.length){let found=lines[index].match(isOrdered?/^\d+[.)]\s+(.+)$/:/^[-*+]\s+(.+)$/);if(!found)break;items.push(`<li>${inline(found[1])}</li>`);index++}html.push(`<${isOrdered?'ol':'ul'} class="note-markdown-list">${items.join('')}</${isOrdered?'ol':'ul'}>`);continue}
      if(/^【[^】]+】\s*$/.test(line.trim())){html.push(`<p class="note-category">${escapeHtml(line.trim())}</p>`);index++;continue}
      let paragraph=[line];index++;while(index<lines.length&&lines[index].trim()&&!/^(#{1,3})\s+|^>\s?|^[-*+]\s+|^\d+[.)]\s+|^```|^\$\$\s*$|^\\+\[/.test(lines[index]))paragraph.push(lines[index++]);let fieldParagraph=paragraph.some(fieldMatch);html.push(`<p class="note-paragraph${fieldParagraph?' note-field-paragraph':''}">${paragraph.map(formattedLine).join('<br>')}</p>`);
    }
    return `<div class="note-markdown">${html.join('')}</div>`;
  }
  window.renderNoteMarkup=renderNoteMarkup;
  window.plainNoteText=plainNoteText;
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
  let toolbar=document.createElement('div');toolbar.className='note-format-toolbar';toolbar.innerHTML='<div class="note-format-switch" role="tablist" aria-label="随手记显示模式"><i aria-hidden="true"></i><button type="button" class="selected" data-mode="edit" role="tab">编辑</button><button type="button" data-mode="preview" role="tab">预览</button></div><div class="note-annotate-wrap"><button type="button" class="note-annotate-toggle" aria-expanded="false">批注</button><div class="note-annotate-menu hidden"><button type="button" data-annotation="yellow"><i></i>黄色</button><button type="button" data-annotation="green"><i></i>绿色</button><button type="button" data-annotation="red"><i></i>红色</button><button type="button" data-annotation="underline"><i></i>下划线</button><button type="button" data-annotation="delete"><i></i>删除线</button><button type="button" data-annotation="clear">清除</button></div></div><small>支持 Markdown 与 $公式$</small>';
  let preview=document.createElement('div');preview.id='noteFormatPreview';preview.className='note-format-preview hidden';
  input.before(toolbar);input.after(preview);
  function show(mode){let previewing=mode==='preview',toggle=toolbar.querySelector('.note-format-switch');toggle.classList.toggle('previewing',previewing);toolbar.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button.dataset.mode===mode);button.setAttribute('aria-selected',String(button.dataset.mode===mode))});input.hidden=previewing;preview.classList.toggle('hidden',!previewing);if(previewing)preview.innerHTML=renderNoteMarkup(input.value)||'<p class="empty">还没有可预览的内容。</p>'}
  let toggle=toolbar.querySelector('.note-format-switch'),dragStart=null,skipClick=false;
  toolbar.querySelectorAll('button').forEach(button=>button.onclick=()=>{if(skipClick)return;show(button.dataset.mode)});
  toggle.addEventListener('pointerdown',event=>{dragStart=event.clientX;toggle.setPointerCapture?.(event.pointerId)});
  toggle.addEventListener('pointerup',event=>{if(dragStart===null)return;let delta=event.clientX-dragStart;dragStart=null;if(Math.abs(delta)<14)return;skipClick=true;show(delta>0?'preview':'edit');setTimeout(()=>skipClick=false,0)});
  toggle.addEventListener('pointercancel',()=>dragStart=null);
  let annotationWrap=toolbar.querySelector('.note-annotate-wrap'),annotationToggle=toolbar.querySelector('.note-annotate-toggle'),annotationMenu=toolbar.querySelector('.note-annotate-menu'),savedSelection={start:0,end:0};
  function rememberSelection(){savedSelection={start:input.selectionStart||0,end:input.selectionEnd||0}}
  ['select','keyup','mouseup','touchend'].forEach(type=>input.addEventListener(type,rememberSelection));
  annotationToggle.onpointerdown=rememberSelection;annotationToggle.onclick=()=>{let opening=annotationMenu.classList.contains('hidden');annotationMenu.classList.toggle('hidden',!opening);annotationToggle.setAttribute('aria-expanded',String(opening))};
  annotationMenu.addEventListener('mousedown',event=>event.preventDefault());
  annotationMenu.querySelectorAll('[data-annotation]').forEach(button=>button.onclick=()=>{let start=input.selectionStart!==input.selectionEnd?input.selectionStart:savedSelection.start,end=input.selectionStart!==input.selectionEnd?input.selectionEnd:savedSelection.end;if(end<=start){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false');alert('请先选择要批注的文字。');return}let selected=input.value.slice(start,end),type=button.dataset.annotation,replaced;if(type==='clear')replaced=plainNoteText(selected);else{let markers={yellow:['[[黄::',']]'],green:['[[绿::',']]'],red:['[[红::',']]'],underline:['[[下划线::',']]'],delete:['~~','~~']}[type];replaced=selected.split('\n').map(line=>line?`${markers[0]}${line}${markers[1]}`:line).join('\n')}input.setRangeText(replaced,start,end,'select');rememberSelection();input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')});
  document.addEventListener('pointerdown',event=>{if(!annotationWrap.contains(event.target)){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')}});
  input.addEventListener('input',()=>{if(!preview.classList.contains('hidden'))preview.innerHTML=renderNoteMarkup(input.value)});
})();
