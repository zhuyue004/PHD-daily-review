const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:430,height:760}});
    await page.addInitScript(()=>{window.phdDesktop=true});
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof window.desktopDataVersion==='function'&&typeof window.settlePageTail==='function');
    await page.evaluate(()=>{
      const spacer=document.createElement('div');
      spacer.id='desktop-wheel-test-spacer';
      spacer.style.height='12000px';
      document.body.append(spacer);
      scrollTo(0,0);
    });

    const wheel=async count=>page.evaluate(async count=>{
      for(let index=0;index<count;index++)document.body.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}));
      await new Promise(resolve=>setTimeout(resolve,500));
      return scrollY;
    },count);

    const slow=await wheel(1);
    assert.ok(slow>=55&&slow<=69,`single notch should stay small, got ${slow}`);
    await page.evaluate(()=>scrollTo(0,0));
    const fast=await wheel(6);
    assert.ok(fast>slow*4,`quick wheel sequence should accumulate, got slow=${slow}, fast=${fast}`);

    const nestedPrevented=await page.evaluate(()=>{
      const nested=document.createElement('div');
      nested.style.cssText='height:80px;overflow-y:auto';
      nested.innerHTML='<div style="height:500px"></div>';
      document.body.prepend(nested);
      const event=new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true});
      nested.dispatchEvent(event);
      return event.defaultPrevented;
    });
    assert.equal(nestedPrevented,false,'nested vertical scrollers must keep native wheel handling');

    await page.evaluate(()=>{
      window.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      scrollTo(0,640);
      window.settlePageTail();
    });
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(()=>scrollY),640,'desktop tail helper must not rewrite the active scroll position');
    console.log('DESKTOP_WHEEL_SCROLL_OK',{slow,fast});
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
