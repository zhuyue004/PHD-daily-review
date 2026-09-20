const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});
    await context.addInitScript(()=>{
      const date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
      localStorage.setItem('phd-diary-records',JSON.stringify([{id:'long-diary',date,text:'今天认真记录了一件事，留下当时的细节和感受。\n'.repeat(12),images:[]}]));
      localStorage.setItem('phd-observation-records',JSON.stringify([{id:'long-observation',date,createdAt:new Date().toISOString(),title:'一次观察',text:'留意人物、动作和声音，并记下这些细节。\n'.repeat(12),analysis:''}]));
    });
    const page=await context.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    // Chrome does not clamp child paragraphs like Safari; simulate a four-line
    // clipped card so the tab-switch regression exercises the same state.
    await page.addStyleTag({content:'.diary-feed-text,.observation-item-text{display:block!important;max-height:100px!important;overflow:hidden!important}.diary-measuring .diary-feed-text,.diary-expanded .diary-feed-text,.observation-item.expanded .observation-item-text{max-height:none!important;overflow:visible!important}'});
    await page.locator('nav [data-page="diary"]').click();
    const more=page.locator('.diary-feed-card .diary-read-more');
    await more.waitFor({state:'visible',timeout:3000});
    const diaryCollapsedRight=await more.evaluate(button=>button.getBoundingClientRect().right);
    const diaryCardRight=await page.locator('.diary-feed-card').evaluate(card=>card.getBoundingClientRect().right);
    assert(Math.abs(diaryCardRight-diaryCollapsedRight-16)<3,JSON.stringify({diaryCardRight,diaryCollapsedRight}));
    await page.locator('[data-diary-subview="observation"]').click();
    await page.evaluate(()=>renderDiary());
    await page.locator('[data-diary-subview="diary"]').click();
    await more.waitFor({state:'visible'});
    await more.click();
    assert.equal(await more.textContent(),'收起');
    assert.equal(await page.locator('.diary-feed-card.diary-expanded').count(),1);
    const diaryExpandedRight=await more.evaluate(button=>button.getBoundingClientRect().right);
    assert(Math.abs(diaryCardRight-diaryExpandedRight-16)<3);
    await page.locator('[data-diary-subview="observation"]').click();
    await page.locator('[data-diary-subview="diary"]').click();
    await more.waitFor({state:'visible'});
    assert.equal(await more.textContent(),'收起');
    await page.locator('[data-diary-subview="observation"]').click();
    const observationMore=page.locator('.observation-item .observation-more');
    await observationMore.waitFor({state:'visible'});
    const observationCardRight=await page.locator('.observation-item').evaluate(card=>card.getBoundingClientRect().right);
    const observationCollapsedRight=await observationMore.evaluate(button=>button.getBoundingClientRect().right);
    assert(Math.abs(observationCardRight-observationCollapsedRight-16)<3);
    await observationMore.click();
    assert.equal(await observationMore.textContent(),'收起');
    const observationExpandedRight=await observationMore.evaluate(button=>button.getBoundingClientRect().right);
    assert(Math.abs(observationCardRight-observationExpandedRight-16)<3);
    console.log('DIARY_READ_MORE_SWITCH_OK');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
