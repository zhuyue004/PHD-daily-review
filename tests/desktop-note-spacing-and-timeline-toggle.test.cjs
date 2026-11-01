const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:430,height:760}});
    await page.addInitScript(()=>{window.phdDesktop=true});
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof renderNoteMarkup==='function'&&typeof renderNotesTimeline==='function');
    const spacing=await page.evaluate(()=>{
      document.body.classList.add('desktop-app');
      const archive=document.querySelector('#archive');
      archive.classList.add('active');
      archive.innerHTML=`<article class="archive-note" data-note-id="spacing"><div class="note-host">${renderNoteMarkup('正文\n**一、Figure 13：不同方法计算出的线性场地修正因子有什么差异？**\n**1. 数字标题**\n# 一、一级标题\n## 二、二级标题\n### 三、三级标题')}</div></article>`;
      const chinese=archive.querySelector('.note-number-title-chinese');
      const arabic=archive.querySelector('.note-number-title-arabic');
      const headings=[...archive.querySelectorAll('.note-heading-numbered-chinese')];
      const desktop={chinese:parseFloat(getComputedStyle(chinese).paddingTop),arabic:parseFloat(getComputedStyle(arabic).paddingTop),headingGaps:headings.map(node=>parseFloat(getComputedStyle(node).paddingTop)),headingTags:headings.map(node=>node.tagName)};
      document.body.classList.remove('desktop-app');document.documentElement.classList.remove('desktop-app');
      const mobile={chinese:parseFloat(getComputedStyle(chinese).paddingTop),arabic:parseFloat(getComputedStyle(arabic).paddingTop),headingGaps:headings.map(node=>parseFloat(getComputedStyle(node).paddingTop))};
      document.body.classList.add('desktop-app');document.documentElement.classList.add('desktop-app');
      return {desktop,mobile,bold:[...archive.querySelectorAll('.note-number-value strong')].map(node=>node.textContent)};
    });
    assert.ok(spacing.desktop.chinese>spacing.desktop.arabic*1.9,'Chinese-number heading should have one full-line gap');
    assert.ok(spacing.desktop.arabic>8,'Arabic-number heading should have a half-line gap');
    assert.equal(spacing.mobile.chinese,0,'iPhone Chinese-number spacing must stay unchanged');
    assert.equal(spacing.mobile.arabic,0,'iPhone Arabic-number spacing must stay unchanged');
    assert.deepEqual(spacing.desktop.headingTags,['H1','H2','H3'],'all three Markdown heading levels must be recognized');
    assert.deepEqual(spacing.desktop.headingGaps,[25.8,25.8,25.8],'desktop archive Markdown headings need one full-line gap');
    assert.deepEqual(spacing.mobile.headingGaps,[0,0,0],'iPhone Markdown heading spacing must stay unchanged');
    assert.deepEqual(spacing.bold,['Figure 13：不同方法计算出的线性场地修正因子有什么差异？','数字标题'],'full-line bold formatting must be preserved');

    const timeline=await page.evaluate(async()=>{
      document.querySelector('#archive').classList.remove('active');
      document.querySelector('#notesTimeline').classList.add('active');
      notes.push({id:'desktop-toggle-test',date:day(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),text:Array.from({length:14},(_,index)=>`第${index+1}段测试正文，确保内容超过收起高度。`).join('\n'),images:[]});
      desktopDataChanged('notes');
      renderNotesTimeline();
      await new Promise(resolve=>setTimeout(resolve,180));
      const card=document.querySelector('.timeline-entry[data-note-id="desktop-toggle-test"] .timeline-card');
      const button=card?.querySelector('.timeline-expand');
      const before={text:button?.textContent,last:card?.lastElementChild===button,rightGap:card&&button?Math.round(card.getBoundingClientRect().right-button.getBoundingClientRect().right):null};
      button?.click();
      const expanded=button?.textContent;
      button?.click();
      return {before,expanded,collapsed:button?.textContent};
    });
    assert.deepEqual(timeline,{before:{text:'全文',last:true,rightGap:14},expanded:'收起',collapsed:'全文'});
    console.log('DESKTOP_NOTE_LAYOUT_OK',{spacing,timeline});
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
