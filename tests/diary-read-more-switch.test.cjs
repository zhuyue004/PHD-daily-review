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
    });
    const page=await context.newPage();
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    // Chrome does not clamp child paragraphs like Safari; simulate a four-line
    // clipped card so the tab-switch regression exercises the same state.
    await page.addStyleTag({content:'.diary-feed-text{display:block!important;max-height:100px!important;overflow:hidden!important}.diary-measuring .diary-feed-text,.diary-expanded .diary-feed-text{max-height:none!important;overflow:visible!important}'});
    await page.locator('nav [data-page="diary"]').click();
    const more=page.locator('.diary-feed-card .diary-read-more');
    await more.waitFor({state:'visible',timeout:3000});
    await page.locator('[data-diary-subview="observation"]').click();
    await page.evaluate(()=>renderDiary());
    await page.locator('[data-diary-subview="diary"]').click();
    await more.waitFor({state:'visible'});
    await more.click();
    assert.equal(await more.textContent(),'收起');
    assert.equal(await page.locator('.diary-feed-card.diary-expanded').count(),1);
    await page.locator('[data-diary-subview="observation"]').click();
    await page.locator('[data-diary-subview="diary"]').click();
    await more.waitFor({state:'visible'});
    assert.equal(await more.textContent(),'收起');
    console.log('DIARY_READ_MORE_SWITCH_OK');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
