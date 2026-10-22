const {test,expect}=require('playwright/test');
const path=require('path');
const url=process.env.APP_URL||`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('archive has daily records, references and manuscripts',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    const now=new Date(),p=value=>String(value).padStart(2,'0'),date=`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`;
    localStorage.setItem('phd-review-records',JSON.stringify([{id:'review-1',date,goals:'完成测试',completed:'完成每日复盘测试'}]));
    localStorage.setItem('phd-quick-notes',JSON.stringify([{id:'note-1',date,createdAt:new Date().toISOString(),text:'随手记测试内容'}]));
    localStorage.setItem('phd-diaries',JSON.stringify([{id:'diary-1',date,text:'不应出现在每日记录里的日记'}]));
  });
  await page.goto(url);
  await page.getByRole('button',{name:'档案'}).click();
  await expect(page.locator('[data-archive-mode]')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'每日记录'})).toBeVisible();
  await expect(page.getByRole('button',{name:'参考文献'})).toBeVisible();
  await expect(page.getByRole('button',{name:'文稿',exact:true})).toBeVisible();
  await expect(page.locator('#records')).toContainText('复盘记录');
  await expect(page.locator('#records')).toContainText('随手记');
  await expect(page.locator('#records')).not.toContainText('不应出现在每日记录里的日记');
});

test('iPhone can create, reopen, export and delete a manuscript',async({page})=>{
  await page.addInitScript(()=>localStorage.clear());
  await page.goto(url);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'文稿',exact:true}).click();
  await page.getByRole('button',{name:'＋ 新建文稿'}).click();
  await page.locator('#manuscriptForm [name="title"]').fill('复杂场地模型文献综述');
  await page.locator('#manuscriptForm [name="category"]').selectOption('文献综述');
  await page.locator('#manuscriptForm [name="content"]').fill('# 研究问题\n需要识别最低充分复杂度。\n\n## 初步认识\n模型复杂度应由任务决定。');
  await expect(page.locator('#manuscriptWordCount')).toContainText('字');
  await page.locator('#manuscriptForm').getByRole('button',{name:'保存'}).click();
  await expect(page.locator('.manuscript-card')).toHaveCount(1);
  await expect(page.locator('.manuscript-card')).toContainText('复杂场地模型文献综述');
  await page.locator('.manuscript-card').click();
  await expect(page.locator('.manuscript-detail')).toContainText('最低充分复杂度');
  await expect(page.locator('#editManuscript')).toHaveCount(0);
  await expect(page.locator('#deleteManuscript')).toHaveCount(0);
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'导出 Word'}).click();
  const exported=await downloadPromise;
  expect(exported.suggestedFilename()).toBe('复杂场地模型文献综述.docx');
  await page.locator('#close').click();
  const card=page.locator('.manuscript-card'),box=await card.boundingBox();
  await page.mouse.move(box.x+box.width-20,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width-210,box.y+box.height/2,{steps:6});
  await page.mouse.up();
  await expect(page.locator('.manuscript-swipe')).toHaveClass(/swiped/);
  await page.locator('.manuscript-delete').click();
  const code=await page.locator('.delete-code-value').textContent();
  await page.locator('.delete-code-input').fill(code);
  await page.getByRole('button',{name:'确认删除'}).click();
  await expect(page.locator('.manuscript-card')).toHaveCount(0);
  await expect(page.evaluate(()=>JSON.parse(localStorage.getItem('phd-cloud-deletions')||'[]').some(item=>item.kind==='manuscript'))).resolves.toBe(true);
});

test('manuscripts participate in backup and Excel data sources',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('phd-manuscripts',JSON.stringify([{id:'m1',title:'备份文稿',category:'小论文',status:'初稿',content:'正文内容',createdAt:'2026-10-22T00:00:00.000Z',updatedAt:'2026-10-22T01:00:00.000Z'}])));
  await page.goto(url);
  await expect(page.evaluate(()=>window.getManuscriptsForBackup().length)).resolves.toBe(1);
  await expect(page.evaluate(()=>window.manuscriptExportRows()[0]['文稿标题'])).resolves.toBe('备份文稿');
});

test('desktop archive cache keeps daily records, references and manuscripts isolated',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    const now=new Date(),p=value=>String(value).padStart(2,'0'),date=`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`,stamp=new Date().toISOString();
    localStorage.setItem('phd-review-records',JSON.stringify([{id:'review-desktop',date,goals:'桌面每日记录',completed:'每日记录正文'}]));
    localStorage.setItem('phd-quick-notes',JSON.stringify([{id:'note-desktop',date,createdAt:stamp,text:'桌面随手记正文'}]));
    localStorage.setItem('phd-reference-library',JSON.stringify([{id:'reference-desktop',title:'独立参考文献',authors:'测试作者',year:'2026',summary:'参考文献摘要'}]));
    localStorage.setItem('phd-manuscripts',JSON.stringify([{id:'manuscript-desktop',title:'独立文稿',category:'文献综述',status:'初稿',content:'文稿正文',createdAt:stamp,updatedAt:stamp}]));
  });
  await page.goto(url);
  await page.evaluate(()=>{window.phdDesktop={}});
  await page.addScriptTag({path:path.resolve(__dirname,'..','desktop-performance.js')});
  await page.getByRole('button',{name:'档案'}).click();
  await expect(page.locator('#records')).toContainText('桌面每日记录');
  await expect(page.locator('#records')).toContainText('桌面随手记正文');

  await page.getByRole('button',{name:'参考文献'}).click();
  await expect(page.locator('#records')).toContainText('独立参考文献');
  await expect(page.locator('#records')).not.toContainText('桌面每日记录');
  await expect(page.locator('#records')).not.toContainText('桌面随手记正文');
  await expect(page.locator('body')).not.toContainText('当前为 iPhone 预览版');

  await page.getByRole('button',{name:'文稿',exact:true}).click();
  await expect(page.locator('#records')).toContainText('独立文稿');
  await expect(page.locator('#records')).not.toContainText('独立参考文献');
  await expect(page.locator('#records')).not.toContainText('桌面每日记录');
  await expect(page.locator('body')).not.toContainText('iPhone 预览版');
  await page.locator('.manuscript-card').click({button:'right'});
  await expect(page.locator('#desktopNoteMenu')).toContainText('编辑');
  await expect(page.locator('#desktopNoteMenu')).toContainText('删除');
});
