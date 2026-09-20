const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Shanghai'});
    const page=await context.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    const result=await page.evaluate(async()=>{
      await new Promise((resolve,reject)=>{
        const request=indexedDB.open('phd-daily-images',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('images',{keyPath:'id'});
        request.onsuccess=()=>{
          const db=request.result,write=db.transaction('images','readwrite');
          write.objectStore('images').put({id:'old-image',noteId:'old-note',name:'old.png',blob:new Blob(['original'],{type:'image/png'})});
          write.oncomplete=()=>{db.close();resolve()};write.onerror=()=>reject(write.error);
        };
        request.onerror=()=>reject(request.error);
      });
      const oldImages=await getNoteImages('old-note');
      const indexed=(await imageDb()).transaction('images').objectStore('images').indexNames.contains('byNoteId');
      const stamp=new Date().toISOString();
      notes=Array.from({length:1000},(_,index)=>({id:`sample-${index}`,date:'2025-01-01',createdAt:stamp,updatedAt:stamp,text:index===999?'最早的检索命中':`随手记测试 ${index}`,images:[]}));
      const start=performance.now();
      page('notesTimeline');
      return {oldImageCount:oldImages.length,indexed,initialCount:document.querySelectorAll('.timeline-entry').length,initialMs:Math.round(performance.now()-start)};
    });
    assert.strictEqual(result.oldImageCount,1);
    assert.strictEqual(result.indexed,true);
    assert.strictEqual(result.initialCount,24);
    assert(result.initialMs<500,`initial render ${result.initialMs} ms`);
    await page.locator('#notesTimelineList').evaluate(element=>element.scrollTop=element.scrollHeight);
    await page.waitForFunction(()=>document.querySelectorAll('.timeline-entry').length>24);
    await page.locator('#notesTimelineSearch').fill('最早的检索命中');
    assert.strictEqual(await page.locator('.timeline-entry').count(),1);
    assert.strictEqual(await page.locator('.timeline-body').textContent(),'最早的检索命中');
    console.log('IPHONE_TIMELINE_PERFORMANCE_OK',result);
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
