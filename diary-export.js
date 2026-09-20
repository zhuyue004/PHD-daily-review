function allExportRows(){return records.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>Object.fromEntries([['日期',r.date],['记录地点',r.location||''],['今日核心目标',numbered(r.goals)],...Q.map(q=>[q[1],numbered(r[q[0]])])]))}
function noteExportRows(){return notes.slice().sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||'')).map(note=>({'日期':note.date,'记录时间':note.createdAt||'','内容':note.text||'','图片数':(note.images||[]).length||'','记录ID':note.id||''}))}
function diaryExportRows(){return diaries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(diary=>({'日期':diary.date,'正文':diary.text||'','地点':diary.place||'','图片数':(diary.images||[]).length||'','记录ID':diary.id||''}))}
const numbered=value=>(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((x,index)=>`${index+1}. ${x}`).join('\n');
// Excel allows at most 32,767 UTF-16 code units in one cell. Keep a margin so
// even older spreadsheet readers can open the file without losing any text.
const EXCEL_TEXT_CHUNK=30000;
function excelTextChunks(value,limit=EXCEL_TEXT_CHUNK){
  let parts=[],part='',length=0;
  for(let character of String(value??'')){
    if(length+character.length>limit){parts.push(part);part='';length=0}
    part+=character;length+=character.length;
  }
  parts.push(part);
  return parts;
}
function splitExcelRows(rows){
  return rows.map(row=>{
    let result={};
    for(let [key,value] of Object.entries(row)){
      if(typeof value!=='string'){result[key]=value;continue}
      let parts=excelTextChunks(value);result[key]=parts[0];
      for(let index=1;index<parts.length;index++)result[`${key}（续${index}）`]=parts[index];
    }
    return result;
  });
}
const exportFont={name:'Microsoft YaHei',sz:10,color:{rgb:'1F2937'}},thin={style:'thin',color:{rgb:'D9E2F0'}};
function styleExportSheet(ws,rows,widths){let range=XLSX.utils.decode_range(ws['!ref']),last=range.e.r+1,lastCol=XLSX.utils.encode_col(range.e.c);ws['!cols']=Array.from({length:range.e.c+1},(_,index)=>widths[index]||{wch:42});ws['!rows']=[{hpt:30},...rows.map(row=>{let height=Math.min(150,Math.max(36,...Object.values(row).map(value=>String(value||'').split('\n').length*18+12)));return {hpt:height}})];for(let col=0;col<=range.e.c;col++){let cell=ws[XLSX.utils.encode_cell({r:0,c:col})];cell.s={font:{name:'Microsoft YaHei',sz:11,bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'1769AA'}},alignment:{horizontal:'center',vertical:'center',wrapText:true},border:{top:thin,bottom:thin,left:thin,right:thin}}}for(let row=1;row<=range.e.r;row++)for(let col=0;col<=range.e.c;col++){let cell=ws[XLSX.utils.encode_cell({r:row,c:col})];if(!cell)continue;cell.s={font:exportFont,fill:row%2?{fgColor:{rgb:'F6F9FC'}}:undefined,alignment:{vertical:'top',horizontal:col<2?'center':'left',wrapText:true},border:{bottom:thin}}}ws['!autofilter']={ref:`A1:${lastCol}${last}`};ws['!freeze']={xSplit:0,ySplit:1};ws['!margins']={left:.25,right:.25,top:.5,bottom:.5,header:.2,footer:.2};ws['!pageSetup']={orientation:'landscape',paperSize:9,fitToWidth:1,fitToHeight:0};ws['!printArea']=`A1:${lastCol}${last}`}
function appendExportSheet(wb,name,rows,headers,widths){let prepared=splitExcelRows(rows),ws=rows.length?XLSX.utils.json_to_sheet(prepared):XLSX.utils.aoa_to_sheet([headers]);styleExportSheet(ws,prepared,widths);XLSX.utils.book_append_sheet(wb,ws,name);return ws}
function printSheet(rows){
  let data=[['博士日课 · 打印版'],['导出时间',new Date().toLocaleString('zh-CN')]],merges=[XLSX.utils.decode_range('A1:F1')];
  for(let entry of rows){
    data.push([],[`日期：${entry['日期']}`]);
    merges.push(XLSX.utils.decode_range(`A${data.length}:F${data.length}`));
    for(let [label,value] of Object.entries(entry)){
      if(label==='日期'||!value)continue;
      excelTextChunks(value).forEach((part,index)=>{
        data.push([index?`${label}（续${index}）`:label,part]);
        merges.push(XLSX.utils.decode_range(`B${data.length}:F${data.length}`));
      });
    }
  }
  let ws=XLSX.utils.aoa_to_sheet(data);ws['!merges']=merges;
  ws['!cols']=[{wch:16},{wch:25},{wch:25},{wch:25},{wch:25},{wch:25}];
  ws['!rows']=data.map((row,index)=>({hpt:index===0?30:index===1?22:Math.min(130,Math.max(24,String(row[1]||row[0]||'').split('\n').length*18+12))}));
  for(let row=0;row<data.length;row++)for(let col=0;col<6;col++){
    let cell=ws[XLSX.utils.encode_cell({r:row,c:col})];if(!cell)continue;
    let isTitle=row===0,isDate=data[row].length===1&&row>1,isLabel=col===0&&row>1;
    cell.s={font:{name:'Microsoft YaHei',sz:isTitle?16:isDate?12:10,bold:isTitle||isDate||isLabel,color:{rgb:isTitle?'FFFFFF':'1F2937'}},fill:isTitle?{fgColor:{rgb:'1769AA'}}:isDate?{fgColor:{rgb:'DCEEFF'}}:isLabel?{fgColor:{rgb:'EEF4FA'}}:undefined,alignment:{vertical:'top',horizontal:isTitle||isDate?'center':'left',wrapText:true},border:{bottom:thin}};
  }
  ws['!margins']={left:.45,right:.45,top:.55,bottom:.55,header:.2,footer:.25};
  ws['!pageSetup']={orientation:'portrait',paperSize:9,fitToWidth:1,fitToHeight:0};
  return ws;
}
function buildExportBook(){
  let rows=allExportRows(),wb=XLSX.utils.book_new();
  appendExportSheet(wb,'每日复盘',rows,['日期','记录地点','今日核心目标',...Q.map(q=>q[1])],[{wch:14},{wch:28},{wch:42},...Q.map(()=>({wch:48}))]);
  appendExportSheet(wb,'随手记',noteExportRows(),['日期','记录时间','内容','图片数','记录ID'],[{wch:14},{wch:25},{wch:90},{wch:12},{wch:38,hidden:true}]);
  appendExportSheet(wb,'日记',diaryExportRows(),['日期','正文','地点','图片数','记录ID'],[{wch:14},{wch:90},{wch:38},{wch:12},{wch:38,hidden:true}]);
  XLSX.utils.book_append_sheet(wb,printSheet(rows),'打印版');
  let plans=window.insightPlanExportRows?.()||[];
  if(plans.length){
    let planSheet=XLSX.utils.json_to_sheet(splitExcelRows(plans));
    planSheet['!cols']=[{wch:12},{wch:18},{wch:12},{wch:50},{wch:22}];
    XLSX.utils.book_append_sheet(wb,planSheet,'周月计划');
  }
  let observationRows=observations.slice().sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||'')).map(item=>({'日期':item.date,'记录时间':item.createdAt||'','标题':item.title||'','正文':item.text||'','分析':item.analysis||'','地点':item.place||'','记录ID':item.id}));
  appendExportSheet(wb,'观察练习',observationRows,['日期','记录时间','标题','正文','分析','地点','记录ID'],[{wch:14},{wch:25},{wch:32},{wch:70},{wch:70},{wch:38},{wch:38,hidden:true}]);
  return wb;
}
function exportExcel(){if(!records.length&&!notes.length&&!diaries.length&&!observations.length)return alert('还没有可导出的记录。');if(!window.__styledXlsxReady)return alert('正在加载 Excel 排版组件，请稍后再试。');let wb=buildExportBook(),d=new Date(),p=n=>String(n).padStart(2,'0'),stamp=`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;XLSX.writeFile(wb,`博士日课复盘记录_${stamp}.xlsx`,{cellStyles:true})}
function excelBlob(){if(!window.__styledXlsxReady)throw new Error('Excel 排版组件未加载，请联网后重试。');return new Blob([XLSX.write(buildExportBook(),{bookType:'xlsx',type:'array',cellStyles:true})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
$('#excel').onclick=exportExcel;
