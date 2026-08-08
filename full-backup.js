const backupStamp=()=>{let d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`};
async function exportFullBackup(){
  if(!window.JSZip)return alert('备份组件未加载，请联网后重试。');
  try{
    let zip=new JSZip(),images=await allNoteImages(),manifest=[];
    let usedNames=new Set();for(let image of images){let note=notes.find(item=>item.id===image.noteId),extension=(image.name||'').split('.').pop()||'jpg',base=note?`随手记${imageStamp(note.createdAt)}`:`随手记${image.id}`,name=`${base}.${extension}`,number=2;while(usedNames.has(name)){name=`${base}_${number++}.${extension}`}usedNames.add(name);let path=`images/${name}`;zip.file(path,image.blob);manifest.push({id:image.id,noteId:image.noteId,name,type:image.type,path})}
    zip.file('backup.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),records,notes,diaries,images:manifest},null,2));
    zip.file('博士日课复盘.xlsx',excelBlob());
    download(await zip.generateAsync({type:'blob'}),`博士日课完整备份_${backupStamp()}.zip`,'application/zip');
  }catch(error){alert(`生成完整备份失败：${error.message}`)}
}
async function restoreFullBackup(file){
  if(!window.JSZip)throw new Error('备份组件未加载，请联网后重试。');
  let zip=await JSZip.loadAsync(file),source=zip.file('backup.json');
  if(!source)throw new Error('未找到 backup.json，请选择“博士日课”导出的完整备份包。');
  let data=JSON.parse(await source.async('string'));
  if(data.version!==1||!Array.isArray(data.notes)||!Array.isArray(data.records))throw new Error('备份包格式不正确。');
  let images=[];
  for(let meta of data.images||[]){let item=zip.file(meta.path);if(item)images.push({...meta,blob:await item.async('blob')})}
  let mode=$('#restoreMode').value,word=mode==='replace'?'完全恢复会清空本机现有记录和图片，确定继续吗？':'合并恢复会用备份中相同日期的内容及图片覆盖本机内容，确定继续吗？';
  if(!confirm(word))return;
  if(mode==='replace'){records=data.records;notes=data.notes;diaries=data.diaries||[];await clearNoteImages()}
  else{
    let recordMap=new Map(records.map(record=>[record.date,record]));for(let record of data.records)recordMap.set(record.date,{...(recordMap.get(record.date)||{}),...record,id:recordMap.get(record.date)?.id||record.id});records=[...recordMap.values()];
    let noteDates=new Set(data.notes.map(note=>note.date)),oldNoteIds=notes.filter(note=>noteDates.has(note.date)).map(note=>note.id);await deleteNoteImages(oldNoteIds);notes=notes.filter(note=>!noteDates.has(note.date)).concat(data.notes);
    let diaryDates=new Set((data.diaries||[]).map(diary=>diary.date));diaries=diaries.filter(diary=>!diaryDates.has(diary.date)).concat(data.diaries||[]);
  }
  await restoreNoteImages(images);save();saveNotes();saveDiaries();page('home');restoreStatus(`恢复完成：${data.records.length} 天复盘，${data.notes.length} 条随手记，${images.length} 张图片，${(data.diaries||[]).length} 篇日记。`);
}
$('#fullBackup').onclick=exportFullBackup;
