const fs=require('fs');
const assert=require('assert');
const path=require('path');
const appRoot=path.resolve(process.env.SYNC_APP_ROOT||path.resolve(__dirname,'..'));

const storage=new Map();
global.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
const status={textContent:''};
global.$=selector=>selector==='#cloudStatus'?status:null;
global.records=[];global.notes=[];global.diaries=[];global.observations=[];
let syncedReferences=[],syncedManuscripts=[];
global.window={getInsightPlansForSync:()=>({week:{},month:{}}),getReferencesForSync:()=>syncedReferences,getManuscriptsForSync:()=>syncedManuscripts,applyReferencesFromCloud:items=>{syncedReferences=items},applyManuscriptsFromCloud:items=>{syncedManuscripts=items}};
global.deleteNoteImages=async()=>{};
global.deleteDiaryImages=async()=>{};
global.allNoteImages=async()=>[];
global.allNoteImageIds=async()=>[];
global.noteImagesByIds=async()=>[];
global.restoreNoteImages=async()=>{};
global.page=()=>{};

const source=fs.readFileSync(path.join(appRoot,'sync-ui.js'),'utf8');
assert(fs.readFileSync(path.join(appRoot,'insight-plans.js'),'utf8').includes('mergeInsightPlans(insightPlans,remote),{sync:false}'));
const marker='\nensureCloudSettings();';
const core=source.slice(0,source.indexOf(marker));
if(!core.includes('async function pushCloudData'))throw new Error('sync core extraction failed');

eval(`${core}\n;globalThis.runSyncTests=async function(){
  const updateTable=handler=>({update:row=>{let query={eq:()=>query,select:()=>query,maybeSingle:()=>handler(row)};return query}});
  let attempts=0;
  let retryValue=await cloudOperation(async()=>{attempts++;if(attempts===1)throw new Error('temporary');return {data:'ok'}},'test',{timeout:100,retries:1});
  assert.equal(attempts,2);assert.equal(retryValue.data,'ok');
  let equalStamp='2026-09-18T01:00:00.000Z',tieMerged=mergeCloudList([{date:'2026-09-16',text:'短内容',updatedAt:equalStamp}],[{date:'2026-09-16',text:'更完整的日记内容',updatedAt:equalStamp}],'date');assert.equal(tieMerged[0].text,'更完整的日记内容');
  let preserved=mergeCloudObservations([{id:'original',text:'旧正文',originalText:'首次原文',originalSource:'first-save',updatedAt:'2026-09-18T01:00:00Z'}],[{id:'original',text:'新正文',updatedAt:'2026-09-19T01:00:00Z'}]);assert.equal(preserved[0].text,'新正文');assert.equal(preserved[0].originalText,'首次原文');
  syncedReferences=[{id:'reference-local',title:'本机参考文献',updatedAt:'2026-09-19T09:00:00Z'}];syncedManuscripts=[{id:'manuscript-local',title:'本机文稿',content:'正文',updatedAt:'2026-09-19T09:00:00Z'}];
  let collectionSnapshot=cloudSnapshot();assert.equal(collectionSnapshot.version,2);assert.equal(collectionSnapshot.references[0].title,'本机参考文献');assert.equal(collectionSnapshot.manuscripts[0].title,'本机文稿');

  cloudUser={id:'user'};let active=0,maxActive=0,uploaded=[];
  cloudClient={storage:{from:()=>({upload:async(path,content)=>{assert(content instanceof ArrayBuffer);assert(content.byteLength>0);active++;maxActive=Math.max(maxActive,active);await cloudWait(10);uploaded.push([path,content.byteLength]);active--;return {error:null}}})}};
  let images=[1,2,3].map(n=>({id:'img'+n,noteId:'note',name:'img'+n+'.jpg',type:'image/jpeg',blob:new Blob([new Uint8Array(100)] ,{type:'image/jpeg'})}));
  let uploadResult=await uploadCloudImages(images);
  assert.equal(uploaded.length,3);assert(maxActive<=CLOUD_IMAGE_CONCURRENCY);assert.equal(uploadResult.uploadedBytes,300);assert.equal(cloudRemoteImageIds.size,0);
  let emptyUploads=0;notes.push({id:'note-empty',date:'2026-09-17',createdAt:'2026-09-17T12:34:00Z',text:'用于定位的问题记录'});cloudClient={storage:{from:()=>({upload:async()=>{emptyUploads++;return {error:null}}})}};let emptyError;try{await uploadCloudImages([{id:'empty',noteId:'note-empty',name:'empty.jpg',type:'image/jpeg',blob:new Blob([])}])}catch(error){emptyError=error}assert(/内容为空/.test(emptyError.message));assert(/位置：随手记 · 2026-09-17/.test(emptyError.message));assert.equal(emptyError.cloudImage.kind,'随手记');assert.equal(emptyUploads,0);

  let timedOut=false;try{await cloudOperation(()=>new Promise(()=>{}),'timeout test',{timeout:20,retries:0})}catch(error){timedOut=/超时/.test(error.message)}assert(timedOut);
  let slowWorkerFinished=false;
  cloudClient={storage:{from:()=>({upload:async path=>{if(path.endsWith('/img1')){await cloudWait(5);return {error:new Error('failed')}}await cloudWait(30);slowWorkerFinished=true;return {error:null}}})}};
  let rejected=false;try{await uploadCloudImages(images.slice(0,2))}catch{rejected=true}assert(rejected);assert(slowWorkerFinished);

  cloudRemoteImageIds=new Set(['old']);cloudRemoteImageTypes=new Map([['old','image/jpeg']]);
  cloudRemotePayload={version:2,records:[],notes:[],diaries:[],plans:{week:{},month:{}},deleted:[],images:[{id:'old',noteId:'note-old',name:'old.jpg',type:'image/jpeg'}]};
  cloudRemoteUpdatedAt='2026-09-18T00:00:00.000Z';
  let requestedIds=[],savedPayload;
  allNoteImageIds=async()=>['old','new'];
  noteImagesByIds=async ids=>{requestedIds=[...ids];return [{id:'new',noteId:'note-new',name:'new.jpg',type:'image/jpeg',blob:new Blob([new Uint8Array(120)],{type:'image/jpeg'})}]};
  cloudClient={storage:{from:()=>({upload:async()=>({error:null}),remove:async()=>({error:null})})},from:()=>updateTable(async row=>{savedPayload=row.payload;return {data:{payload:row.payload,updated_at:row.updated_at},error:null}})};
  let pushed=await pushCloudData(false);
  assert.deepEqual(requestedIds,['new']);assert.equal(savedPayload.images.length,2);assert(savedPayload.images.some(image=>image.id==='old'));assert(savedPayload.images.some(image=>image.id==='new'));assert(pushed.changed);
  let writes=0,unchangedRequested=null;cloudRemotePayload=savedPayload;cloudRemoteImageIds=new Set(['old','new']);cloudRemoteImageTypes=new Map(savedPayload.images.map(image=>[image.id,image.type]));allNoteImageIds=async()=>['old','new'];noteImagesByIds=async ids=>{unchangedRequested=[...ids];return []};cloudClient={storage:{from:()=>({remove:async()=>({error:null})})},from:()=>updateTable(async()=>{writes++;return {data:null,error:null}})};let unchanged=await pushCloudData(false);assert.deepEqual(unchangedRequested,[]);assert.equal(writes,0);assert.equal(unchanged.changed,false);assert(unchanged.verified);

  storage.set(CLOUD_SKIPPED_IMAGES_KEY,JSON.stringify(['skip']));notes[0].images=['skip'];
  cloudRemotePayload={...savedPayload,notes:[{...notes[0]}],images:[...savedPayload.images,{id:'skip',noteId:'note-empty',name:'skip.jpg',type:'image/jpeg'}]};
  cloudRemoteImageIds=new Set(['old','new','skip']);cloudRemoteImageTypes=new Map(cloudRemotePayload.images.map(image=>[image.id,image.type]));
  let skippedRequested=null,skippedPayload=null;allNoteImageIds=async()=>['old','new','skip'];noteImagesByIds=async ids=>{skippedRequested=[...ids];return []};
  cloudClient={storage:{from:()=>({remove:async()=>({error:null})})},from:()=>updateTable(async row=>{skippedPayload=row.payload;return {data:{payload:row.payload,updated_at:row.updated_at},error:null}})};
  let skippedPush=await pushCloudData(false);assert.deepEqual(skippedRequested,[]);assert(skippedPush.changed);assert(!skippedPayload.images.some(image=>image.id==='skip'));assert.deepEqual(skippedPayload.notes[0].images,[]);assert.deepEqual(JSON.parse(storage.get(CLOUD_SKIPPED_IMAGES_KEY)),['skip']);
  cloudRemoteUpdatedAt='2026-09-18T00:00:00.000Z';cloudClient={from:()=>updateTable(async()=>({data:null,error:null}))};let conflict;try{await saveCloudPayload(skippedPayload)}catch(error){conflict=error}assert(conflict?.cloudConflict);
  const localObservation={id:'observation-local',date:'2026-09-19',title:'本机观察',text:'看到落叶',analysis:'可能是风向改变',updatedAt:'2026-09-19T10:00:00Z'};
  const remoteObservation={id:'observation-remote',date:'2026-09-18',title:'云端观察',text:'看到飞鸟',analysis:'它在觅食',updatedAt:'2026-09-18T10:00:00Z'};
  observations=[localObservation];
  assert.equal(cloudSnapshot().observations[0].analysis,localObservation.analysis);
  let remoteForObservation={version:2,records:[],notes:[],diaries:[],observations:[remoteObservation],plans:{week:{},month:{}},summaries:{},deleted:[],images:[]};
  cloudClient={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{payload:remoteForObservation,updated_at:'2026-09-19T11:00:00Z'},error:null})})})})};
  await pullCloudData();
  assert.equal(observations.length,2);
  assert.equal(observations.find(item=>item.id==='observation-remote').analysis,'它在觅食');
  assert.equal(JSON.parse(storage.get('phd-observation-records')).length,2);
  refreshCloudDeleteWatch();observations=observations.filter(item=>item.id!=='observation-remote');watchCloudDeletes();
  assert(cloudDeletions().some(item=>item.kind==='observation'&&item.id==='observation-remote'));
  let observationPayload;allNoteImageIds=async()=>[];noteImagesByIds=async()=>[];
  cloudClient={storage:{from:()=>({remove:async()=>({error:null})})},from:()=>updateTable(async row=>{observationPayload=row.payload;return {data:{payload:row.payload,updated_at:row.updated_at},error:null}})};
  await pushCloudData(false);
  assert.equal(observationPayload.observations.length,1);
  assert.equal(observationPayload.observations[0].analysis,localObservation.analysis);
  assert(observationPayload.deleted.some(item=>item.kind==='observation'&&item.id==='observation-remote'));
  observations=[remoteObservation];await applyCloudDeletions();assert.equal(observations.length,0);
  let remoteCollections={version:3,records:[],notes:[],diaries:[],observations:[],references:[{id:'reference-remote',title:'云端参考文献',updatedAt:'2026-09-20T09:00:00Z'}],manuscripts:[{id:'manuscript-remote',title:'云端文稿',content:'云端正文',updatedAt:'2026-09-20T09:00:00Z'}],plans:{week:{},month:{}},summaries:{},deleted:[],images:[]};
  cloudClient={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{payload:remoteCollections,updated_at:'2026-09-20T10:00:00Z'},error:null})})})})};
  await pullCloudData();assert.equal(syncedReferences.length,2);assert.equal(syncedManuscripts.length,2);assert(syncedReferences.some(item=>item.id==='reference-local'));assert(syncedReferences.some(item=>item.id==='reference-remote'));assert(syncedManuscripts.some(item=>item.id==='manuscript-local'));assert(syncedManuscripts.some(item=>item.id==='manuscript-remote'));
  rememberCloudDeletion('reference','reference-remote');rememberCloudDeletion('manuscript','manuscript-remote');await applyCloudDeletions();assert.equal(syncedReferences.length,1);assert.equal(syncedManuscripts.length,1);
  console.log('SYNC_LOGIC_OK',{retryAttempts:attempts,maxConcurrency:maxActive,incrementalIds:requestedIds,manifest:savedPayload.images.length,conflictProtected:true,equalTimestampConverged:true,referencesAndManuscripts:true});
}`);

runSyncTests().catch(error=>{console.error(error);process.exitCode=1});
