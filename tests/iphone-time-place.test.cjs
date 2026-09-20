const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({timezoneId:'Asia/Shanghai'});
    await context.addInitScript(()=>{
      const today=new Date(),date=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const at=hour=>new Date(today.getFullYear(),today.getMonth(),today.getDate(),hour).toISOString();
      localStorage.setItem('phd-quick-notes',JSON.stringify([
        {id:'note-1',date,createdAt:at(9),updatedAt:at(9),text:'第一条',images:[]},
        {id:'note-2',date,createdAt:at(10),updatedAt:at(10),text:'第二条',images:[]}
      ]));
      localStorage.setItem('phd-amap-key','test-key');
      Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success){success({coords:{latitude:31.2,longitude:121.5}})}}});
    });
    await context.route('https://restapi.amap.com/**',route=>route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body:JSON.stringify({status:'1',regeocode:{addressComponent:{province:'上海市',city:[],district:'浦东新区',township:'张江镇',streetNumber:{street:'科苑路',number:'1号'}}}})}));
    const page=await context.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.locator('nav [data-page="archive"]').click();
    await page.evaluate(()=>openArchiveNoteEditor(notes.find(note=>note.id==='note-1')));
    await page.locator('#editNoteCreatedAt input').fill('2026-09-19T08:15');
    await page.locator('#saveNote').click();
    await page.locator('#noteModal').waitFor({state:'hidden'});
    const changed=await page.evaluate(()=>notes.find(note=>note.id==='note-1'));
    assert.equal(changed.date,'2026-09-19');
    assert.equal(new Date(changed.createdAt).getHours(),8);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('phd-quick-notes')).find(note=>note.id==='note-1').createdAt),changed.createdAt);
    await page.locator('nav [data-page="notesTimeline"]').click();
    assert.equal(await page.locator('.timeline-entry').first().getAttribute('data-note-id'),'note-2');
    assert.equal(await page.locator('.timeline-entry').last().getAttribute('data-note-id'),'note-1');
    await page.locator('nav [data-page="diary"]').click();
    await page.locator('#diaryInput').fill('今天的记录');
    await page.locator('#saveDiary').click();
    await page.locator('#diaryLocationStatus').waitFor();
    assert.match((await page.evaluate(()=>diaries.find(item=>item.date===day()).place)),/浦东新区/);
    await page.locator('.diary-feed-place').first().waitFor();
    await page.locator('[data-diary-subview="observation"]').click();
    await page.locator('#observationTitle').fill('观察标题');
    await page.locator('#observationText').fill('观察正文');
    await page.locator('#toggleObservationAnalysis').click();
    await page.locator('#observationAnalysis').fill('分析内容');
    await page.locator('#saveObservation').click();
    await page.locator('#observationLocationStatus').waitFor();
    assert.match((await page.evaluate(()=>observations[0].place)),/浦东新区/);
    await page.locator('.observation-item-place').first().waitFor();
    assert.equal(await page.locator('.observation-analysis h4').first().evaluate(element=>getComputedStyle(element).fontSize),'16px');
    assert.equal(await page.locator('.observation-analysis h4').first().evaluate(element=>getComputedStyle(element).color),'rgb(195, 75, 69)');
    console.log('IPHONE_TIME_PLACE_OK');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
