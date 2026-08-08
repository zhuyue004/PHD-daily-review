const restoreStatus=text=>$('#restoreStatus').textContent=text;
const restoreText=value=>(value??'').toString().split(/\r?\n/).map(line=>line.replace(/^\s*\d+\.\s?/, '')).join('\n').trim();

function restoreDate(value){
  let match=(value??'').toString().trim().match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
  return match?`${match[1]}-${match[2]}-${match[3]}`:'';
}

function importNotes(value,date,times){
  let timeRows=(times??'').toString().split(/\r?\n/).map(line=>line.trim());
  return (value??'').toString().split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
    let match=line.match(/^(\d{1,2}:\d{2})\s+(.+)$/),timeMatch=timeRows[index]?.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/),time=timeMatch?`${timeMatch[1].padStart(2,'0')}:${timeMatch[2]}:${timeMatch[3]||'00'}`:match?`${match[1]}:00`:'12:00:00',text=match?match[2]:line;
    return {id:crypto.randomUUID(),date,createdAt:new Date(`${date}T${time}`).toISOString(),text};
  });
}

async function restoreExcel(file){
  if(!file)return;
  try{
    if(!window.XLSX)throw new Error('Excel 组件未加载，请联网后重试。');
    let book=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=book.Sheets[book.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
    if(!rows.length)throw new Error('Excel 中没有可恢复的数据。');
    let imported=[],importedNotes=[],importedDiaries=[],noteDates=new Set(),diaryDates=new Set();
    for(let row of rows){
      let date=restoreDate(row['日期']); if(!date)continue;
      let record={id:crypto.randomUUID(),date};
      if(Object.prototype.hasOwnProperty.call(row,'今日核心目标'))record.goals=restoreText(row['今日核心目标']);
      for(let q of Q)if(Object.prototype.hasOwnProperty.call(row,q[1]))record[q[0]]=restoreText(row[q[1]]);
      if(Object.prototype.hasOwnProperty.call(row,'记录位置'))record.location=(row['记录位置']??'').toString().trim();
      if(Object.keys(record).length>2)imported.push(record);
      if(Object.prototype.hasOwnProperty.call(row,'随手记')){noteDates.add(date);importedNotes.push(...importNotes(row['随手记'],date,row['随手记记录时间']));}
      if(Object.prototype.hasOwnProperty.call(row,'日记')){diaryDates.add(date);let text=(row['日记']??'').toString().trim(),place=(row['日记地点']??'').toString().trim();if(text)importedDiaries.push({id:crypto.randomUUID(),date,text,place,updatedAt:new Date().toISOString()});}
    }
    if(!imported.length&&!importedNotes.length&&!importedDiaries.length)throw new Error('未识别到“博士日课”记录，请确认选择了导出的 Excel。');
    let mode=$('#restoreMode').value,word=mode==='replace'?'完全恢复会清空本机现有记录，确定继续吗？':'合并恢复会用 Excel 中相同日期的内容覆盖本机对应内容，确定继续吗？';
    if(!confirm(word))return;
    if(mode==='replace'){records=imported;notes=importedNotes;diaries=importedDiaries}
    else{
      let map=new Map(records.map(r=>[r.date,r]));
      for(let record of imported)map.set(record.date,{...(map.get(record.date)||{}),...record,id:map.get(record.date)?.id||record.id});
      records=[...map.values()];
      if(noteDates.size)notes=notes.filter(note=>!noteDates.has(note.date)).concat(importedNotes);
      if(diaryDates.size)diaries=diaries.filter(item=>!diaryDates.has(item.date)).concat(importedDiaries);
    }
    save();saveNotes();saveDiaries();page('home');restoreStatus(`恢复完成：${imported.length} 天复盘，${importedNotes.length} 条随手记，${importedDiaries.length} 篇日记。`);
  }catch(error){restoreStatus(`恢复失败：${error.message}`)}
}

$('#restoreExcel').onclick=()=>$('#restoreFile').click();
$('#restoreFile').onchange=async event=>{let file=event.target.files[0];try{if(file&&/\.zip$/i.test(file.name))await restoreFullBackup(file);else await restoreExcel(file)}catch(error){restoreStatus(`恢复失败：${error.message}`)}event.target.value=''};
