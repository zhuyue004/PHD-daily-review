// 随手记的 Markdown + LaTeX 渲染。原始文本始终保留，用于搜索、同步与备份。
(()=>{
  const KATEX_STYLE='vendor/katex/katex.min.css';
  if(!document.querySelector(`link[href="${KATEX_STYLE}"]`)){let link=document.createElement('link');link.rel='stylesheet';link.href=KATEX_STYLE;document.head.append(link)}
  const typographyStyle=document.createElement('style');
  typographyStyle.id='note-unified-typography';
  typographyStyle.textContent=`
  #noteInput{font-size:15px;line-height:1.72;letter-spacing:.01em;color:#111;tab-size:2}
  .note-format-preview,.note-markdown{font-size:15px;font-weight:400;line-height:1.72;letter-spacing:.01em;color:#111}
  .note-markdown .note-paragraph{margin:0 0 9px;padding-left:calc(var(--note-depth,0)*1.7em);line-height:1.72;text-indent:2em;white-space:pre-wrap;text-align:left}
  .note-markdown .note-field-group{display:grid;grid-template-columns:fit-content(8.5em) minmax(0,1fr);column-gap:.55em;row-gap:5px;margin:0 0 10px;padding-left:calc(var(--note-depth,0)*1.7em);line-height:1.72;text-indent:0;text-align:left}
  .note-markdown .note-field-label{align-self:start;min-width:0;color:#1c1c1e;font-weight:400;overflow-wrap:anywhere}
  .note-markdown .note-field-value{min-width:0;color:inherit;font-weight:400;overflow-wrap:anywhere}
  .note-markdown .note-number-group{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:.55em;row-gap:6px;margin:0 0 10px;padding-left:calc(var(--note-depth,0)*1.7em);line-height:1.72;text-indent:0;text-align:left}
  .note-markdown .note-number-marker{min-width:1.25em;color:#636366;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  .note-markdown .note-number-value{min-width:0;overflow-wrap:anywhere}.note-markdown .note-number-value br+span{display:inline}
  .note-markdown .note-inline-image-slot{display:block;min-height:76px;margin:9px 0;padding-left:calc(var(--note-depth,0)*1.7em);text-indent:0}.note-markdown .note-inline-image-slot button{display:block;margin:0;padding:0;border:0;background:transparent}.note-markdown .note-inline-image-slot img{display:block;width:76px;height:76px;border-radius:9px;background:#e5e5ea;object-fit:cover}.note-markdown .note-inline-image-missing{display:inline-flex;align-items:center;min-height:32px;padding:5px 9px;border-radius:7px;background:#f2f2f7;color:#8e8e93;font-size:12px}
  .note-image-preview>div>small{position:absolute;left:4px;bottom:4px;padding:2px 5px;border-radius:5px;background:#0009;color:#fff;font-size:10px;line-height:1.2;pointer-events:none}
  .note-markdown .note-blank-line{height:.65em}
  .note-markdown .note-blank-line.note-blank-line-double{height:1.3em}
  .note-markdown strong{color:#111;font-weight:700}.note-markdown em{color:#3a3a3c}
  .note-markdown .note-heading{color:#1c1c1e;font-weight:700;letter-spacing:-.2px}.note-markdown h1.note-heading{font-size:20px}.note-markdown h2.note-heading{font-size:18px}.note-markdown h3.note-heading{font-size:16px}
  .note-markdown .note-category,.timeline-text .note-markdown .note-category{display:inline-flex!important;align-items:center;width:auto;margin:0 0 11px;padding:4px 9px;border:1px solid #b9dec3;border-radius:7px;background:#edf8f0;color:#248a3d;font-size:12px;font-weight:650;line-height:1.3;text-indent:0}
  .note-markdown .note-markdown-list{margin:7px 0 10px;padding-left:1.5em;line-height:1.68}.note-markdown .note-markdown-list li{margin:4px 0;padding-left:2px;text-indent:0}.note-markdown .note-markdown-list li::marker{color:#8e8e93}
  .note-markdown .note-quote{margin:9px 0;padding:7px 11px;border-left:3px solid #8e8e93;border-radius:0 7px 7px 0;background:#f2f2f7;color:#636366;line-height:1.68}
  .note-markdown .note-code-block{margin:9px 0;padding:11px;border-radius:9px;background:#1c1c1e;color:#f2f2f7;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.58;white-space:pre-wrap;overflow:auto}
  .note-markdown code,.note-math-source{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.note-display-math{display:block;max-width:100%;margin:10px 0;overflow-x:auto;overflow-y:hidden;text-align:center;text-indent:0;-webkit-overflow-scrolling:touch}.note-display-math .katex-display{margin:.4em 0}.note-markdown .katex,.note-markdown .katex *{overflow-wrap:normal;word-break:normal}.note-math-source{display:inline-block;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;text-indent:0}
  .note-annotation{padding:1px 2px;border-radius:3px;color:inherit}.note-bold{font-weight:700}.note-highlight-yellow{background:#ffe58f}.note-highlight-green{background:#bfe7c8}.note-highlight-red{background:#f4b9bd}.note-text-red{color:#c53b3b}.note-underline-blue{padding-bottom:1px;border-bottom:2px solid #7fa7c4}.note-deleted{color:#8e8e93;text-decoration-thickness:1.5px}
  .note-annotate-wrap{position:relative}.note-annotate-toggle{height:31px!important;margin:0!important;padding:0 9px!important;border-radius:8px!important;background:#edf0f3!important;color:#5f6872!important;font-size:13px!important;font-weight:500!important}.note-annotate-menu{position:absolute;z-index:12;top:37px;left:0;display:grid;grid-template-columns:repeat(3,max-content);gap:6px;width:max-content;padding:8px;border:1px solid #dedee3;border-radius:11px;background:#fff;box-shadow:0 8px 24px #0002}.note-annotate-menu.hidden{display:none}.note-annotate-menu button{display:flex;align-items:center;gap:5px;margin:0!important;padding:6px 8px!important;border-radius:7px!important;background:#f2f2f7!important;color:#3a3a3c!important;font-size:12px!important;font-weight:400!important}.note-annotate-menu i{width:14px;height:14px;border-radius:3px}.note-annotate-menu [data-annotation=bold] i{position:relative}.note-annotate-menu [data-annotation=bold] i::after{content:'B';position:absolute;inset:-3px 0 0;color:#3a3a3c;font-size:14px;font-style:normal;font-weight:800;text-align:center}.note-annotate-menu [data-annotation=yellow] i{background:#ffe58f}.note-annotate-menu [data-annotation=green] i{background:#bfe7c8}.note-annotate-menu [data-annotation=red] i{background:#f4b9bd}.note-annotate-menu [data-annotation=text-red] i{position:relative}.note-annotate-menu [data-annotation=text-red] i::after{content:'A';position:absolute;inset:-2px 0 0;color:#c53b3b;font-size:13px;font-style:normal;font-weight:700;text-align:center}.note-annotate-menu [data-annotation=underline] i{border-bottom:2px solid #7fa7c4}.note-annotate-menu [data-annotation=delete] i{position:relative}.note-annotate-menu [data-annotation=delete] i::after{content:'';position:absolute;left:0;right:0;top:6px;border-top:1px solid #8e8e93}
  .timeline-text,.timeline-text .note-markdown{color:#111;font-size:14px;line-height:1.72;text-align:left}.timeline-card .timeline-text .note-markdown .note-paragraph{color:#111!important;line-height:1.72!important;text-align:left!important}.timeline-card .timeline-text .note-markdown .note-field-group,.timeline-card .timeline-text .note-markdown .note-number-group{color:#111!important;text-align:left!important}
  @media (prefers-color-scheme:dark){#noteInput,.note-format-preview,.note-markdown,.timeline-text,.timeline-text .note-markdown{color:#f2f2f7}.note-markdown .note-field-label,.note-markdown .note-field-value,.note-markdown .note-number-marker,.note-markdown .note-number-value,.note-markdown .note-heading,.note-markdown strong{color:#f2f2f7}.note-markdown .note-number-marker{color:#aeaeb2}.note-markdown em{color:#d1d1d6}.note-markdown .note-category,.timeline-text .note-markdown .note-category{border-color:#376947;background:#173d25;color:#7edb94}.note-markdown .note-quote{border-left-color:#8e8e93;background:#2c2c2e;color:#d1d1d6}.note-markdown .note-inline-image-slot img{background:#3a3a3c}.note-markdown .note-inline-image-missing{background:#2c2c2e;color:#98989d}.note-highlight-yellow{background:#6b5d21}.note-highlight-green{background:#245b37}.note-highlight-red{background:#6b3038}.note-text-red{color:#ff8a80}.note-underline-blue{border-bottom-color:#78a9ca}.note-deleted{color:#98989d}.note-annotate-toggle{background:#33383e!important;color:#d1d1d6!important}.note-annotate-menu{border-color:#48484a;background:#2c2c2e;box-shadow:0 8px 24px #0008}.note-annotate-menu button{background:#3a3a3c!important;color:#f2f2f7!important}.note-annotate-menu [data-annotation=bold] i::after{color:#f2f2f7}.note-annotate-menu [data-annotation=text-red] i::after{color:#ff8a80}.timeline-card .timeline-text,.timeline-card .timeline-text .note-markdown,.timeline-card .timeline-text .note-markdown .note-paragraph,.timeline-card .timeline-text .note-markdown .note-field-group,.timeline-card .timeline-text .note-markdown .note-number-group,.timeline-card .timeline-text .note-markdown .note-field-label,.timeline-card .timeline-text .note-markdown .note-field-value,.timeline-card .timeline-text .note-markdown .note-number-value,.timeline-card .timeline-text .note-markdown .note-heading,.timeline-card .timeline-text .note-markdown strong{color:#f2f2f7!important}.timeline-card .timeline-text .note-markdown .note-number-marker{color:#aeaeb2!important}.note-markdown .katex{color:inherit}}
  `;
  document.head.append(typographyStyle);
  const escapeHtml=value=>(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const decodeMathEntities=value=>String(value||'').replace(/&(amp|lt|gt|quot|#39);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[name]));
  const FIELD_LABELS=new Set(['问题','尝试','结果','不确定','下一步','现象','我猜','已有证据','条件 / 版本','做了什么','可能原因','论文 / 概念','关键观点','原文位置（页码 / 图表 / 章节）','和我课题的关系','要核实','研究问题','方法','当前结果','不确定处','书 / 章节','核心内容','我的理解','和研究或生活的关联','想继续追问 / 行动','和谁讨论','达成结论 / 仍有分歧','我准备采取的动作','要做的选择','备选方案','考虑因素','当前决定','之后验证','想到','为什么可能有用','最小验证']);
  const cleanDisplayLine=line=>String(line||'').replace(/(?:&#x20;|&nbsp;)\s*$/gi,'').replace(/(^|[^\\])\\[ \t]*$/,'$1').replace(/[ \t]+$/,'');
  function indentInfo(line){let cleaned=cleanDisplayLine(line),match=cleaned.match(/^([　 \t]*)/),prefix=match?match[1]:'',full=(prefix.match(/　/g)||[]).length,spaces=(prefix.match(/ /g)||[]).length,tabs=(prefix.match(/\t/g)||[]).length;return {prefix,depth:Math.min(5,tabs+Math.ceil(full/2)+Math.ceil(spaces/4)),body:cleaned.slice(prefix.length)}}
  function fieldMatch(line){let info=indentInfo(line),match=info.body.match(/^([^：:\n]{1,24})([：:])([　 \t]*)(.*)$/);if(!match)return null;let label=match[1].replace(/\s+/g,' ').trim(),isLayer=/^第(?:[一二三四五六七八九十百]+|\d+)层$/.test(label);if(!FIELD_LABELS.has(label)&&!isLayer)return null;return {depth:info.depth,label:`${label}${match[2]}`,value:match[4]}}
  function numberMatch(line){let info=indentInfo(line),match=info.body.match(/^(\d{1,3}[.．](?=[　 \t])|\d{1,3}、|[一二三四五六七八九十百]+、|[（(](?:\d{1,3}|[一二三四五六七八九十百]+)[）)]|[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])[　 \t]*(.+)$/);return match?{depth:info.depth,marker:match[1],value:match[2]}:null}
  function normalizeMath(source){
    let value=decodeMathEntities(source).replace(/(?:&#x20;|&nbsp;)/gi,' ').trim();
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
    if(!window.katex)return `<code class="note-math-source note-math-pending">${escapeHtml(source)}</code>`;
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
    value=value.replace(/\[\[加粗::([^\]\n]+?)\]\]/g,'<strong class="note-annotation note-bold">$1</strong>');
    value=value.replace(/\[\[(黄|绿|红|红字|下划线)::([^\]\n]+?)\]\]/g,(_,kind,content)=>`<span class="note-annotation ${kind==='黄'?'note-highlight-yellow':kind==='绿'?'note-highlight-green':kind==='红'?'note-highlight-red':kind==='红字'?'note-text-red':'note-underline-blue'}">${content}</span>`);
    return value.replace(/\uE000(\d+)\uE001/g,(_,index)=>tokens[+index]);
  }
  function plainNoteText(text){return String(text||'').replace(/\[\[(?:加粗|黄|绿|红|红字|下划线)::([^\]\n]+?)\]\]/g,'$1').replace(/~~([^~\n]+)~~/g,'$1')}
  const depthStyle=depth=>` style="--note-depth:${Math.max(0,Math.min(5,depth||0))}"`;
  const isSpecialLine=line=>{let trimmed=String(line||'').trim();return !trimmed||/^\uE100\d+\uE101$|^\[\[图片::[^\]]+\]\]$|^(#{1,3})\s+|^>\s?|^```|^\$\$\s*$|^\\+\[|^【[^】]+】\s*$|^[-*+]\s+/.test(trimmed)||!!fieldMatch(line)||!!numberMatch(line)};
  function fieldGroup(lines,start){let first=fieldMatch(lines[start]),depth=first.depth,rows=[],index=start;while(index<lines.length){let field=fieldMatch(lines[index]);if(!field||field.depth!==depth)break;let values=[field.value],next=index+1;while(next<lines.length&&!isSpecialLine(lines[next])&&/^[　 \t]+/.test(lines[next])){values.push(indentInfo(lines[next]).body.trimStart());next++}rows.push(`<span class="note-field-label">${inline(field.label)}</span><span class="note-field-value">${values.map(value=>inline(value)).join('<br>')}</span>`);index=next}return {html:`<div class="note-field-group"${depthStyle(depth)}>${rows.join('')}</div>`,index}}
  function numberGroup(lines,start){let first=numberMatch(lines[start]),depth=first.depth,rows=[],index=start;while(index<lines.length){let numbered=numberMatch(lines[index]);if(!numbered||numbered.depth!==depth)break;let values=[numbered.value],next=index+1;while(next<lines.length&&!isSpecialLine(lines[next])){values.push(indentInfo(lines[next]).body.trimStart());next++}rows.push(`<span class="note-number-marker">${inline(numbered.marker)}</span><span class="note-number-value">${values.map(value=>inline(value)).join('<br>')}</span>`);index=next}return {html:`<div class="note-number-group"${depthStyle(depth)}>${rows.join('')}</div>`,index}}
  function prepareCopiedDisplayMath(text){
    let formulas=[];
    let stash=formula=>{let cleaned=formula.replace(/\*\*/g,'').replace(/(^|[^\\])\\[ \t]*\n/g,'$1 ').replace(/(?:&#x20;|&nbsp;)/gi,' ').replace(/[ \t]*\n[ \t]*/g,' ').replace(/[ \t]{2,}/g,' ').trim(),token=`\uE100${formulas.length}\uE101`;formulas.push(cleaned);return `\n${token}\n`};
    let process=segment=>segment
      .replace(/\$\$([\s\S]*?)\$\$/g,(_,formula)=>stash(formula))
      .replace(/(?:\*\*\s*)?(?:\$\s*)?\\+\[([\s\S]*?)\\+\](?:\s*\$)?(?:\s*\*\*)?(?:\s*(?:&#x20;|&nbsp;))?/gi,(_,formula)=>stash(formula));
    let source=String(text||'').replace(/\r/g,''),segments=source.split(/(```[\s\S]*?```)/g);
    source=segments.map((segment,index)=>index%2?segment:process(segment)).join('');
    return {source,formulas};
  }
  function renderNoteMarkup(text){
    let prepared=prepareCopiedDisplayMath(text),lines=prepared.source.split('\n'),html=[],index=0;
    while(index<lines.length){
      let line=lines[index];
      if(!line.trim()){let blankCount=0;while(index<lines.length&&!lines[index].trim()){blankCount++;index++}if(html.length&&index<lines.length)html.push(`<div class="note-blank-line${blankCount>1?' note-blank-line-double':''}" aria-hidden="true"></div>`);continue}
      let inlineImage=line.trim().match(/^\[\[图片::([^\]]+)\]\]$/);if(inlineImage){html.push(`<div class="note-inline-image-slot" data-note-image-id="${escapeHtml(inlineImage[1])}"><span class="note-inline-image-missing">图片加载中…</span></div>`);index++;continue}
      let copiedDisplay=line.trim().match(/^\uE100(\d+)\uE101$/);if(copiedDisplay){html.push(`<div class="note-display-math">${mathHtml(prepared.formulas[+copiedDisplay[1]],true)}</div>`);index++;continue}
      if(/^```/.test(line)){let code=[];index++;while(index<lines.length&&!/^```/.test(lines[index]))code.push(lines[index++]);if(index<lines.length)index++;html.push(`<pre class="note-code-block"><code>${escapeHtml(code.join('\n'))}</code></pre>`);continue}
      if(/^\$\$\s*$/.test(line.trim())){let formula=[];index++;while(index<lines.length&&!/^\$\$\s*$/.test(lines[index].trim()))formula.push(lines[index++]);if(index<lines.length)index++;html.push(`<div class="note-display-math">${mathHtml(formula.join('\n').trim(),true)}</div>`);continue}
      let heading=line.match(/^(#{1,3})\s+(.+)$/);if(heading){let level=heading[1].length;html.push(`<h${level} class="note-heading">${inline(heading[2])}</h${level}>`);index++;continue}
      let quote=line.match(/^>\s?(.*)$/);if(quote){let quoteLines=[];while(index<lines.length&&/^>\s?/.test(lines[index]))quoteLines.push(lines[index++].replace(/^>\s?/,''));html.push(`<blockquote class="note-quote">${quoteLines.map(item=>inline(item)).join('<br>')}</blockquote>`);continue}
      let unordered=line.match(/^[-*+]\s+(.+)$/);if(unordered){let items=[];while(index<lines.length){let found=lines[index].match(/^[-*+]\s+(.+)$/);if(!found)break;items.push(`<li>${inline(found[1])}</li>`);index++}html.push(`<ul class="note-markdown-list">${items.join('')}</ul>`);continue}
      if(/^【[^】]+】\s*$/.test(line.trim())){html.push(`<p class="note-category">${escapeHtml(line.trim())}</p>`);index++;continue}
      if(fieldMatch(line)){let group=fieldGroup(lines,index);html.push(group.html);index=group.index;continue}
      if(numberMatch(line)){let group=numberGroup(lines,index);html.push(group.html);index=group.index;continue}
      let info=indentInfo(line);html.push(`<p class="note-paragraph"${depthStyle(info.depth)}>${inline(info.body)}</p>`);index++;
    }
    return `<div class="note-markdown">${html.join('')}</div>`;
  }
  window.renderNoteMarkup=renderNoteMarkup;
  window.plainNoteText=plainNoteText;
  window.noteInlineImageIds=text=>{let ids=[],pattern=/\[\[图片::([^\]]+)\]\]/g,match,source=String(text||'');while((match=pattern.exec(source)))ids.push(match[1]);return ids};
  window.hydrateNoteInlineImages=(root,images=[])=>{let used=new Set(),map=new Map(images.map(image=>[image.id,image]));root?.querySelectorAll?.('.note-inline-image-slot[data-note-image-id]').forEach(slot=>{let id=slot.dataset.noteImageId,image=map.get(id),blob=image?.blob||image?.file;if(!blob){slot.innerHTML='<span class="note-inline-image-missing">图片未找到</span>';return}used.add(id);let button=document.createElement('button'),preview=document.createElement('img');button.type='button';button.setAttribute('aria-label','查看原图');preview.alt='随手记图片';preview.src=URL.createObjectURL(blob);button.append(preview);button.onclick=event=>{event.preventDefault();event.stopPropagation();if(typeof openNoteImage==='function')openNoteImage(blob)};slot.replaceChildren(button)});return used};
  noteContent=renderNoteMarkup;
  function redrawNoteSurfaces(){
    let previewNode=document.querySelector('#noteFormatPreview'),inputNode=document.querySelector('#noteInput');
    if(previewNode&&inputNode&&!previewNode.classList.contains('hidden')){previewNode.innerHTML=renderNoteMarkup(inputNode.value);window.hydrateNoteInlineImages(previewNode,window.noteEditorImages||[])}
    if(document.querySelector('#home.active'))window.renderNotes?.();
    if(document.querySelector('#archive.active'))window.archive?.();
    if(document.querySelector('#notesTimeline.active'))window.renderNotesTimeline?.();
  }
  function announceFormatReady(){window.dispatchEvent(new Event('phd-note-format-ready'));requestAnimationFrame(redrawNoteSurfaces)}
  let katexRetryCount=0;
  function ensureKatex(){
    if(window.katex){announceFormatReady();return}
    if(document.querySelector('script[data-katex-retry]')||katexRetryCount>=2){announceFormatReady();return}
    katexRetryCount++;
    let script=document.createElement('script');script.src='vendor/katex/katex.min.js';script.dataset.katexRetry=String(katexRetryCount);
    script.onload=()=>{script.remove();announceFormatReady()};
    script.onerror=()=>{script.remove();setTimeout(ensureKatex,250)};
    document.head.append(script);
  }
  ensureKatex();

  let input=$('#noteInput');if(!input)return;
  let toolbar=document.createElement('div');toolbar.className='note-format-toolbar';toolbar.innerHTML='<div class="note-format-switch" role="tablist" aria-label="随手记显示模式"><i aria-hidden="true"></i><button type="button" class="selected" data-mode="edit" role="tab">编辑</button><button type="button" data-mode="preview" role="tab">预览</button></div><div class="note-annotate-wrap"><button type="button" class="note-annotate-toggle" aria-expanded="false">批注</button><div class="note-annotate-menu hidden"><button type="button" data-annotation="bold"><i></i>加粗</button><button type="button" data-annotation="yellow"><i></i>黄色</button><button type="button" data-annotation="green"><i></i>绿色</button><button type="button" data-annotation="red"><i></i>红色</button><button type="button" data-annotation="text-red"><i></i>红字</button><button type="button" data-annotation="underline"><i></i>下划线</button><button type="button" data-annotation="delete"><i></i>删除线</button><button type="button" data-annotation="clear">清除</button></div></div><small>支持批注与 $公式$</small>';
  let preview=document.createElement('div');preview.id='noteFormatPreview';preview.className='note-format-preview hidden';
  input.before(toolbar);input.after(preview);
  function show(mode){let previewing=mode==='preview',toggle=toolbar.querySelector('.note-format-switch');toggle.classList.toggle('previewing',previewing);toolbar.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button.dataset.mode===mode);button.setAttribute('aria-selected',String(button.dataset.mode===mode))});input.hidden=previewing;preview.classList.toggle('hidden',!previewing);if(previewing){preview.innerHTML=renderNoteMarkup(input.value)||'<p class="empty">还没有可预览的内容。</p>';window.hydrateNoteInlineImages(preview,window.noteEditorImages||[])}}
  let toggle=toolbar.querySelector('.note-format-switch'),dragStart=null,skipClick=false;
  toolbar.querySelectorAll('button').forEach(button=>button.onclick=()=>{if(skipClick)return;show(button.dataset.mode)});
  if(!window.phdDesktop){
    toggle.addEventListener('pointerdown',event=>{dragStart=event.clientX;toggle.setPointerCapture?.(event.pointerId)});
    toggle.addEventListener('pointerup',event=>{if(dragStart===null)return;let delta=event.clientX-dragStart;dragStart=null;if(Math.abs(delta)<14)return;skipClick=true;show(delta>0?'preview':'edit');setTimeout(()=>skipClick=false,0)});
    toggle.addEventListener('pointercancel',()=>dragStart=null);
  }
  let annotationWrap=toolbar.querySelector('.note-annotate-wrap'),annotationToggle=toolbar.querySelector('.note-annotate-toggle'),annotationMenu=toolbar.querySelector('.note-annotate-menu'),savedSelection={start:0,end:0};
  function rememberSelection(){savedSelection={start:input.selectionStart||0,end:input.selectionEnd||0}}
  ['select','keyup','mouseup','touchend'].forEach(type=>input.addEventListener(type,rememberSelection));
  annotationToggle.onpointerdown=rememberSelection;annotationToggle.onclick=()=>{let opening=annotationMenu.classList.contains('hidden');annotationMenu.classList.toggle('hidden',!opening);annotationToggle.setAttribute('aria-expanded',String(opening))};
  annotationMenu.addEventListener('mousedown',event=>event.preventDefault());
  annotationMenu.querySelectorAll('[data-annotation]').forEach(button=>button.onclick=()=>{let start=input.selectionStart!==input.selectionEnd?input.selectionStart:savedSelection.start,end=input.selectionStart!==input.selectionEnd?input.selectionEnd:savedSelection.end;if(end<=start){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false');alert('请先选择要批注的文字。');return}let selected=input.value.slice(start,end),type=button.dataset.annotation,replaced;if(type==='clear')replaced=plainNoteText(selected);else{let markers={bold:['[[加粗::',']]'],yellow:['[[黄::',']]'],green:['[[绿::',']]'],red:['[[红::',']]'],'text-red':['[[红字::',']]'],underline:['[[下划线::',']]'],delete:['~~','~~']}[type];replaced=selected.split('\n').map(line=>line?`${markers[0]}${line}${markers[1]}`:line).join('\n')}input.setRangeText(replaced,start,end,'select');rememberSelection();input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')});
  document.addEventListener('pointerdown',event=>{if(!annotationWrap.contains(event.target)){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')}});
  input.addEventListener('input',()=>{if(!preview.classList.contains('hidden')){preview.innerHTML=renderNoteMarkup(input.value);window.hydrateNoteInlineImages(preview,window.noteEditorImages||[])}});
})();
