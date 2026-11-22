const {test,expect}=require('playwright/test');
const path=require('path');

const pageUrl=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('inline note image fills its white card and keeps its aspect ratio while resizing',async({page})=>{
  await page.goto(pageUrl);
  await page.waitForFunction(()=>typeof renderNoteMarkup==='function'&&typeof hydrateNoteInlineImages==='function');
  await page.evaluate(()=>{
    const card=document.createElement('article');
    card.id='responsive-note-image-card';
    card.style.cssText='width:600px;padding:14px;background:#fff';
    card.innerHTML=renderNoteMarkup('图片前文\n[[图片::responsive-image]]\n图片后文');
    document.body.append(card);
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#7ec8e3"/></svg>';
    hydrateNoteInlineImages(card,[{id:'responsive-image',blob:new Blob([svg],{type:'image/svg+xml'})}]);
  });
  const image=page.locator('#responsive-note-image-card .note-inline-image-slot img');
  await image.evaluate(node=>node.decode());
  const dimensions=()=>page.locator('#responsive-note-image-card').evaluate(card=>{
    const body=card.querySelector('.note-markdown'),slot=card.querySelector('.note-inline-image-slot'),button=slot.querySelector('button'),image=slot.querySelector('img');
    return {body:body.getBoundingClientRect().width,slot:slot.getBoundingClientRect().width,button:button.getBoundingClientRect().width,imageWidth:image.getBoundingClientRect().width,imageHeight:image.getBoundingClientRect().height};
  });
  const wide=await dimensions();
  expect(wide.slot).toBeCloseTo(wide.body,0);
  expect(wide.button).toBeCloseTo(wide.body,0);
  expect(wide.imageWidth).toBeCloseTo(wide.body,0);
  expect(wide.imageWidth/wide.imageHeight).toBeCloseTo(2,1);
  await page.locator('#responsive-note-image-card').evaluate(card=>card.style.width='360px');
  const narrow=await dimensions();
  expect(narrow.imageWidth).toBeLessThan(wide.imageWidth);
  expect(narrow.imageWidth).toBeCloseTo(narrow.body,0);
  expect(narrow.imageWidth/narrow.imageHeight).toBeCloseTo(2,1);
});
