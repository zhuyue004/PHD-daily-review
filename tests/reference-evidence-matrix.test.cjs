const {test,expect}=require('playwright/test');
const path=require('path');

const url=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('old reference data is preserved while evidence card drives the matrix',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    localStorage.setItem('phd-reference-library',JSON.stringify([{
      id:'legacy-reference',referenceNumber:'REF-0008',title:'Site specific analysis',authors:'Sáenz et al.',institutions:'Example University',year:'2019',journal:'Earthquake Engineering',summary:'研究地形简化与地震动响应。',methods:'比较原始地形和简化地形。',findings:'简化误差受目标周期控制。',relevance:'为几何简化误差研究提供方法。',limitations:'只验证了一个场地。',indexing:'SCI',jcr:'Q1',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'
    }]));
  });
  await page.goto(url);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await expect(page.locator('#referenceMatrixSummary')).toHaveText(/已分类 0\/1 篇/);
  await page.locator('#openReferenceMatrix').click();
  await expect(page.locator('.reference-unclassified')).toHaveText('待整理 1 篇');
  await expect(page.locator('.reference-matrix-results')).toContainText('REF-0008');
  await page.locator('#closeReferenceMatrix').click();

  await page.locator('.reference-card').click();
  await expect(page.locator('.reference-detail')).toContainText('Example University');
  await expect(page.locator('.reference-detail')).toContainText('JCR Q1');
  await expect(page.locator('.reference-evidence-card')).toContainText('尚未整理分类和研究证据');
  await page.locator('#editReferenceEvidence').click();
  const form=page.locator('#referenceForm');
  await form.locator('[name="primaryTheme"]').selectOption('B');
  await form.locator('[name="progressLevel"]').selectOption('L3');
  await form.locator('[name="progressBasis"]').fill('直接比较简化前后误差。');
  await form.locator('[name="secondaryThemes"][value="F"]').check();
  await form.locator('[name="scienceQuestions"][value="Q1"]').check();
  await form.locator('[name="evidenceStatus"]').selectOption('已确认');
  await form.locator('[name="researchObject"]').fill('复杂地形');
  await form.locator('[name="complexityVariables"]').fill('地形幅度、空间波长');
  await form.locator('[name="simplificationOperation"]').fill('地形平滑');
  await form.locator('[name="referenceModel"]').fill('原始精细地形模型');
  await form.locator('[name="inputConditions"]').fill('二维波场');
  await form.locator('[name="evaluationMetrics"]').fill('PGA、反应谱');
  await form.locator('[name="quantitativeEvidence"]').fill('Figure 6，误差小于10%');
  await form.getByRole('button',{name:'保存'}).click();

  await expect(page.locator('#referenceMatrixSummary')).toHaveText(/已分类 1\/1 篇 · 已确认 1 篇 · L3–L5 1 篇/);
  await expect(page.locator('.reference-chip.evidence')).toContainText('B 几何模型简化及误差分析');
  await expect(page.locator('.reference-chip.level')).toContainText('L3 模型简化误差研究');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('phd-reference-library'))[0]);
  expect(saved).toEqual(expect.objectContaining({authors:'Sáenz et al.',institutions:'Example University',journal:'Earthquake Engineering',summary:'研究地形简化与地震动响应。',methods:'比较原始地形和简化地形。',findings:'简化误差受目标周期控制。',relevance:'为几何简化误差研究提供方法。',limitations:'只验证了一个场地。',primaryTheme:'B',progressLevel:'L3',evidenceStatus:'已确认',researchObject:'复杂地形'}));
  expect(saved.secondaryThemes).toEqual(['F']);
  expect(saved.scienceQuestions).toEqual(['Q1']);

  await page.locator('#openReferenceMatrix').click();
  const cell=page.locator('button[data-theme="B"][data-level="L3"]');
  await expect(cell).toHaveText('1');
  await cell.click();
  await expect(page.locator('.reference-matrix-results')).toContainText('Site specific analysis');
  const exported=await page.evaluate(()=>window.referenceExportRows()[0]);
  expect(exported).toEqual(expect.objectContaining({'作者单位':'Example University','主分类':'B 几何模型简化及误差分析','研究进展':'L3 模型简化误差研究','证据卡状态':'已确认','定量证据':'Figure 6，误差小于10%'}));
  const backup=await page.evaluate(()=>window.getReferencesForBackup()[0]);
  expect(backup.secondaryThemes).toEqual(['F']);
  expect(backup.scienceQuestions).toEqual(['Q1']);
});

test('classification suggestion is explicitly saved as an automatic draft',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    localStorage.setItem('phd-reference-library',JSON.stringify([{id:'draft-reference',title:'Velocity model smoothing error',summary:'对速度场进行平滑，分析简化误差和PGA。',methods:'改变平滑尺度并比较误差。',findings:'参数敏感性明显。'}]));
  });
  await page.goto(url);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await page.locator('.reference-card').click();
  await page.locator('#editReferenceEvidence').click();
  await page.locator('#suggestReferenceEvidence').click();
  await expect(page.locator('#referenceForm [name="primaryTheme"]')).toHaveValue('C');
  await expect(page.locator('#referenceForm [name="progressLevel"]')).toHaveValue('L3');
  await expect(page.locator('#referenceForm [name="evidenceStatus"]')).toHaveValue('自动草稿');
  await expect(page.locator('#referenceForm [name="evaluationMetrics"]')).toHaveValue(/PGA/);
  await page.locator('#referenceForm').getByRole('button',{name:'保存'}).click();
  await expect(page.locator('.reference-card .reference-chip.draft')).toHaveText('自动草稿');
});

test('iPhone matrix scrolls inside its panel and evidence card remains readable in dark mode',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({colorScheme:'dark'});
  await page.addInitScript(()=>{
    localStorage.clear();
    localStorage.setItem('phd-reference-library',JSON.stringify([{id:'dark-reference',title:'Dark evidence',summary:'Summary',primaryTheme:'F',progressLevel:'L4',progressBasis:'建立了适用边界。',evidenceStatus:'已确认',researchObject:'盆地模型'}]));
  });
  await page.goto(url);
  await page.getByRole('button',{name:'档案'}).click();
  await page.getByRole('button',{name:'参考文献'}).click();
  await page.locator('#openReferenceMatrix').click();
  const layout=await page.locator('.reference-matrix-scroll').evaluate(node=>({clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(layout.scrollWidth).toBeGreaterThan(layout.clientWidth);
  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);
  await page.locator('#closeReferenceMatrix').click();
  await page.locator('.reference-card').click();
  await expect(page.locator('.reference-evidence-card')).toContainText('F 模型误差、不确定性与复杂度选择');
  const colors=await page.locator('.reference-evidence-card').evaluate(node=>({title:getComputedStyle(node.querySelector('h3')).color,label:getComputedStyle(node.querySelector('dt')).color,value:getComputedStyle(node.querySelector('dd')).color,background:getComputedStyle(node).backgroundColor}));
  expect(colors).toEqual({title:'rgb(242, 242, 247)',label:'rgb(174, 174, 178)',value:'rgb(242, 242, 247)',background:'rgb(23, 40, 28)'});
});

