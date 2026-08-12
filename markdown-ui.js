// iPhone-only lightweight Markdown for quick notes. The original text is always saved unchanged.
if(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){
  function markdownInline(value){
    let text=esc(value||'');
    text=text.replace(/`([^`]+)`/g,'<code>$1</code>');
    text=text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    text=text.replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>');
    return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function renderMarkdown(text){
    let lines=(text||'').replace(/\r/g,'').split('\n'),html=[],list=null,code=null;
    const closeList=()=>{if(list){html.push(`</${list}>`);list=null}};
    const closeCode=()=>{if(code.length||code===null){html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);code=[]}};
    for(let line of lines){
      if(line.startsWith('```')){if(code!==null){closeCode();code=null}else{closeList();code=[]}continue}
      if(code!==null){code.push(line);continue}
      let unordered=line.match(/^\s*[-*+]\s+(.+)/),ordered=line.match(/^\s*\d+\.\s+(.+)/),heading=line.match(/^(#{1,3})\s+(.+)/);
      if(/^\s*(---|\*\*\*|___)\s*$/.test(line)){closeList();html.push('<hr>');continue}
      if(heading){closeList();let level=heading[1].length;html.push(`<h${level}>${markdownInline(heading[2])}</h${level}>`);continue}
      if(unordered){if(list!=='ul'){closeList();list='ul';html.push('<ul>')}html.push(`<li>${markdownInline(unordered[1])}</li>`);continue}
      if(ordered){if(list!=='ol'){closeList();list='ol';html.push('<ol>')}html.push(`<li>${markdownInline(ordered[1])}</li>`);continue}
      closeList();
      if(/^>\s?/.test(line)){html.push(`<blockquote>${markdownInline(line.replace(/^>\s?/,''))}</blockquote>`);continue}
      if(!line.trim()){html.push('<div class="markdown-gap"></div>');continue}
      html.push(`<p>${markdownInline(line)}</p>`);
    }
    if(code!==null)closeCode();closeList();return html.join('');
  }
  noteContent=text=>`<div class="markdown-note">${renderMarkdown(text)}</div>`;
  function refreshMarkdownPreview(){let preview=$('#noteMarkdownPreview');if(preview)preview.innerHTML=renderMarkdown(noteInput.value)}
  function setMarkdownMode(mode){let preview=$('#noteMarkdownPreview'),tabs=$('#noteMarkdownTabs');if(!preview||!tabs)return;let show=mode==='preview';noteInput.hidden=show;preview.hidden=!show;tabs.querySelectorAll('button').forEach(button=>button.classList.toggle('selected',button.dataset.markdownMode===mode));if(show)refreshMarkdownPreview();}
  function ensureMarkdownPreview(){
    if($('#noteMarkdownTabs'))return;
    let tabs=document.createElement('div');tabs.id='noteMarkdownTabs';tabs.className='note-markdown-tabs';tabs.innerHTML='<button type="button" class="selected" data-markdown-mode="edit">编辑</button><button type="button" data-markdown-mode="preview">预览</button>';
    let preview=document.createElement('div');preview.id='noteMarkdownPreview';preview.className='note-markdown-preview';preview.hidden=true;
    noteInput.before(tabs);noteInput.insertAdjacentElement('afterend',preview);
    tabs.querySelectorAll('button').forEach(button=>button.onclick=()=>setMarkdownMode(button.dataset.markdownMode));
    noteInput.addEventListener('input',refreshMarkdownPreview);
  }
  // Preview controls are only needed after opening the note editor. Avoid doing
  // extra DOM work while the iPhone home screen is still starting up.
  const originalOpenArchiveNoteEditorMarkdown=openArchiveNoteEditor;
  openArchiveNoteEditor=async function(note){ensureMarkdownPreview();await originalOpenArchiveNoteEditorMarkdown(note);setMarkdownMode('edit');};
  const resetNoteEditorMarkdown=()=>setMarkdownMode('edit');
  $('#quickNote').addEventListener('click',()=>{ensureMarkdownPreview();resetNoteEditorMarkdown()});
  $('#closeNote').addEventListener('click',resetNoteEditorMarkdown);
  noteModal.addEventListener('click',event=>{if(event.target===noteModal)resetNoteEditorMarkdown()});
  // Do not re-render today's notes on startup: image thumbnails can make the
  // initial iPhone launch noticeably slower. Future page renders use Markdown.
}
