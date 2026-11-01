const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:720,height:760}});
    await page.addInitScript(()=>{window.phdDesktop=true;localStorage.removeItem('phd-archive-note-serial-order')});
    await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>typeof window.desktopDataChanged==='function'&&typeof archive==='function');
    await page.evaluate(()=>{
      const selected=day(),stamp=new Date(`${selected}T09:00:00`);
      notes=Array.from({length:240},(_,index)=>({id:`sort-note-${index+1}`,serial:index+1,date:selected,createdAt:new Date(stamp.getTime()+index*1000).toISOString(),updatedAt:new Date(stamp.getTime()+index*1000).toISOString(),text:`排序测试 ${index+1}`,images:[]}));
      document.querySelector('#archiveDate').value=selected;
      document.querySelector('#search').value='';
      desktopDataChanged('notes');
      page('archive');
    });
    await page.locator('.archive-note-sort').waitFor();
    const state=()=>page.evaluate(()=>({
      label:document.querySelector('.archive-note-sort')?.textContent,
      serials:[...document.querySelectorAll('.archive-note-swipe[data-note-id]')].map(row=>noteSerial(notes.find(note=>note.id===row.dataset.noteId)))
    }));
    let current=await state();
    assert.equal(current.label,'# ↓');
    assert.deepEqual(current.serials,[...Array(240)].map((_,index)=>240-index));
    for(let turn=0;turn<6;turn++){
      await page.locator('.archive-note-sort').click();
      current=await state();
      const ascending=turn%2===0,expected=ascending?[...Array(240)].map((_,index)=>index+1):[...Array(240)].map((_,index)=>240-index);
      assert.equal(current.label,ascending?'# ↑':'# ↓',`button label on turn ${turn+1}`);
      assert.deepEqual(current.serials,expected,`DOM order on turn ${turn+1}`);
      assert.equal(await page.evaluate(()=>localStorage.getItem('phd-archive-note-serial-order')),ascending?'asc':'desc');
    }
    console.log('DESKTOP_ARCHIVE_SORT_OK',{count:current.serials.length,toggles:6,first:current.serials[0],last:current.serials.at(-1)});
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
