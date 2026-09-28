(()=>{
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const labels=new Set(['问题','现象','我猜','下一步','方法','结果','可能原因','关键观点','和我课题的关系','要核实','做了什么','研究问题','当前结果','不确定处','尝试','结论','修改前','修改后','分析','地点','时间','人物','动作','感受','细节']);
  const renderMath=(source,display)=>{
    const clean=String(source??'').replace(/\\_/g,'_');
    if(!window.katex)return `<code class="observation-math-source">${escapeHtml(clean)}</code>`;
    try{return window.katex.renderToString(clean,{displayMode:display,throwOnError:false,strict:'ignore',trust:false});}
    catch{return `<code class="observation-math-source">${escapeHtml(clean)}</code>`;}
  };
  const inline=value=>{
    const saved=[];
    const keep=html=>`\u0000OBS${saved.push(html)-1}\u0000`;
    let html=escapeHtml(value);
    html=html.replace(/\\+\[([\s\S]*?)\\+\]/g,(_,formula)=>keep(`<span class="observation-display-math">${renderMath(formula,true)}</span>`));
    html=html.replace(/\\+\(([\s\S]*?)\\+\)/g,(_,formula)=>keep(renderMath(formula,false)));
    html=html.replace(/\$\$([\s\S]*?)\$\$/g,(_,formula)=>keep(`<span class="observation-display-math">${renderMath(formula,true)}</span>`));
    html=html.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
    html=html.replace(/\[\[加粗::([^\]\n]+)\]\]/g,'<strong>$1</strong>');
    html=html.replace(/\[\[(黄|绿|红|红字|下划线)::([^\]\n]+)\]\]/g,(_,kind,text)=>`<span class="note-mark mark-${kind}">${text}</span>`);
    return html.replace(/\u0000OBS(\d+)\u0000/g,(_,index)=>saved[Number(index)]||'');
  };
  const depthOf=prefix=>Math.min(3,Math.floor((prefix.replace(/　/g,'  ').length)/2));
  const fieldOf=line=>{
    const match=line.match(/^([ \t　]*)([^：:\n]{1,24})([：:])\s*(.*)$/);
    if(!match)return null;
    const name=match[2].trim();
    return labels.has(name)||/^第[一二三四五六七八九十0-9]+层$/.test(name)?match:null;
  };
  const numberedOf=line=>line.match(/^([ \t　]*)((?:\d+|[一二三四五六七八九十]+)[\.、]|[①②③④⑤⑥⑦⑧⑨⑩]|[（(]\d+[)）])\s*(.*)$/);
  const format=text=>{
    const lines=String(text??'').replace(/\r/g,'').split('\n');
    const blocks=[];
    for(const raw of lines){
      const line=raw.trim();
      if(!line)continue;
      const fullMath=line.match(/^\\+\[([\s\S]*?)\\+\]$/)||line.match(/^\$\$([\s\S]*?)\$\$$/);
      if(fullMath){blocks.push(`<div class="observation-display-math">${renderMath(fullMath[1],true)}</div>`);continue;}
      const title=line.match(/^#{1,3}\s+(.+)$/);
      if(title){blocks.push(`<h4 class="observation-heading">${inline(title[1])}</h4>`);continue;}
      const field=fieldOf(raw);
      if(field){blocks.push(`<p class="observation-field" style="--observation-depth:${depthOf(field[1])}"><b>${inline(field[2].trim()+field[3])}</b><span>${inline(field[4])}</span></p>`);continue;}
      const numbered=numberedOf(raw);
      if(numbered){blocks.push(`<p class="observation-number-row" style="--observation-depth:${depthOf(numbered[1])}"><b>${inline(numbered[2])}</b><span>${inline(numbered[3])}</span></p>`);continue;}
      const bullet=raw.match(/^([ \t　]*)[-•]\s+(.*)$/);
      if(bullet){blocks.push(`<p class="observation-bullet" style="--observation-depth:${depthOf(bullet[1])}"><b>•</b><span>${inline(bullet[2])}</span></p>`);continue;}
      blocks.push(`<p class="observation-paragraph">${inline(line.replace(/^　{1,2}/,''))}</p>`);
    }
    return `<div class="observation-formatted">${blocks.join('')}</div>`;
  };
  window.renderObservationComparisonText=format;
})();
