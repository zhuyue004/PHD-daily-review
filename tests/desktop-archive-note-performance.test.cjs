const {test,expect}=require('playwright/test');
const path=require('path');
const url=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('desktop archive reuses unchanged note markup and does not rebuild the hidden timeline after editing',async({page})=>{
  await page.addInitScript(()=>{
    window.phdDesktop={};
    localStorage.clear();
  });
  await page.goto(url);
  await page.waitForFunction(()=>typeof archive==='function'&&typeof noteContent==='function'&&typeof desktopDataChanged==='function');
  const firstRenderMs=await page.evaluate(()=>{
    const baseTime=Date.now(),stamp=Date.now(),selected=day();
    notes=Array.from({length:40},(_,index)=>({id:`performance-note-${index+1}`,serial:index+1,date:selected,createdAt:new Date(stamp-index*1000).toISOString(),updatedAt:new Date(stamp-index*1000).toISOString(),text:`## ${index+1}. 长随手记性能测试\n${'复杂场地分析、公式与研究结论需要保持可读。'.repeat(45)}`,images:[]}));
    document.querySelector('#archiveDate').value=selected;
    const base=noteContent;
    window.__archiveNoteRenderCalls=0;
    noteContent=text=>{window.__archiveNoteRenderCalls++;return base(text)};
    desktopDataChanged('notes');
    window.page('archive');
    return Date.now()-baseTime;
  });
  await expect(page.locator('.archive-note-swipe[data-note-id]')).toHaveCount(40);
  await expect(page.locator('.archive-note-toggle')).toHaveCount(40);
  expect(firstRenderMs).toBeLessThan(1500);
  const initialCalls=await page.evaluate(()=>window.__archiveNoteRenderCalls);
  expect(initialCalls).toBe(40);

  await page.evaluate(()=>{desktopDataChanged('notes');archive()});
  await expect(page.locator('.archive-note-swipe[data-note-id]')).toHaveCount(40);
  expect(await page.evaluate(()=>window.__archiveNoteRenderCalls)).toBe(initialCalls);

  const card=page.locator('.archive-note-swipe[data-note-id="performance-note-1"] .archive-note');
  await card.click({button:'right'});
  const openMs=await page.evaluate(()=>{let started=performance.now();document.querySelector('#desktopNoteMenu [data-action="edit"]').click();return performance.now()-started});
  await expect(page.locator('#noteModal')).toBeVisible();
  expect(openMs).toBeLessThan(50);

  await page.locator('#noteInput').fill('只修改这一条记录，其余三十九条继续复用已有格式化结果。');
  const savedAt=Date.now();
  await page.locator('#saveNote').click();
  await expect(page.locator('#noteModal')).toBeHidden();
  await expect(page.locator('.archive-note-swipe[data-note-id]')).toHaveCount(40);
  expect(Date.now()-savedAt).toBeLessThan(1500);
  expect(await page.evaluate(()=>window.__archiveNoteRenderCalls)).toBe(initialCalls+1);
  expect(await page.locator('#notesTimelineList').evaluate(node=>node.childElementCount)).toBe(0);
  console.log('DESKTOP_ARCHIVE_NOTE_PERFORMANCE_OK',{count:40,firstRenderMs,openMs,renderedAgain:1});
});

test('desktop note editor opens before existing images finish loading',async({page})=>{
  await page.addInitScript(()=>{window.phdDesktop={};localStorage.clear()});
  await page.goto(url);
  await page.waitForFunction(()=>typeof openArchiveNoteEditor==='function');
  await page.evaluate(()=>{
    const stamp=new Date().toISOString();
    notes=[{id:'slow-image-note',serial:1,date:day(),createdAt:stamp,updatedAt:stamp,text:'图片异步加载测试'}];
    getNoteImages=()=>new Promise(resolve=>{window.__resolveSlowNoteImages=resolve});
    openArchiveNoteEditor(notes[0]);
  });
  await expect(page.locator('#noteModal')).toBeVisible();
  await expect(page.locator('#noteInput')).toHaveValue('图片异步加载测试');
  await expect(page.locator('#existingNoteImages')).toContainText('正在加载已有图片');
  await page.waitForFunction(()=>typeof window.__resolveSlowNoteImages==='function');
  await page.evaluate(()=>window.__resolveSlowNoteImages([]));
  await expect(page.locator('#existingNoteImages')).toBeEmpty();
});
