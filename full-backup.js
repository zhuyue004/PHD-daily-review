const backupStamp=()=>{let d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`};
function backupImageReferences(noteItems,diaryItems){return [...noteItems,...diaryItems].flatMap(item=>(item.images||[]).map(id=>({id,owner:item})))}
function backupOwnedImages(images,noteItems,diaryItems){
  let owners=new Set([...noteItems,...diaryItems].map(item=>item.id));
  let referenced=new Set(backupImageReferences(noteItems,diaryItems).map(ref=>ref.id));
  return images.filter(image=>owners.has(image.noteId)||referenced.has(image.id));
}
function backupImageLocation(image,noteItems,diaryItems){
  let note=noteItems.find(item=>item.id===image.noteId||(item.images||[]).includes(image.id));
  if(note)return `随手记 · ${note.date||'日期未知'} · ${(note.text||'').slice(0,20)||'无文字'}`;
  let diary=diaryItems.find(item=>item.id===image.noteId||(item.images||[]).includes(image.id));
  return diary?`日记 · ${diary.date||'日期未知'}`:'无关联记录';
}
function backupDrafts(){return {notes:noteDrafts(),diaries:diaryDrafts(),observations:observationDrafts()}}
function restoreBackupDrafts(drafts,mode){
  if(!drafts||typeof drafts!=='object')return;
  for(let [key,current] of [[NOTE_DRAFTS_KEY,noteDrafts()],[DIARY_DRAFTS_KEY,diaryDrafts()],[observationDraftKey,observationDrafts()]]){
    let incoming=drafts[key===NOTE_DRAFTS_KEY?'notes':key===DIARY_DRAFTS_KEY?'diaries':'observations'];
    if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))continue;
    let merged=mode==='replace'?incoming:{...current};
    if(mode!=='replace')for(let [id,item] of Object.entries(incoming))if(!merged[id]||Date.parse(item?.updatedAt||0)>Date.parse(merged[id]?.updatedAt||0))merged[id]=item;
    localStorage.setItem(key,JSON.stringify(merged));
  }
}
async function exportFullBackup(){
  if(!window.JSZip)return alert('备份组件未加载，请联网后重试。');
  try{
    let zip=new JSZip(),allImages=await allNoteImages(),images=backupOwnedImages(allImages,notes,diaries),manifest=[],imageIds=new Set(images.map(image=>image.id));
    let missing=backupImageReferences(notes,diaries).find(ref=>!imageIds.has(ref.id));
    if(missing)throw new Error(`${backupImageLocation({id:missing.id,noteId:missing.owner.id},notes,diaries)} 引用的图片 ${missing.id} 在本机不存在；备份未生成`);
    let empty=images.find(image=>!image.blob||!Number.isFinite(image.blob.size)||image.blob.size<=0);
    if(empty)throw new Error(`${backupImageLocation(empty,notes,diaries)} 的图片“${empty.name||empty.id}”内容为空；请重新添加图片，备份未生成`);
    let usedNames=new Set();for(let image of images){let note=notes.find(item=>item.id===image.noteId),diary=diaries.find(item=>item.id===image.noteId),extension=(image.name||'').split('.').pop()||'jpg',base=note?`随手记${imageStamp(note.createdAt)}`:diary?`日记${diary.date.replaceAll('-','')}`:`图片${image.id}`,name=`${base}.${extension}`,number=2;while(usedNames.has(name)){name=`${base}_${number++}.${extension}`}usedNames.add(name);let path=`images/${name}`;zip.file(path,image.blob);manifest.push({id:image.id,noteId:image.noteId,name,type:image.type,path})}
    zip.file('backup.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),records,notes,diaries,observations,plans:window.getInsightPlansForSync?.()||{},summaries:window.getInsightSummariesForSync?.()||{},drafts:backupDrafts(),images:manifest},null,2));
    zip.file('博士日课复盘.xlsx',excelBlob());
    download(await zip.generateAsync({type:'blob'}),`博士日课完整备份_${backupStamp()}.zip`,'application/zip');
    let orphanCount=allImages.length-images.length;
    if(orphanCount)alert(`备份包已生成。已跳过 ${orphanCount} 张不属于任何现存记录的残留图片；记录和关联图片均已备份。`);
  }catch(error){alert(`生成完整备份失败：${error.message}`)}
}
async function restoreFullBackup(file){
  if(!window.JSZip)throw new Error('备份组件未加载，请联网后重试。');
  let zip=await JSZip.loadAsync(file),source=zip.file('backup.json');
  if(!source)throw new Error('未找到 backup.json，请选择“博士日课”导出的完整备份包。');
  let data=JSON.parse(await source.async('string'));
  if(data.version!==1||!Array.isArray(data.notes)||!Array.isArray(data.records)||data.observations!==undefined&&!Array.isArray(data.observations))throw new Error('备份包格式不正确。');
  let images=[],restoredAt=new Date().toISOString();
  for(let meta of data.images||[]){let item=zip.file(meta.path);if(!item)throw new Error(`备份包缺少图片：${meta.name||meta.id}`);let blob=await item.async('blob');if(!blob.size)throw new Error(`备份包中的图片为空：${meta.name||meta.id}`);images.push({...meta,blob})}
  let missing=backupImageReferences(data.notes,data.diaries||[]).find(ref=>!images.some(image=>image.id===ref.id));
  if(missing)throw new Error(`备份包缺少记录引用的图片：${missing.id}`);
  let mode=$('#restoreMode').value,word=mode==='replace'?'完全恢复会清空本机现有记录和图片，确定继续吗？':'合并恢复会用备份中相同日期的内容及图片覆盖本机内容，确定继续吗？';
  if(!confirm(word))return;
  let restoredRecords=data.records.map(item=>({...item,updatedAt:restoredAt})),restoredNotes=data.notes.map(item=>({...item,updatedAt:restoredAt})),restoredDiaries=(data.diaries||[]).map(item=>({...item,updatedAt:restoredAt})),restoredObservations=(data.observations||[]).map(item=>({...item,updatedAt:restoredAt}));
  if(mode==='replace'){records=restoredRecords;notes=restoredNotes;diaries=restoredDiaries;if(Array.isArray(data.observations))observations=restoredObservations;await clearNoteImages()}
  else{
    let recordMap=new Map(records.map(record=>[record.date,record]));for(let record of restoredRecords)recordMap.set(record.date,{...(recordMap.get(record.date)||{}),...record,id:recordMap.get(record.date)?.id||record.id});records=[...recordMap.values()];
    let noteMap=new Map(notes.map(note=>[note.id,note]));for(let note of restoredNotes)noteMap.set(note.id,note);notes=[...noteMap.values()];
    let diaryMap=new Map(diaries.map(diary=>[diary.date,diary]));for(let diary of restoredDiaries)diaryMap.set(diary.date,diary);diaries=[...diaryMap.values()];
    let observationMap=new Map(observations.map(item=>[item.id,item]));for(let item of restoredObservations)observationMap.set(item.id,item);observations=[...observationMap.values()];
  }
  let planCount=window.restoreInsightPlans?.(data.plans,mode,restoredAt)||0,summaryCount=window.restoreInsightSummaries?.(data.summaries,mode,restoredAt)||0;await restoreNoteImages(images);restoreBackupDrafts(data.drafts,mode);window.markCloudRestorePending?.();localStorage.setItem('phd-cloud-restore-pending',restoredAt);save();saveNotes();saveDiaries();saveObservations();page('home');restoreStatus(`恢复完成：${data.records.length} 天复盘，${data.notes.length} 条随手记，${images.length} 张图片，${(data.diaries||[]).length} 篇日记，${restoredObservations.length} 篇观察练习${planCount?`，${planCount} 条计划`:''}${summaryCount?`，${summaryCount} 个洞见周期`:''}。${!Array.isArray(data.observations)?'旧版备份不含观察练习，已保留本机观察记录。':''}下一次同步会优先保留本次恢复的数据。`);
}
$('#fullBackup').onclick=exportFullBackup;
