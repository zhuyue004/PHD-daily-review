const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},colorScheme:'dark',isMobile:true,hasTouch:true});
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof noteContent==='function'&&document.querySelector('#archive'));
    const colors=await page.evaluate(()=>{
      const sample=`【读文献】
第一层：层级标签
第二层：**加粗字段值**

1. 编号内容

# 标题

普通正文

> 引用内容

[链接](https://example.com)

\`代码内容\`

| 表头 | 说明 |
| --- | --- |
| 单元格 | 内容 |`;
      const archive=document.querySelector('#archive');
      archive.classList.add('active');
      archive.innerHTML=`<article class="archive-note"><time>时间</time>${noteContent(sample)}<small>图片说明</small><div class="archive-note-footer"><button class="archive-note-footer-edit">编辑</button><button class="archive-note-expand">全文</button></div></article>`;
      const color=selector=>getComputedStyle(archive.querySelector(selector)).color;
      return {
        root:color('.note-markdown'),paragraph:color('.note-paragraph'),fieldLabel:color('.note-field-label'),
        fieldValue:color('.note-field-value'),numberMarker:color('.note-number-marker'),numberValue:color('.note-number-value'),
        heading:color('.note-heading'),strong:color('strong'),quote:color('.note-quote'),link:color('a'),
        tableHead:color('.note-table th'),tableCell:color('.note-table td'),time:color('time'),small:color('small'),
        edit:color('.archive-note-footer-edit'),expand:color('.archive-note-expand')
      };
    });
    const white='rgb(242, 242, 247)',secondary='rgb(174, 174, 178)',quote='rgb(209, 209, 214)',blue='rgb(100, 181, 255)';
    for(const key of ['root','paragraph','fieldLabel','fieldValue','numberValue','heading','strong','tableHead','tableCell'])assert.equal(colors[key],white,key);
    for(const key of ['numberMarker','time','small'])assert.equal(colors[key],secondary,key);
    assert.equal(colors.quote,quote,'quote');
    assert.equal(colors.link,blue,'link');
    assert.equal(colors.edit,'rgb(10, 132, 255)','edit');
    assert.equal(colors.expand,'rgb(10, 132, 255)','expand');
    console.log('IPHONE_ARCHIVE_DARK_MODE_OK',colors);
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
