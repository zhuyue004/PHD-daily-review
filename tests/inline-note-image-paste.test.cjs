const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const edge='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function exercise(browser,desktop){
  const context=await browser.newContext({viewport:{width:desktop?900:390,height:844}});
  const page=await context.newPage();
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(value=>{window.phdDesktop=value},desktop);
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>typeof smartPasteNoteClipboard==='function'&&typeof renderNotesTimeline==='function');
  await page.evaluate(()=>{window.alert=()=>{};Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_success,failure)=>failure?.({code:1})}})});
  await page.locator('#quickNote').click();
  const pasted=await page.evaluate(async()=>{
    const input=document.querySelector('#noteInput');
    input.value=`第一段${'第二段内容，用于验证长随手记收起后仍能恢复文中图片。'.repeat(28)}`;
    input.setSelectionRange(3,3);
    const encoded='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n7sAAAAASUVORK5CYII=';
    const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
    const file=new File([bytes],'复制图片.png',{type:'image/png'});
    const item={kind:'file',type:'image/png',getAsFile:()=>file};
    const result=await smartPasteNoteClipboard({items:[item],files:[file],getData:()=>''});
    return {result,text:input.value,caret:input.selectionStart,pending:pendingNoteImages.map(image=>({id:image.id,inline:image.inline}))};
  });
  assert.equal(pasted.result.images,1);
  assert.match(pasted.text,/^第一段\n\[\[图片::[^\]]+\]\]\n第二段内容/,'图片标记必须插入原光标位置并独占一行');
  assert.equal(pasted.pending.length,1);
  assert.equal(pasted.pending[0].inline,true);
  const corruptLabel=await page.evaluate(()=>{let root=document.createElement('div');root.innerHTML=renderNoteMarkup('正文\n[[图片::损坏图片]]\n后文');hydrateNoteInlineImages(root,[{id:'损坏图片',blob:'not-a-blob'}]);return root.querySelector('.note-inline-image-missing')?.textContent});
  assert.equal(corruptLabel,'图片无法读取','损坏的旧图片不能让整个档案的图片渲染中断');

  const saved=await page.evaluate(async()=>{try{await document.querySelector('#saveNote').onclick();return {notes:notes.length,hidden:document.querySelector('#noteModal').classList.contains('hidden')}}catch(error){return {error:error.message,stack:error.stack}}});
  assert.deepEqual(saved,{notes:1,hidden:true},`保存文中图片失败：${JSON.stringify(saved)}`);
  const noteId=await page.evaluate(()=>notes[0].id);

  await page.evaluate(()=>window.page('archive'));
  const archive=`.archive-note-swipe[data-note-id="${noteId}"]`;
  await page.locator(`${archive} .note-inline-image-slot img`).waitFor();
  const archiveState=await page.locator(archive).evaluate(row=>({
    inline:row.querySelectorAll('.note-inline-image-slot img').length,
    trailing:row.querySelectorAll('.archive-note-images img').length,
    order:[...row.querySelector('.note-markdown').children].slice(0,3).map(node=>node.className)
  }));
  assert.equal(archiveState.inline,1,'档案随手记应在正文中加载图片');
  assert.equal(archiveState.trailing,0,'文中图片不应在卡片底部重复显示');
  assert.deepEqual(archiveState.order,['note-paragraph','note-inline-image-slot','note-paragraph']);

  await page.evaluate(()=>window.page('notesTimeline'));
  const timeline=`.timeline-entry[data-note-id="${noteId}"]`;
  await page.locator(timeline).waitFor();
  if(desktop){
    await page.locator(`${timeline} .note-inline-image-slot img`).waitFor();
  }else{
    await page.locator(`${timeline} .timeline-expand`).waitFor();
    assert.equal(await page.locator(`${timeline} .timeline-images img`).count(),0,'收起时文中图片不能被移到底部');
    await page.locator(`${timeline} .timeline-expand`).click();
    await page.locator(`${timeline} .note-inline-image-slot img`).waitFor();
  }
  const timelineState={inline:await page.locator(`${timeline} .note-inline-image-slot img`).count(),trailing:await page.locator(`${timeline} .timeline-images img`).count()};
  assert.deepEqual(timelineState,{inline:1,trailing:0},'随手记模块应只在正文原位置显示图片');

  // 旧记录可能只有图片库数据和正文标记，没有 images 元数据。重新编辑保存时
  // 必须从图片库恢复元数据，不能留下只有空白占位的图片框。
  await page.evaluate(id=>{let note=notes.find(item=>item.id===id);delete note.images;saveNotes();openArchiveNoteEditor(note)},noteId);
  await page.locator('#existingNoteImages .existing-note-image').waitFor();
  await page.locator('#saveNote').click();
  await page.locator('#noteModal').waitFor({state:'hidden'});
  await page.evaluate(()=>window.page('archive'));
  await page.locator(`${archive} .note-inline-image-slot img`).waitFor();
  const repaired=await page.evaluate(async id=>({metadata:notes.find(note=>note.id===id)?.images||[],stored:(await getNoteImages(id)).map(image=>image.id)}),noteId);
  assert.equal(repaired.metadata.length,1,'编辑保存旧记录时应恢复图片元数据');
  assert.deepEqual(repaired.metadata,repaired.stored,'恢复后的图片元数据必须与图片库一致');
  await page.evaluate(id=>{notes.find(note=>note.id===id).images=[];archive()},noteId);
  await page.locator(`${archive} .note-inline-image-slot img`).waitFor();

  await page.evaluate(id=>openArchiveNoteEditor(notes.find(note=>note.id===id)),noteId);
  await page.locator('#existingNoteImages .remove-existing-note-image').waitFor();
  await page.locator('#existingNoteImages .remove-existing-note-image').click();
  const editAfterDelete=await page.evaluate(()=>({marker:document.querySelector('#noteInput').value.includes('[[图片::'),existing:document.querySelectorAll('#existingNoteImages .existing-note-image').length,editorImages:window.noteEditorImages.length}));
  assert.deepEqual(editAfterDelete,{marker:false,existing:0,editorImages:0},'编辑时删除图片应同时移除正文标记和编辑器缩略图');
  const deleted=await page.evaluate(async id=>{await document.querySelector('#saveNote').onclick();return {stored:(await getNoteImages(id)).length,metadata:notes.find(note=>note.id===id)?.images?.length,text:notes.find(note=>note.id===id)?.text||''}},noteId);
  assert.deepEqual({stored:deleted.stored,metadata:deleted.metadata,marker:deleted.text.includes('[[图片::')},{stored:0,metadata:0,marker:false},'保存修改后应删除图片文件、元数据和正文标记');
  await context.close();
  return {desktop,pasted:{caret:pasted.caret},archiveState,timelineState};
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:edge});
  try{
    const desktop=await exercise(browser,true);
    const iphone=await exercise(browser,false);
    console.log('INLINE_NOTE_IMAGE_PASTE_OK',{desktop,iphone});
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
