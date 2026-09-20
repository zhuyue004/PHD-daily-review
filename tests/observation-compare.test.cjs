const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const {chromium,webkit}=require('playwright');

(async()=>{
  const fallback='C:\\Users\\ZhuYue\\AppData\\Local\\ms-playwright\\webkit-2336\\Playwright.exe';
  const browser=process.env.BROWSER_ENGINE==='webkit'?await webkit.launch({headless:true,...(!fs.existsSync(webkit.executablePath())&&fs.existsSync(fallback)?{executablePath:fallback}:{})}):await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:393,height:852},hasTouch:true,isMobile:true});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.evaluate(()=>{
      page('diary');showDiarySubview('observation');
      observations=[{id:'obs-new-1',date:day(),title:'新观察',text:'问题：修改后正文\n\n1. 第一层\n\\[E=mc^2\\]',analysis:'我的分析',originalText:'首次正文',originalSource:'first-save',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:'obs-legacy-1',date:day(),title:'旧观察',text:'旧版正文',analysis:'',createdAt:new Date(Date.now()-60000).toISOString(),updatedAt:new Date(Date.now()-60000).toISOString()}];
      saveObservations();renderObservations();
    });
    assert.strictEqual(await page.locator('.observation-item').count(),2);
    assert.strictEqual(await page.locator('.observation-item-text').count(),0);
    assert.strictEqual(await page.locator('.observation-analysis-badge').count(),1);
    await page.locator('.observation-item').first().click();
    assert.match(await page.locator('.observation-compare-text').first().textContent(),/修改后正文/);
    assert.strictEqual(await page.locator('.observation-compare-text').nth(1).textContent(),'我的分析');
    assert.strictEqual(await page.locator('.observation-compare-text').nth(2).textContent(),'首次正文');
    assert.strictEqual(await page.locator('.observation-compare-text').first().locator('.observation-field').count(),1);
    assert.strictEqual(await page.locator('.observation-compare-text').first().locator('.observation-number-row').count(),1);
    if(process.env.OBS_COMPARE_SCREENSHOT)await page.screenshot({path:process.env.OBS_COMPARE_SCREENSHOT});
    await page.locator('.observation-compare-close').click();
    const row=page.locator('.observation-swipe').first();
    const box=await row.boundingBox(),y=box.y+box.height/2;
    await page.mouse.move(box.x+28,y);await page.mouse.down();await page.mouse.move(box.x+140,y,{steps:8});await page.mouse.up();
    assert.strictEqual(await page.locator('.observation-compare-action').count(),0,'right swipe action should be removed');
    assert.strictEqual(await page.locator('.observation-compare-overlay').count(),0,'right swipe should not open comparison');
    await page.mouse.move(box.x+box.width-30,y);await page.mouse.down();await page.mouse.move(box.x+box.width-145,y,{steps:8});await page.mouse.up();
    assert.ok(await row.evaluate(el=>el.classList.contains('swiped')),'left swipe did not reveal edit/delete');
    await row.locator('.observation-edit').click();
    assert.strictEqual(await page.locator('#observationTitle').inputValue(),'新观察');
    await page.locator('#observationText').fill('修改后的正文');
    await page.evaluate(()=>{diaryPlaceResult=async()=>({place:'',reason:'测试'})});
    await page.locator('#saveObservation').click();
    await page.waitForFunction(()=>observations.find(item=>item.id==='obs-new-1')?.text==='修改后的正文');
    const revised=await page.evaluate(()=>observations.find(item=>item.id==='obs-new-1'));
    assert.strictEqual(revised.originalText,'首次正文');
    assert.strictEqual(revised.text,'修改后的正文');
    await page.locator('.observation-item').last().click();
    assert.match(await page.locator('.observation-compare-text').nth(2).textContent(),/旧记录未留存首次原文/);
    await page.locator('.observation-compare-close').click();
    console.log('OBSERVATION_COMPARE_IPHONE_OK',process.env.BROWSER_ENGINE||'chromium');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
