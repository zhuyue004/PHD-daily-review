const {test,expect}=require('playwright/test');
const path=require('path');
const url=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('long note typing keeps autosave work out of the input event path',async({page})=>{
  await page.addInitScript(()=>{window.phdDesktop={};localStorage.clear()});
  await page.goto(url);
  await page.waitForFunction(()=>typeof queueNoteDraft==='function');
  await page.locator('#quickNote').click();

  const result=await page.evaluate(()=>{
    const input=document.querySelector('#noteInput');
    input.value=('长篇随手记内容与研究分析。'.repeat(12000));
    const originalSetItem=Storage.prototype.setItem;
    window.__draftWrites=0;
    Storage.prototype.setItem=function(key,value){if(key==='phd-quick-note-drafts')window.__draftWrites++;return originalSetItem.call(this,key,value)};
    const started=performance.now();
    for(let index=0;index<200;index++)input.dispatchEvent(new Event('input',{bubbles:true}));
    return {dispatchMs:performance.now()-started,writes:window.__draftWrites,status:document.querySelector('#noteDraftStatus')?.textContent||'',spellcheck:input.spellcheck};
  });

  expect(result.dispatchMs).toBeLessThan(80);
  expect(result.writes).toBe(0);
  expect(result.status).toBe('');
  expect(result.spellcheck).toBe(false);
  await page.waitForTimeout(300);
  expect(await page.evaluate(()=>window.__draftWrites)).toBe(0);
  await page.waitForFunction(()=>window.__draftWrites===1,null,{timeout:3000});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('phd-quick-note-drafts')).new.text.length)).toBe(156000);
});

test('closing immediately flushes a pending long-note draft',async({page})=>{
  await page.addInitScript(()=>{window.phdDesktop={};localStorage.clear()});
  await page.goto(url);
  await page.locator('#quickNote').click();
  const text=`关闭前必须保存：${'长文本。'.repeat(10000)}`;
  await page.locator('#noteInput').evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}))},text);
  await page.locator('#closeNote').click();
  await expect(page.locator('#noteModal')).toBeHidden();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('phd-quick-note-drafts')).new.text)).toBe(text);
});
