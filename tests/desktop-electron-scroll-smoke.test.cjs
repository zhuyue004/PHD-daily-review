const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {_electron:electron}=require('playwright');

(async()=>{
  const project=path.resolve(__dirname,'..');
  const executable=process.env.RIJI_DESKTOP_EXE||path.join(project,'node_modules','electron','dist','electron.exe');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'riji-scroll-smoke-'));
  const app=await electron.launch({executablePath:executable,args:[project,'--no-sandbox',`--user-data-dir=${profile}`]});
  try{
    const page=await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await page.locator('header h1').waitFor();
    assert.equal(await page.evaluate(()=>Boolean(window.phdDesktop)),true,'desktop preload must be active');
    const gpu=await app.evaluate(({app})=>({disabledSwitch:app.commandLine.hasSwitch('disable-gpu'),status:app.getGPUFeatureStatus()}));
    assert.equal(gpu.disabledSwitch,false,'desktop build must not force the GPU off');
    await page.evaluate(()=>{
      const spacer=document.createElement('div');
      spacer.style.height='12000px';
      document.body.append(spacer);
      scrollTo(0,0);
    });
    await page.mouse.move(200,400);
    await page.mouse.wheel(0,120);
    await page.waitForTimeout(500);
    const slow=await page.evaluate(()=>scrollY);
    assert.ok(slow>=55&&slow<=69,`single wheel notch should stay small, got ${slow}`);
    await page.evaluate(()=>scrollTo(0,0));
    for(let index=0;index<6;index++)await page.mouse.wheel(0,120);
    await page.waitForTimeout(500);
    const fast=await page.evaluate(()=>scrollY);
    assert.ok(fast>slow*4,`quick wheel sequence should accumulate, got slow=${slow}, fast=${fast}`);
    const spacing=await page.evaluate(()=>{
      const archive=document.querySelector('#archive');
      const host=document.createElement('div');host.id='packaged-spacing-host';host.innerHTML=`<article class="archive-note" data-note-id="packaged-spacing">${renderNoteMarkup('正文\n**三、加粗中文序号标题**\n**1. 加粗数字标题**\n# 一、一级标题\n## 二、二级标题\n### 三、三级标题')}</article>`;archive.append(host);
      archive.classList.add('active');
      const chinese=host.querySelector('.note-number-title-chinese'),arabic=host.querySelector('.note-number-title-arabic'),result={chinese:parseFloat(getComputedStyle(chinese).paddingTop),arabic:parseFloat(getComputedStyle(arabic).paddingTop),bold:host.querySelectorAll('.note-number-value strong').length,headingGaps:[...host.querySelectorAll('.note-heading-numbered-chinese')].map(node=>parseFloat(getComputedStyle(node).paddingTop))};host.remove();return result;
    });
    assert.ok(spacing.chinese>spacing.arabic*1.9&&spacing.arabic>8,`desktop heading gaps missing: ${JSON.stringify(spacing)}`);
    assert.equal(spacing.bold,2,'bold numbered headings must stay bold');
    assert.deepEqual(spacing.headingGaps,[25.8,25.8,25.8],'# / ## / ### Chinese-number headings need one full-line gap');
    await page.evaluate(()=>{
      const selected=day(),stamp=new Date(`${selected}T09:00:00`);
      notes=Array.from({length:240},(_,index)=>({id:`packaged-sort-${index+1}`,serial:index+1,date:selected,createdAt:new Date(stamp.getTime()+index*1000).toISOString(),updatedAt:new Date(stamp.getTime()+index*1000).toISOString(),text:`打包排序测试 ${index+1}`,images:[]}));
      document.querySelector('#archiveDate').value=selected;document.querySelector('#search').value='';localStorage.setItem('phd-archive-note-serial-order','desc');desktopDataChanged('notes');window.page('archive');
    });
    const serials=()=>page.evaluate(()=>[...document.querySelectorAll('.archive-note-swipe[data-note-id]')].map(row=>noteSerial(notes.find(note=>note.id===row.dataset.noteId))));
    assert.deepEqual(await serials(),[...Array(240)].map((_,index)=>240-index));
    await page.locator('.archive-note-sort').click();
    assert.deepEqual(await serials(),[...Array(240)].map((_,index)=>index+1));
    await page.locator('.archive-note-sort').click();
    assert.deepEqual(await serials(),[...Array(240)].map((_,index)=>240-index));
    console.log('DESKTOP_ELECTRON_SCROLL_OK',{slow,fast,gpu,spacing,archiveSort:{count:240,toggles:2}});
  }finally{
    await app.close();
    fs.rmSync(profile,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exit(1)});
