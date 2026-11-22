const {test,expect}=require('playwright/test');
const path=require('path');

const pageUrl=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('raw Mermaid flowchart in a note becomes a scalable SVG and opens in the zoom viewer',async({page})=>{
  await page.goto(pageUrl);
  await page.waitForFunction(()=>typeof renderNoteMarkup==='function'&&typeof hydrateNoteMermaid==='function');
  expect(await page.evaluate(()=>Boolean(window.mermaid))).toBe(false);
  const source=String.raw`\
flowchart TB\
&#x20;   A["研究总目标：确定目标工程指标所需的必要场地信息"]\
&#x20;   B["Q1 几何必要信息；Q2 介质必要信息；Q3 联合可组合性"]\
&#x20;   A --> B\
\
&#x20;   subgraph F["阶段一：研究基础与模型建立"]\
&#x20;     direction TB\
&#x20;     F1["P0：求解器、输入、边界、阻尼、网格与误差验证"]\
&#x20;     F2["共享数据库：母场地ID、算子、材料场、输入与结果追踪"]\
&#x20;     F1 --> F2\
&#x20;   end\
&#x20;   B --> F1\
\
&#x20;   subgraph GH["阶段三：GH联合简化 回答Q3"]\
&#x20;     J1["四模型：M00完整；M10仅G；M01仅H；M11联合"]\
&#x20;     J2["计算Gamma_GH，诊断传播时间、阻抗、位置和尺度关系"]\
&#x20;     J1 --> J2\
&#x20;   end\
&#x20;   F2 --> J1`;
  await page.evaluate(text=>{
    const host=document.createElement('div');host.id='mermaid-test-host';host.innerHTML=renderNoteMarkup(text);document.body.append(host);hydrateNoteMermaid(host);
  },source);
  const holder=page.locator('#mermaid-test-host .note-mermaid');
  await expect(holder).toHaveAttribute('data-render-state','ready',{timeout:15000});
  await expect(holder.locator('svg')).toHaveCount(1);
  await expect(holder).toContainText('研究总目标');
  await expect(holder).toContainText('阶段三：GH联合简化 回答Q3');
  const vector=await holder.locator('svg').evaluate(svg=>({viewBox:svg.getAttribute('viewBox'),width:svg.getBoundingClientRect().width}));
  expect(vector.viewBox).toBeTruthy();
  expect(vector.width).toBeGreaterThan(100);

  await holder.getByRole('button',{name:'打开流程图大图'}).click();
  const viewer=page.locator('#noteDiagramViewer');
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('svg')).toHaveCount(1);
  const before=await viewer.locator('svg').evaluate(svg=>parseFloat(svg.style.width));
  await viewer.getByRole('button',{name:'放大流程图'}).click();
  const after=await viewer.locator('svg').evaluate(svg=>parseFloat(svg.style.width));
  expect(after).toBeGreaterThan(before);
  await viewer.getByRole('button',{name:'关闭流程图'}).click();
  await expect(viewer).toBeHidden();
});

test('fenced Mermaid blocks render while ordinary code blocks stay as code',async({page})=>{
  await page.goto(pageUrl);
  await page.waitForFunction(()=>typeof renderNoteMarkup==='function'&&typeof hydrateNoteMermaid==='function');
  await page.evaluate(()=>{
    const host=document.createElement('div');host.id='mermaid-fence-host';host.innerHTML=renderNoteMarkup('正文\n```mermaid\nflowchart LR\nA[起点] --> B[终点]\n```\n```text\nflowchart LR\nC --> D\n```');document.body.append(host);hydrateNoteMermaid(host);
  });
  await expect(page.locator('#mermaid-fence-host .note-mermaid')).toHaveAttribute('data-render-state','ready',{timeout:15000});
  await expect(page.locator('#mermaid-fence-host .note-mermaid svg')).toHaveCount(1);
  await expect(page.locator('#mermaid-fence-host .note-code-block')).toContainText('flowchart LR');
});

test('the same note flowchart renders in Archive and the notes timeline',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.clear();
    const now=new Date(),pad=value=>String(value).padStart(2,'0'),date=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,stamp=now.toISOString();
    localStorage.setItem('phd-quick-notes',JSON.stringify([{id:'diagram-note',date,createdAt:stamp,updatedAt:stamp,text:'```mermaid\nflowchart TB\nA[研究基础] --> B[联合模型选择]\n```',images:[]}]))
  });
  await page.goto(pageUrl);
  await page.getByRole('button',{name:'档案'}).click();
  const archiveDiagram=page.locator('#archive .note-mermaid');
  await expect(archiveDiagram).toHaveAttribute('data-render-state','ready',{timeout:15000});
  await expect(archiveDiagram.locator('svg')).toHaveCount(1);

  await page.getByRole('button',{name:'随手记',exact:true}).click();
  const timelineDiagram=page.locator('#notesTimeline .note-mermaid');
  await expect(timelineDiagram).toHaveAttribute('data-render-state','ready',{timeout:15000});
  await expect(timelineDiagram.locator('svg')).toHaveCount(1);
  await expect(timelineDiagram).toContainText('联合模型选择');
});
