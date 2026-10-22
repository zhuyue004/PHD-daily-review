const {test,expect}=require('playwright/test');
const path=require('path');
const url=`file:///${path.resolve(__dirname,'..','index.html').replaceAll('\\','/')}`;

test('references and manuscripts round-trip between two devices, including deletion',async({browser})=>{
  const contextA=await browser.newContext(),contextB=await browser.newContext();
  const deviceA=await contextA.newPage(),deviceB=await contextB.newPage();
  await deviceA.addInitScript(()=>localStorage.clear());
  await deviceB.addInitScript(()=>localStorage.clear());
  await deviceA.goto(url);await deviceB.goto(url);

  const payloadA=await deviceA.evaluate(()=>{
    const stamp='2026-10-22T08:00:00.000Z';
    applyCloudReferences([{id:'reference-shared',title:'设备 A 的参考文献',summary:'同步摘要',updatedAt:stamp,createdAt:stamp}]);
    applyCloudManuscripts([{id:'manuscript-shared',title:'设备 A 的文稿',content:'同步正文',category:'文献综述',status:'初稿',updatedAt:stamp,createdAt:stamp}]);
    return cloudSnapshot();
  });
  await deviceB.evaluate(payload=>{
    applyCloudReferences(mergeCloudList(cloudReferences(),payload.references,'id'));
    applyCloudManuscripts(mergeCloudList(cloudManuscripts(),payload.manuscripts,'id'));
  },payloadA);
  await expect(deviceB.evaluate(()=>getReferencesForSync()[0].title)).resolves.toBe('设备 A 的参考文献');
  await expect(deviceB.evaluate(()=>getManuscriptsForSync()[0].content)).resolves.toBe('同步正文');

  const payloadB=await deviceB.evaluate(()=>{
    applyCloudReferences(getReferencesForSync().map(item=>({...item,summary:'设备 B 修改后的摘要',updatedAt:'2026-10-22T09:00:00.000Z'})));
    applyCloudManuscripts(getManuscriptsForSync().map(item=>({...item,content:'设备 B 修改后的正文',updatedAt:'2026-10-22T09:00:00.000Z'})));
    return cloudSnapshot();
  });
  await deviceA.evaluate(payload=>{
    applyCloudReferences(mergeCloudList(cloudReferences(),payload.references,'id'));
    applyCloudManuscripts(mergeCloudList(cloudManuscripts(),payload.manuscripts,'id'));
  },payloadB);
  await expect(deviceA.evaluate(()=>getReferencesForSync()[0].summary)).resolves.toBe('设备 B 修改后的摘要');
  await expect(deviceA.evaluate(()=>getManuscriptsForSync()[0].content)).resolves.toBe('设备 B 修改后的正文');

  const deletedPayload=await deviceB.evaluate(async()=>{
    rememberCloudDeletion('reference','reference-shared');
    rememberCloudDeletion('manuscript','manuscript-shared');
    await applyCloudDeletions();
    return cloudSnapshot();
  });
  await deviceA.evaluate(async payload=>{
    saveCloudDeletions(payload.deleted);
    applyCloudReferences(mergeCloudList(cloudReferences(),payload.references,'id'));
    applyCloudManuscripts(mergeCloudList(cloudManuscripts(),payload.manuscripts,'id'));
    await applyCloudDeletions(payload.deleted);
  },deletedPayload);
  await expect(deviceA.evaluate(()=>getReferencesForSync().length)).resolves.toBe(0);
  await expect(deviceA.evaluate(()=>getManuscriptsForSync().length)).resolves.toBe(0);

  await contextA.close();await contextB.close();
});
