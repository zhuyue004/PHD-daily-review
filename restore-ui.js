const restoreStatus=text=>$('#restoreStatus').textContent=text;
const restoreText=value=>(value??'').toString().split(/\r?\n/).map(line=>line.replace(/^\s*\d+\.\s?/, '')).join('\n').trim();

function restoreDate(value){
  let match=(value??'').toString().trim().match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
  return match?`${match[1]}-${match[2]}-${match[3]}`:'';
}

function joinExcelContinuationCells(row){
  let bases=new Set();
  for(let key of Object.keys(row)){
    let match=key.match(/^(.*)（续(\d+)）$/);
    if(match&&Object.prototype.hasOwnProperty.call(row,match[1]))bases.add(match[1]);
  }
  for(let base of bases){
    let text=(row[base]??'').toString();
    for(let index=1;Object.prototype.hasOwnProperty.call(row,`${base}（续${index}）`);index++)text+=(row[`${base}（续${index}）`]??'').toString();
    row[base]=text;
  }
  return row;
}

function importNotes(value,date,times){
  let timeRows=(times??'').toString().split(/\r?\n/).map(line=>line.trim()).filter(Boolean),items=[],current=null,fallback=0,add=()=>{if(current&&current.text.trim())items.push({...current,text:current.text.trim()})};
  for(let raw of (value??'').toString().split(/\r?\n/)){let line=raw.trim(),bracket=line.match(/^【(\d{1,2}:\d{2}(?::\d{2})?)】$/),inline=line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/),time=bracket?.[1]||inline?.[1];if(time){add();let parts=time.split(':');current={time:`${parts[0].padStart(2,'0')}:${parts[1]}:${parts[2]||'00'}`,text:inline?.[2]||''};fallback++;continue}if(!current){if(!line)continue;let match=timeRows[fallback]?.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/),time=match?`${match[1].padStart(2,'0')}:${match[2]}:${match[3]||'00'}`:'12:00:00';current={time,text:''};fallback++}if(!line){if(current.text)current.text+='\n';continue}current.text+=`${current.text?'\n':''}${line}`}
  add();return items.map(item=>({id:crypto.randomUUID(),date,createdAt:new Date(`${date}T${item.time}`).toISOString(),text:item.text}));
}

async function restoreExcel(file){
  if(!file)return;
  try{
    if(!window.XLSX)throw new Error('Excel 组件未加载，请联网后重试。');
    let book=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=book.Sheets['每日复盘']||book.Sheets[book.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:''}).map(joinExcelContinuationCells);
    let noteRows=book.Sheets['随手记']?XLSX.utils.sheet_to_json(book.Sheets['随手记'],{defval:''}).map(joinExcelContinuationCells):[];
    let diaryRows=book.Sheets['日记']?XLSX.utils.sheet_to_json(book.Sheets['日记'],{defval:''}).map(joinExcelContinuationCells):[];
    let hasObservationSheet=!!book.Sheets['观察练习'],observationRows=hasObservationSheet?XLSX.utils.sheet_to_json(book.Sheets['观察练习'],{defval:''}).map(joinExcelContinuationCells):[];
    if(!rows.length&&!noteRows.length&&!diaryRows.length&&!observationRows.length)throw new Error('Excel 中没有可恢复的数据。');
    let imported=[],importedNotes=[],importedDiaries=[],importedObservations=[],noteDates=new Set(),diaryDates=new Set(),restoredAt=new Date().toISOString();
    for(let row of rows){
      let date=restoreDate(row['日期']); if(!date)continue;
      let record={id:crypto.randomUUID(),date,updatedAt:restoredAt};
      if(Object.prototype.hasOwnProperty.call(row,'今日核心目标'))record.goals=restoreText(row['今日核心目标']);
      for(let q of Q)if(Object.prototype.hasOwnProperty.call(row,q[1]))record[q[0]]=restoreText(row[q[1]]);
      if(Object.prototype.hasOwnProperty.call(row,'记录地点')||Object.prototype.hasOwnProperty.call(row,'记录位置'))record.location=(row['记录地点']??row['记录位置']??'').toString().trim();
      if(Object.keys(record).some(key=>!['id','date','updatedAt'].includes(key)))imported.push(record);
      if(!book.Sheets['随手记']&&Object.prototype.hasOwnProperty.call(row,'随手记')){noteDates.add(date);importedNotes.push(...importNotes(row['随手记'],date,row['随手记记录时间']).map(note=>({...note,updatedAt:restoredAt})));}
      if(!book.Sheets['日记']&&Object.prototype.hasOwnProperty.call(row,'日记')){diaryDates.add(date);let text=(row['日记']??'').toString().trim(),place=(row['日记地点']??'').toString().trim();if(text)importedDiaries.push({id:crypto.randomUUID(),date,text,place,updatedAt:restoredAt});}
    }
    for(let row of noteRows){
      let date=restoreDate(row['日期']),text=(row['内容']??'').toString();if(!date||!text.trim())continue;
      let stamp=(row['记录时间']??'').toString().trim(),createdAt=!Number.isNaN(Date.parse(stamp))?new Date(stamp).toISOString():new Date(`${date}T12:00:00`).toISOString();
      importedNotes.push({id:(row['记录ID']??'').toString().trim()||crypto.randomUUID(),date,createdAt,text,updatedAt:restoredAt});
    }
    for(let row of diaryRows){
      let date=restoreDate(row['日期']),text=(row['正文']??'').toString();if(!date||!text.trim())continue;
      importedDiaries.push({id:(row['记录ID']??'').toString().trim()||crypto.randomUUID(),date,text,place:(row['地点']??'').toString().trim(),updatedAt:restoredAt});
    }
    for(let row of observationRows){
      let date=restoreDate(row['日期']),title=(row['标题']??'').toString().trim(),text=(row['正文']??'').toString().trim();
      if(!date||!title||!text)continue;
      let createdAt=(row['记录时间']??'').toString().trim(),id=(row['记录ID']??'').toString().trim();
      importedObservations.push({id:id||crypto.randomUUID(),date,title,text,analysis:(row['分析']??'').toString().trim(),place:(row['地点']??'').toString().trim(),createdAt:!Number.isNaN(Date.parse(createdAt))?createdAt:restoredAt,updatedAt:restoredAt,...((row['原文来源']??'').toString().trim()?{originalText:(row['修改前']??'').toString(),originalSource:(row['原文来源']??'').toString().trim()}:{})});
    }
    if(!imported.length&&!importedNotes.length&&!importedDiaries.length&&!importedObservations.length)throw new Error('未识别到“博士日课”记录，请确认选择了导出的 Excel。');
    let mode=$('#restoreMode').value,word=mode==='replace'?'完全恢复会清空本机现有记录，确定继续吗？':'合并恢复会用 Excel 中相同日期的内容覆盖本机对应内容，确定继续吗？';
    if(!confirm(word))return;
    if(mode==='replace'){records=imported;notes=importedNotes;diaries=importedDiaries;if(hasObservationSheet)observations=importedObservations}
    else{
      let map=new Map(records.map(r=>[r.date,r]));
      for(let record of imported)map.set(record.date,{...(map.get(record.date)||{}),...record,id:map.get(record.date)?.id||record.id});
      records=[...map.values()];
      // “合并恢复”绝不删除本机随手记；旧版在 Excel 未正确解析时会先清空同日随手记。
      let noteMap=new Map(notes.map(note=>[note.id||`${note.date}|${note.createdAt}|${note.text}`,note]));
      let noteSignatures=new Map([...noteMap].map(([key,note])=>[`${note.date}|${note.createdAt}|${note.text}`,key]));
      for(let note of importedNotes){let signature=`${note.date}|${note.createdAt}|${note.text}`,key=noteMap.has(note.id)?note.id:(noteSignatures.get(signature)||note.id||signature),old=noteMap.get(key);noteMap.set(key,{...old,...note,id:old?.id||note.id,images:old?.images||note.images});noteSignatures.set(signature,key);}
      notes=[...noteMap.values()];
      // 合并恢复只能加入或更新成功识别的日记，不能因空单元格清空本机日记。
      let diaryMap=new Map(diaries.map(item=>[item.date,item]));
      for(let diary of importedDiaries){let old=diaryMap.get(diary.date);diaryMap.set(diary.date,{...old,...diary,images:old?.images||diary.images});}
      diaries=[...diaryMap.values()];
      let observationMap=new Map(observations.map(item=>[item.id,item]));
      for(let item of importedObservations){let old=observationMap.get(item.id);observationMap.set(item.id,{...old,...item,...(old?.originalText!==undefined&&item.originalText===undefined?{originalText:old.originalText,originalSource:old.originalSource}:{})});}
      observations=[...observationMap.values()];
    }
    window.markCloudRestorePending?.();localStorage.setItem('phd-cloud-restore-pending',restoredAt);save();saveNotes();saveDiaries();saveObservations();page('home');restoreStatus(`恢复完成：${imported.length} 天复盘，${importedNotes.length} 条随手记，${importedDiaries.length} 篇日记，${importedObservations.length} 篇观察练习。${!hasObservationSheet?'旧版 Excel 不含观察练习，已保留本机观察记录。':''}Excel 不含图片和草稿；完整还原请使用完整备份包。下一次同步会优先保留本次恢复的数据。${mode==='merge'&&!importedNotes.length?' 未识别到随手记时已保留本机随手记。':''}${mode==='merge'&&!importedDiaries.length?' 未识别到日记时已保留本机日记。':''}`);
  }catch(error){restoreStatus(`恢复失败：${error.message}`)}
}

$('#restoreExcel').onclick=()=>$('#restoreFile').click();
$('#restoreFile').onchange=async event=>{let file=event.target.files[0];try{if(file&&/\.zip$/i.test(file.name))await restoreFullBackup(file);else await restoreExcel(file)}catch(error){restoreStatus(`恢复失败：${error.message}`)}event.target.value=''};
