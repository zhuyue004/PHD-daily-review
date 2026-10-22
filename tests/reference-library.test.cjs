const {test,expect}=require('playwright/test');
const path=require('path');

test('iPhone reference library can create, search and reopen an entry',async({page})=>{
  await page.addInitScript(()=>localStorage.clear());
  await page.goto(`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await expect(page.getByRole('button',{name:'＋ 添加参考文献'})).toBeVisible();
  await page.getByRole('button',{name:'＋ 添加参考文献'}).click();
  await page.locator('#referenceForm [name="title"]').fill('A taxonomy of site response complexity');
  await page.locator('#referenceForm [name="authors"]').fill('Thompson et al.');
  await page.locator('#referenceForm [name="institutions"]').fill('University of Example');
  await page.locator('#referenceForm [name="year"]').fill('2012');
  await page.locator('#referenceForm [name="journal"]').fill('Soil Dynamics and Earthquake Engineering');
  await page.locator('#referenceForm [name="summary"]').fill('判断传统一维模型在什么场地条件下足够，什么时候需要更复杂的模型。');
  await page.locator('#referenceForm [name="indexing"]').selectOption('SCI');
  await page.locator('#referenceForm [name="jcr"]').selectOption('Q1');
  await page.locator('#referenceForm').getByRole('button',{name:'保存'}).click();
  await expect(page.getByText('A taxonomy of site response complexity')).toBeVisible();
  await expect(page.getByText('判断传统一维模型在什么场地条件下足够')).toBeVisible();
  await page.locator('#search').fill('Thompson');
  await expect(page.locator('.reference-card')).toHaveCount(1);
  await page.locator('.reference-card').click();
  await expect(page.locator('.reference-detail')).toContainText('JCR Q1');
  await expect(page.locator('.reference-detail')).toContainText('REF-0001');
  await expect(page.locator('.reference-detail')).toContainText('University of Example');
  await expect(page.locator('.reference-detail')).toContainText('GB/T 7714—2015');
  await expect(page.locator('.reference-detail')).toContainText('APA 7th');
  await expect(page.locator('.copy-citation')).toHaveCount(2);
  await expect(page.locator('#editReference')).toHaveCount(0);
  await expect(page.locator('#deleteReference')).toHaveCount(0);
  await expect(page.evaluate(()=>JSON.parse(localStorage.getItem('phd-reference-library')).length)).resolves.toBe(1);
  await expect(page.evaluate(()=>JSON.parse(localStorage.getItem('phd-reference-library'))[0].referenceNumber)).resolves.toBe('REF-0001');
});

test('existing references receive permanent unique numbers and deleted numbers are not reused',async({page})=>{
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('phd-reference-library',JSON.stringify([{id:'old-a',title:'Older',summary:'A',createdAt:'2026-01-01T00:00:00Z'},{id:'old-b',title:'Newer',summary:'B',createdAt:'2026-01-02T00:00:00Z'}]))});
  await page.goto(`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`);
  expect(await page.evaluate(()=>window.getReferencesForBackup().map(item=>item.referenceNumber))).toEqual(['REF-0001','REF-0002']);
  await page.evaluate(()=>window.applyReferencesFromCloud([{id:'old-a',referenceNumber:'REF-0001',title:'Older',summary:'A',createdAt:'2026-01-01T00:00:00Z'}]));
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await page.getByRole('button',{name:'＋ 添加参考文献'}).click();
  await page.locator('#referenceForm [name="title"]').fill('Third');
  await page.locator('#referenceForm [name="summary"]').fill('C');
  await page.locator('#referenceForm').getByRole('button',{name:'保存'}).click();
  expect(await page.evaluate(()=>window.getReferencesForBackup().find(item=>item.title==='Third').referenceNumber)).toBe('REF-0003');
});

test('iPhone reference row swipes to edit and four-digit delete',async({page})=>{
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('phd-reference-library',JSON.stringify([{id:'ref-swipe',title:'Swipe reference',authors:'Author',year:'2026',summary:'Summary'}]))});
  await page.goto(`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  const card=page.locator('.reference-card');
  const box=await card.boundingBox();
  await page.mouse.move(box.x+box.width-20,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width-210,box.y+box.height/2,{steps:6});
  await page.mouse.up();
  await expect(page.locator('.reference-swipe')).toHaveClass(/swiped/);
  await page.locator('.reference-delete').click();
  await expect(page.locator('.delete-code-dialog')).toBeVisible();
  const code=await page.locator('.delete-code-value').textContent();
  await page.locator('.delete-code-input').fill(code);
  await page.getByRole('button',{name:'确认删除'}).click();
  await expect(page.locator('.reference-card')).toHaveCount(0);
  await expect(page.evaluate(()=>JSON.parse(localStorage.getItem('phd-cloud-deletions')||'[]').some(item=>item.kind==='reference'&&item.id==='ref-swipe'))).resolves.toBe(true);
});

test('desktop reference row uses a right-click menu',async({page})=>{
  await page.addInitScript(()=>{localStorage.clear();localStorage.setItem('phd-reference-library',JSON.stringify([{id:'ref-menu',title:'Desktop reference',authors:'Author',year:'2026',summary:'Summary'}]))});
  await page.goto(`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`);
  await page.evaluate(()=>{window.phdDesktop={}});
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await page.locator('.reference-card').click({button:'right'});
  await expect(page.locator('#desktopNoteMenu')).toBeVisible();
  await expect(page.locator('#desktopNoteMenu')).toContainText('编辑');
  await expect(page.locator('#desktopNoteMenu')).toContainText('删除');
});

test('desktop reference library can scroll the final entry above the fixed navigation',async({page})=>{
  await page.setViewportSize({width:430,height:720});
  await page.addInitScript(()=>{
    window.phdDesktop={};
    localStorage.clear();
    localStorage.setItem('phd-reference-library',JSON.stringify(Array.from({length:36},(_,index)=>({
      id:`ref-${index+1}`,
      title:`Reference ${String(index+1).padStart(2,'0')}`,
      authors:'Author',
      year:'2026',
      summary:'A long enough summary to make every reference card occupy several lines in the desktop list.',
      createdAt:new Date(Date.UTC(2026,0,index+1)).toISOString(),
      updatedAt:new Date(Date.UTC(2026,0,index+1)).toISOString()
    }))));
  });
  await page.goto(`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`);
  await page.evaluate(()=>document.documentElement.classList.add('desktop-app'));
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await expect(page.locator('.reference-card')).toHaveCount(36);
  await page.locator('main').evaluate(main=>{main.scrollTop=main.scrollHeight});
  await page.waitForTimeout(50);
  const result=await page.evaluate(()=>{
    const main=document.querySelector('main'),last=document.querySelector('.reference-swipe:last-child'),nav=document.querySelector('nav');
    return {
      reachedBottom:Math.abs(main.scrollTop-(main.scrollHeight-main.clientHeight))<=1,
      lastBottom:last.getBoundingClientRect().bottom,
      navTop:nav.getBoundingClientRect().top
    };
  });
  expect(result.reachedBottom).toBe(true);
  expect(result.lastBottom).toBeLessThanOrEqual(result.navTop);
});
