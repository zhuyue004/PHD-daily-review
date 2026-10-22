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
  .note-table-wrap{max-width:100%;margin:10px 0;overflow-x:auto;overflow-y:hidden;border:1px solid #dedee3;border-radius:10px;-webkit-overflow-scrolling:touch}.note-markdown .note-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;table-layout:auto;font-size:14px;line-height:1.62}.note-markdown .note-table th,.note-markdown .note-table td{min-width:9em;max-width:min(68vw,430px);padding:9px 11px;vertical-align:top;text-align:left;white-space:normal;overflow-wrap:anywhere;border-right:1px solid #dedee3;border-bottom:1px solid #dedee3}.note-markdown .note-table th{background:#f2f2f7;color:#1c1c1e;font-weight:650}.note-markdown .note-table tr>*:last-child{border-right:0}.note-markdown .note-table tbody tr:last-child>*{border-bottom:0}
  .note-markdown code,.note-math-source{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.note-display-math{display:block;max-width:100%;margin:10px 0;overflow-x:auto;overflow-y:hidden;text-align:center;text-indent:0;-webkit-overflow-scrolling:touch}.note-display-math .katex-display{margin:.4em 0}.note-markdown .katex,.note-markdown .katex *{overflow-wrap:normal;word-break:normal}.note-math-source{display:inline-block;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;text-indent:0}
  .note-annotation{padding:1px 2px;border-radius:3px;color:inherit}.note-bold{font-weight:700}.note-highlight-yellow{background:#ffe58f}.note-highlight-green{background:#bfe7c8}.note-highlight-red{background:#f4b9bd}.note-text-red{color:#c53b3b}.note-text-blue{color:#2f6fae}.note-underline-blue{padding-bottom:1px;border-bottom:2px solid #7fa7c4}.note-deleted{color:#8e8e93;text-decoration-thickness:1.5px}.note-divider{width:100%;height:0;margin:15px 0;border:0;border-top:1px solid #c7c7cc}
  .note-annotate-wrap{position:relative}.note-annotate-toggle{height:31px!important;margin:0!important;padding:0 9px!important;border-radius:8px!important;background:#edf0f3!important;color:#5f6872!important;font-size:13px!important;font-weight:500!important}.note-annotate-menu{position:absolute;z-index:12;top:37px;left:0;display:grid;grid-template-columns:repeat(3,max-content);gap:6px;width:max-content;padding:8px;border:1px solid #dedee3;border-radius:11px;background:#fff;box-shadow:0 8px 24px #0002}.note-annotate-menu.hidden{display:none}.note-annotate-menu button{display:flex;align-items:center;gap:5px;margin:0!important;padding:6px 8px!important;border-radius:7px!important;background:#f2f2f7!important;color:#3a3a3c!important;font-size:12px!important;font-weight:400!important}.note-annotate-menu i{width:14px;height:14px;border-radius:3px}.note-annotate-menu [data-annotation=bold] i{position:relative}.note-annotate-menu [data-annotation=bold] i::after{content:'B';position:absolute;inset:-3px 0 0;color:#3a3a3c;font-size:14px;font-style:normal;font-weight:800;text-align:center}.note-annotate-menu [data-annotation=yellow] i{background:#ffe58f}.note-annotate-menu [data-annotation=green] i{background:#bfe7c8}.note-annotate-menu [data-annotation=red] i{background:#f4b9bd}.note-annotate-menu [data-annotation=text-red] i{position:relative}.note-annotate-menu [data-annotation=text-red] i::after{content:'A';position:absolute;inset:-2px 0 0;color:#c53b3b;font-size:13px;font-style:normal;font-weight:700;text-align:center}.note-annotate-menu [data-annotation=underline] i{border-bottom:2px solid #7fa7c4}.note-annotate-menu [data-annotation=delete] i{position:relative}.note-annotate-menu [data-annotation=delete] i::after{content:'';position:absolute;left:0;right:0;top:6px;border-top:1px solid #8e8e93}
  .timeline-text,.timeline-text .note-markdown{color:#111;font-size:14px;line-height:1.72;text-align:left}.timeline-card .timeline-text .note-markdown .note-paragraph{color:#111!important;line-height:1.72!important;text-align:left!important}.timeline-card .timeline-text .note-markdown .note-field-group,.timeline-card .timeline-text .note-markdown .note-number-group{color:#111!important;text-align:left!important}
  @media (prefers-color-scheme:dark){#noteInput,.note-format-preview,.note-markdown,.timeline-text,.timeline-text .note-markdown{color:#f2f2f7}.note-field-label,.note-markdown .note-heading,.note-markdown strong{color:#f2f2f7}.note-markdown em{color:#d1d1d6}.note-markdown .note-category,.timeline-text .note-markdown .note-category{border-color:#376947;background:#173d25;color:#7edb94}.note-markdown .note-quote{border-left-color:#8e8e93;background:#2c2c2e;color:#d1d1d6}.note-markdown .note-inline-image-missing{background:#2c2c2e;color:#98989d}.note-table-wrap{border-color:#48484a}.note-markdown .note-table th,.note-markdown .note-table td{border-color:#48484a}.note-markdown .note-table th{background:#2c2c2e;color:#f2f2f7}.note-highlight-yellow{background:#6b5d21}.note-highlight-green{background:#245b37}.note-highlight-red{background:#6b3038}.note-text-red{color:#ff8a80}.note-text-blue{color:#78a9df}.note-underline-blue{border-bottom-color:#78a9ca}.note-deleted{color:#98989d}.note-divider{border-top-color:#54545a}.note-annotate-toggle{background:#33383e!important;color:#d1d1d6!important}.note-annotate-menu{border-color:#48484a;background:#2c2c2e;box-shadow:0 8px 24px #0008}.note-annotate-menu button{background:#3a3a3c!important;color:#f2f2f7!important}.note-annotate-menu [data-annotation=text-red] i::after{color:#ff8a80}.note-annotate-menu [data-annotation=text-blue] i::after{color:#78a9df}.timeline-card .timeline-text .note-markdown .note-paragraph{color:#f2f2f7!important}}
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
    // iOS 从 ChatGPT 的富文本剪贴板常夹带不可见字符、NBSP、全角反斜杠或 <br>。
    // 这些字符对普通文字无害，却会让 KaTeX 把同一条公式解析成错误的命令。
    let value=decodeMathEntities(source).replace(/(?:&#x20;|&nbsp;)/gi,' ').replace(/<br\s*\/?\s*>/gi,' ').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFE00-\uFE0F\uFEFF]/g,'').replace(/\u00a0/g,' ').replace(/\uFF3C/g,'\\').replace(/\*\*\s*/g,'').replace(/\\{2,}%/g,'\\%').trim();
    // 少数 iPhone 富文本会把 "\\sigma_x" 压成 "\\sigmax"。这些是固定的
    // 科学符号+坐标下标组合，恢复下标不会影响普通英文单词。
    value=value.replace(/\\(varepsilon|epsilon|sigma|gamma|tau|lambda|mu|rho)(xx|xy|yx|yy|x|y|z)\b/g,(_,name,sub)=>`\\${name}_{${sub}}`);
    // 兼容把 \[...\] 再包进 $...$ 的常见写法；转换为 KaTeX 可识别的多行公式。
    if(/^\\+\[/.test(value)&&/\\+\]/.test(value)){
      value=value.replace(/^\\+\[\s*/,'').replace(/\\+\]\s*(?:\\+\[)?/g,'\n').replace(/\]\s*$/,'').replace(/\\{2,}%/g,'\\%').trim();
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
    // KaTeX 默认会把解析错误标成红色，容易被误解为用户做了红色批注。
    // 此处改为严格抛错并回退为普通黑色源码；常见的 iPhone 隐形字符已在上方清理。
    try{return window.katex.renderToString(source,{displayMode:display,throwOnError:true,strict:'ignore',trust:false})}
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
    // 变量下标和希腊字母常夹在中文句子中，ChatGPT/iOS 复制时又会丢掉
    // 数学定界符。这里仅识别明确的科学记号，避免把普通正文误当公式。
    const greek='alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega';
    // 在段落内先修复被富文本压扁的 \sigmax 等形式；否则下面的希腊字母
    // 匹配会先拿走 \sigma，而把 x 留成普通文字。
    value=value.replace(/\\(varepsilon|epsilon|sigma|gamma|tau|lambda|mu|rho)(xx|xy|yx|yy|x|y|z)\b/g,(_,name,sub)=>`\\${name}_{${sub}}`);
    // 关系式必须先于单个下标变量处理；否则 f_0 会先被替换，留下 W \leftrightarrow。
    value=value.replace(/\b([A-Za-z][A-Za-z0-9]*(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?\s*\\(?:leftrightarrow|rightarrow|leftarrow|Rightarrow|Longrightarrow|approx|sim|to)\s*[A-Za-z][A-Za-z0-9]*(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?)/g,(_,formula)=>put(mathHtml(formula,false)));
    value=value.replace(/\b([A-Za-z][A-Za-z0-9]*(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?\s*=\s*\\frac\{[^{}]+\}\{[^{}]+\})/g,(_,formula)=>put(mathHtml(formula,false)));
    value=value.replace(/\*([A-Za-z])\*\{([A-Za-z0-9]+)\}/g,(_,name,sub)=>put(mathHtml(`${name}_{${sub}}`,false)));
    value=value.replace(/([A-Za-z])\*\{([A-Za-z0-9]+)\}/g,(_,name,sub)=>put(mathHtml(`${name}_{${sub}}`,false)));
    value=value.replace(/([A-Za-z])\*([0-9]+)/g,(_,name,sub)=>put(mathHtml(`${name}_{${sub}}`,false)));
    value=value.replace(/(?<![A-Za-z0-9])([A-Za-z](?:_\{[A-Za-z0-9]+\}|_[A-Za-z0-9]+|\^\{[A-Za-z0-9]+\}|\^[A-Za-z0-9]+))+(?![A-Za-z0-9])/g,(_,formula)=>put(mathHtml(formula,false)));
    // 希腊字母带下标（如 \\sigma_x、\\tau_{xy}）也常直接出现在中文段落中。
    // 旧规则只替换了命令本体，留下的 _x 会被 Markdown 当作强调符号。
    value=value.replace(new RegExp(`\\\\(?:${greek})(?:_(?:\\{[^}]+\\}|[A-Za-z0-9]+))?(?:\\^(?:\\{[^}]+\\}|[A-Za-z0-9]+))?`,'g'),formula=>put(mathHtml(formula,false)));
    // 没有定界符的短公式：只接受明确的分式，防止普通句子被误判。
    value=value.replace(/(?<![A-Za-z\\])\\frac\{[^{}]+\}\{[^{}]+\}(?![A-Za-z])/g,formula=>put(mathHtml(formula,false)));
    value=value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    value=value.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
    value=value.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>');
    value=value.replace(/~~([^~\n]+)~~/g,'<del class="note-deleted">$1</del>');
    value=value.replace(/\[\[加粗::([^\]\n]+?)\]\]/g,'<strong class="note-annotation note-bold">$1</strong>');
    value=value.replace(/\[\[(黄|绿|红|红字|蓝字|下划线)::([^\]\n]+?)\]\]/g,(_,kind,content)=>`<span class="note-annotation ${kind==='黄'?'note-highlight-yellow':kind==='绿'?'note-highlight-green':kind==='红'?'note-highlight-red':kind==='红字'?'note-text-red':kind==='蓝字'?'note-text-blue':'note-underline-blue'}">${content}</span>`);
    return value.replace(/\uE000(\d+)\uE001/g,(_,index)=>tokens[+index]);
  }
  function plainNoteText(text){return String(text||'').replace(/\[\[(?:加粗|黄|绿|红|红字|蓝字|下划线)::([^\]\n]+?)\]\]/g,'$1').replace(/~~([^~\n]+)~~/g,'$1')}
  const depthStyle=depth=>` style="--note-depth:${Math.max(0,Math.min(5,depth||0))}"`;
  const isSpecialLine=line=>{let trimmed=String(line||'').trim();return !trimmed||/^\uE100\d+\uE101$|^\[\[图片::[^\]]+\]\]$|^(#{1,3})\s+|^>\s?|^```|^\$\$\s*$|^\\+\[|^---+$|^【[^】]+】\s*$|^[-*+]\s+|^\|.*\|\s*$/.test(trimmed)||!!fieldMatch(line)||!!numberMatch(line)};
  function fieldGroup(lines,start){let first=fieldMatch(lines[start]),depth=first.depth,rows=[],index=start;while(index<lines.length){let field=fieldMatch(lines[index]);if(!field||field.depth!==depth)break;let values=[field.value],next=index+1;while(next<lines.length&&!isSpecialLine(lines[next])&&/^[　 \t]+/.test(lines[next])){values.push(indentInfo(lines[next]).body.trimStart());next++}rows.push(`<span class="note-field-label">${inline(field.label)}</span><span class="note-field-value">${values.map(value=>inline(value)).join('<br>')}</span>`);index=next}return {html:`<div class="note-field-group"${depthStyle(depth)}>${rows.join('')}</div>`,index}}
  function numberGroup(lines,start){let first=numberMatch(lines[start]),depth=first.depth,rows=[],index=start;while(index<lines.length){let numbered=numberMatch(lines[index]);if(!numbered||numbered.depth!==depth)break;let values=[numbered.value],next=index+1;while(next<lines.length&&!isSpecialLine(lines[next])){values.push(indentInfo(lines[next]).body.trimStart());next++}rows.push(`<span class="note-number-marker">${inline(numbered.marker)}</span><span class="note-number-value">${values.map(value=>inline(value)).join('<br>')}</span>`);index=next}return {html:`<div class="note-number-group"${depthStyle(depth)}>${rows.join('')}</div>`,index}}
  function splitMarkdownTableRow(line){let value=String(line||'').trim();if(!value.includes('|'))return null;if(value.startsWith('|'))value=value.slice(1);if(value.endsWith('|')&&!value.endsWith('\\|'))value=value.slice(0,-1);let cells=[],cell='',escaped=false;for(let character of value){if(escaped){cell+=character;escaped=false;continue}if(character==='\\'){escaped=true;continue}if(character==='|'){cells.push(cell.trim());cell='';continue}cell+=character}if(escaped)cell+='\\';cells.push(cell.trim());return cells.length>1?cells:null}
  function isMarkdownTableDivider(line){let cells=splitMarkdownTableRow(line);return !!cells&&cells.every(cell=>/^:?-{3,}:?$/.test(cell.replace(/\s/g,'')))}
  function markdownTable(lines,start){let headers=splitMarkdownTableRow(lines[start]);if(!headers||!isMarkdownTableDivider(lines[start+1]))return null;let rows=[],index=start+2;while(index<lines.length){let row=splitMarkdownTableRow(lines[index]);if(!row)break;rows.push(row);index++}let width=Math.max(headers.length,...rows.map(row=>row.length),0),fill=row=>Array.from({length:width},(_,column)=>row[column]||'');headers=fill(headers);rows=rows.map(fill);let cells=values=>values.map(value=>`<td>${inline(value)}</td>`).join('');return {html:`<div class="note-table-wrap" tabindex="0" role="region" aria-label="表格，可横向滑动"><table class="note-table"><thead><tr>${headers.map(value=>`<th>${inline(value)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${cells(row)}</tr>`).join('')}</tbody></table></div>`,index}}
  // ChatGPT 有时只复制公式内容而丢掉外层的 \(...\)。连续的 LaTeX 指令
  // （如 \text、\rightarrow）仍应作为一条显示公式，而不是原样展示反斜杠。
  const BARE_MATH_COMMAND=/^\\(?:text|mathrm|mathbf|mathit|operatorname|boxed|rightarrow|leftarrow|Rightarrow|Longrightarrow|leftrightarrow|mapsto|to|gg|ll|cdot|times|frac|sqrt|sum|int|partial|rho|mu|lambda|epsilon|varepsilon|alpha|beta|gamma|delta|sigma|omega|theta|phi|Phi|psi|chi|eta|xi|zeta|tau|nu|pi|kappa|ell|infty|leq|geq|neq|approx|sim|pm|mp|ldots|cdots|dots|quad|qquad|overline|underline|hat|bar|vec|begin|end|ln|log|sin|cos|tan|exp)\b/;
  const BARE_RELATION=/^[A-Za-z][A-Za-z0-9]*(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?(?:\^(?:\{[^}]+\}|[A-Za-z0-9]+))?\s*(?:=|\\(?:gg|ll|approx|sim|leq|geq|neq|rightarrow|leftarrow|leftrightarrow|to))/;
  const bareLatexLine=line=>{let value=cleanDisplayLine(line).trim();if(/[\\＼]+[\[(]|\[\[|\]\]/.test(value))return false;return BARE_MATH_COMMAND.test(value)||BARE_RELATION.test(value)};
  function bareLatexBlock(lines,start){let items=[],index=start;while(index<lines.length){let value=cleanDisplayLine(lines[index]).trim();if(bareLatexLine(value)||(items.length&&/^[+-]$|^=\s*(?:0|\?)$/.test(value))){items.push(value);index++;continue}break}if(!items.length)return null;let equationCount=items.filter(item=>/^[A-Za-z][A-Za-z0-9]*(?:_(?:\{[^}]+\}|[A-Za-z0-9]+))?\s*=|=\s*\?/.test(item)).length,source=equationCount>1?`\\begin{gathered}${items.join('\\\\')}\\end{gathered}`:items.join(' ');return {source,index}}
  function prepareCopiedDisplayMath(text){
    let formulas=[];
    let stash=formula=>{let cleaned=formula.replace(/\*\*/g,'').replace(/(^|[^\\])\\[ \t]*\n/g,'$1 ').replace(/(?:&#x20;|&nbsp;)/gi,' ').replace(/[ \t]*\n[ \t]*/g,' ').replace(/[ \t]{2,}/g,' ').trim(),token=`\uE100${formulas.length}\uE101`;formulas.push(cleaned);return `\n${token}\n`};
    let process=segment=>segment
      .replace(/\$\$([\s\S]*?)\$\$/g,(_,formula)=>stash(formula))
      .replace(/\$\s*(\\+\[[\s\S]*?\\+\](?:\s*\\+\[[\s\S]*?\\+\])+?)\s*\$/g,(_,formula)=>stash(formula))
      .replace(/(?:\*\*\s*)?(?:\$\s*)?[\\＼]+\[([\s\S]*?)[\\＼]+\](?:\s*\$)?(?:\s*\*\*)?(?:\s*(?:&#x20;|&nbsp;))?/gi,(_,formula)=>stash(formula))
      // ChatGPT 在手机窄屏复制时会把原本的 \(...\) 在等号处换行。
      // 单行公式仍由 inline() 处理；只有跨行的才提升为完整的显示公式。
      .replace(/(?:\*\*\s*)?[\\＼]+\(([\s\S]*?)[\\＼]+\)(?:\s*\*\*)?/g,(all,formula)=>/[\r\n]/.test(formula)?stash(formula):all);
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
      let bareMath=bareLatexBlock(lines,index);if(bareMath){html.push(`<div class="note-display-math">${mathHtml(bareMath.source,true)}</div>`);index=bareMath.index;continue}
      if(/^```/.test(line)){let code=[];index++;while(index<lines.length&&!/^```/.test(lines[index]))code.push(lines[index++]);if(index<lines.length)index++;html.push(`<pre class="note-code-block"><code>${escapeHtml(code.join('\n'))}</code></pre>`);continue}
      if(/^\$\$\s*$/.test(line.trim())){let formula=[];index++;while(index<lines.length&&!/^\$\$\s*$/.test(lines[index].trim()))formula.push(lines[index++]);if(index<lines.length)index++;html.push(`<div class="note-display-math">${mathHtml(formula.join('\n').trim(),true)}</div>`);continue}
      if(/^---+$/.test(line.trim())){html.push('<hr class="note-divider" aria-hidden="true">');index++;continue}
      let table=markdownTable(lines,index);if(table){html.push(table.html);index=table.index;continue}
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
  // KaTeX stays available after its first successful load. Re-announcing it
  // every time the desktop window regains focus needlessly rebuilt Archive and
  // discarded transient UI state while the user was reading.
  let katexReadyAnnounced=false;
  function announceFormatReady(){if(katexReadyAnnounced)return;katexReadyAnnounced=true;window.dispatchEvent(new Event('phd-note-format-ready'));requestAnimationFrame(redrawNoteSurfaces)}
  // iPhone 的 PWA 从 Safari 缓存恢复时，界面可能先恢复而 KaTeX 还没有可用。
  // 仅当引擎真实可用时重绘公式；回到前台时再补一次确认，避免保留原始公式文本。
  let katexRetryCount=0,katexLoading=false;
  function ensureKatex(){
    if(window.katex){announceFormatReady();return}
    if(katexLoading||katexRetryCount>=5)return;
    katexLoading=true;katexRetryCount++;
    let script=document.createElement('script');script.src='vendor/katex/katex.min.js';script.async=true;script.dataset.katexRetry=String(katexRetryCount);
    script.onload=()=>{katexLoading=false;script.remove();announceFormatReady()};
    script.onerror=()=>{katexLoading=false;script.remove();let delay=Math.min(4000,250*(2**(katexRetryCount-1)));setTimeout(ensureKatex,delay)};
    document.head.append(script);
  }
  ensureKatex();
  window.addEventListener?.('pageshow',ensureKatex);
  document.addEventListener?.('visibilitychange',()=>{if(!document.hidden)ensureKatex()});

  let input=$('#noteInput');if(!input)return;
  let toolbar=document.createElement('div');toolbar.className='note-format-toolbar';toolbar.innerHTML='<div class="note-format-switch" role="tablist" aria-label="随手记显示模式"><i aria-hidden="true"></i><button type="button" class="selected" data-mode="edit" role="tab">编辑</button><button type="button" data-mode="preview" role="tab">预览</button></div><div class="note-annotate-wrap"><button type="button" class="note-annotate-toggle" aria-expanded="false">批注</button><div class="note-annotate-menu hidden"><button type="button" data-annotation="bold"><i></i>加粗</button><button type="button" data-annotation="yellow"><i></i>黄色</button><button type="button" data-annotation="green"><i></i>绿色</button><button type="button" data-annotation="red"><i></i>红色</button><button type="button" data-annotation="text-red"><i></i>红字</button><button type="button" data-annotation="text-blue"><i></i>蓝字</button><button type="button" data-annotation="underline"><i></i>下划线</button><button type="button" data-annotation="delete"><i></i>删除线</button><button type="button" data-annotation="divider">分割线</button><button type="button" data-annotation="indent-more">增加缩进</button><button type="button" data-annotation="indent-less">减少缩进</button><button type="button" data-annotation="arrow-left">← 左箭头</button><button type="button" data-annotation="arrow-right">→ 右箭头</button><button type="button" data-annotation="clear">清除</button></div></div><small>支持批注与 $公式$</small>';
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
  function indentAtSelection(start,end,increase){let lineStart=input.value.lastIndexOf('\n',Math.max(0,start-1))+1,lineEnd=input.value.indexOf('\n',end);if(lineEnd<0)lineEnd=input.value.length;let selected=input.value.slice(lineStart,lineEnd),replaced=selected.split('\n').map(line=>{if(!line)return line;return increase?`　　${line}`:line.replace(/^(?:　　|\t| {1,4}|　)/,'')}).join('\n');input.setRangeText(replaced,lineStart,lineEnd,'select');rememberSelection()}
  annotationMenu.querySelectorAll('[data-annotation]').forEach(button=>button.onclick=()=>{let start=input.selectionStart!==input.selectionEnd?input.selectionStart:savedSelection.start,end=input.selectionStart!==input.selectionEnd?input.selectionEnd:savedSelection.end,type=button.dataset.annotation;if(type==='indent-more'||type==='indent-less'){indentAtSelection(start,end,type==='indent-more');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false');return}if(type==='arrow-left'||type==='arrow-right'||type==='divider'){let inserted=type==='arrow-left'?'←':type==='arrow-right'?'→':'\n---\n';input.setRangeText(inserted,start,end,'end');rememberSelection();input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false');return}if(end<=start){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false');alert('请先选择要批注的文字。');return}let selected=input.value.slice(start,end),replaced;if(type==='clear')replaced=plainNoteText(selected);else{let markers={bold:['[[加粗::',']]'],yellow:['[[黄::',']]'],green:['[[绿::',']]'],red:['[[红::',']]'],'text-red':['[[红字::',']]'],'text-blue':['[[蓝字::',']]'],underline:['[[下划线::',']]'],delete:['~~','~~']}[type];replaced=selected.split('\n').map(line=>line?`${markers[0]}${line}${markers[1]}`:line).join('\n')}input.setRangeText(replaced,start,end,'select');rememberSelection();input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')});
  document.addEventListener('pointerdown',event=>{if(!annotationWrap.contains(event.target)){annotationMenu.classList.add('hidden');annotationToggle.setAttribute('aria-expanded','false')}});
  input.addEventListener('input',()=>{if(!preview.classList.contains('hidden')){preview.innerHTML=renderNoteMarkup(input.value);window.hydrateNoteInlineImages(preview,window.noteEditorImages||[])}});
})();
