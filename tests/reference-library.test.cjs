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
  await expect(page.evaluate(()=>JSON.parse(localStorage.getItem('phd-reference-library')).length)).resolves.toBe(1);
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
