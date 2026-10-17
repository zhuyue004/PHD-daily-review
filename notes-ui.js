const noteModal=$('#noteModal'),noteInput=$('#noteInput'),noteImagesInput=$('#noteImages'),noteCameraInput=$('#noteCamera'),notePreview=$('#noteImagePreview');
let pendingNoteImages=[],cropSelectedImage=false;
window.noteEditorImages=[];
const NOTE_DRAFTS_KEY='phd-quick-note-drafts';
let noteDraftTimer;
let noteDraftStatusTimer;
function showNoteDraftStatus(text,settled=false){let status=$('#noteDraftStatus');if(!status){status=document.createElement('p');status.id='noteDraftStatus';status.className='local-draft-status';noteInput.insertAdjacentElement('afterend',status)}clearTimeout(noteDraftStatusTimer);status.textContent=text;status.classList.toggle('settled',settled);if(settled)noteDraftStatusTimer=setTimeout(()=>{status.textContent=''},1600)}
function noteDrafts(){try{return JSON.parse(localStorage.getItem(NOTE_DRAFTS_KEY)||'{}')}catch{return {}}}
function noteDraftKey(noteId=''){return noteId?`edit:${noteId}`:'new'}
function saveNoteDraftNow(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){if(noteModal.classList.contains('hidden'))return;let drafts=noteDrafts();drafts[key]={text:noteInput.value,template:selectedNoteTemplate||'',createdAt:$('#editNoteCreatedAt')?.hidden?undefined:$('#editNoteCreatedAt input')?.value,updatedAt:new Date().toISOString()};localStorage.setItem(NOTE_DRAFTS_KEY,JSON.stringify(drafts));showNoteDraftStatus('草稿已保存到本机',true)}
function queueNoteDraft(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){clearTimeout(noteDraftTimer);showNoteDraftStatus('正在自动保存本地…');noteDraftTimer=setTimeout(()=>saveNoteDraftNow(key),350)}
function restoreNoteDraft(key='new'){let saved=noteDrafts()[key];if(!saved)return false;noteInput.value=saved.text||'';selectedNoteTemplate=saved.template||'';let time=$('#editNoteCreatedAt input');if(time&&saved.createdAt)time.value=saved.createdAt;renderNoteTemplates();return true}
function clearNoteDraft(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){clearTimeout(noteDraftTimer);let drafts=noteDrafts();if(!(key in drafts))return;delete drafts[key];localStorage.setItem(NOTE_DRAFTS_KEY,JSON.stringify(drafts))}
const noteTemplates={
  '小循环':'【小循环】\n问题：\n尝试：\n结果：\n不确定：\n下一步：',
  '问题':'【问题】\n现象：\n我猜：\n已有证据：\n下一步：',
  '实验 / 数据':'【实验 / 数据】\n条件 / 版本：\n做了什么：\n结果：\n可能原因：\n下一步：',
  '读文献':'【读文献】\n论文题目：\n原文位置：\n① 这一部分在讨论什么问题？\n② 这一部分作者提出了什么观点、发现或结论？\n③ 作者用了什么方法、数据或证据支持这些观点？\n④ 这些观点成立的条件、适用范围或局限是什么？\n⑤ 这一部分对我的博士课题有什么用？\n⑥ 我还有什么没看懂或不确定？',
  '写论文':'【写论文】\n研究问题：\n方法：\n当前结果：\n不确定处：\n下一步：',
  '读书':'【读书】\n书 / 章节：\n核心内容：\n我的理解：\n和研究或生活的关联：\n想继续追问 / 行动：',
  '沟通':'【沟通】\n和谁讨论：\n达成结论 / 仍有分歧：\n我准备采取的动作：',
  '选择 / 决策':'【选择 / 决策】\n要做的选择：\n备选方案：\n考虑因素：\n当前决定：\n之后验证：',
  '灵感':'【灵感】\n想到：\n为什么可能有用：\n最小验证：'
};
const noteExamples={
  '小循环':'【小循环】\n问题：为什么这组结果波动很大？\n尝试：固定随机种子，重复运行 3 次。\n结果：波动仍然存在，但比之前小。\n不确定：是否由训练数据量太少造成？\n下一步：把样本量从 100 增加到 300，再比较方差。',
  '问题':'【问题】\n现象：参数变化后结果不稳定。\n我猜：可能与随机初始化有关。\n已有证据：固定数据集后仍有波动。\n下一步：固定随机种子后重复运行。',
  '实验 / 数据':'【实验 / 数据】\n条件 / 版本：数据集 A，代码提交 v0.3，参数 α=0.2。\n做了什么：比较方法 M 和基线 B。\n结果：M 的误差下降，但波动变大。\n可能原因：训练数据量不足。\n下一步：重复运行 10 次并比较。',
  '读文献':'【读文献】\n论文题目：某篇关于反演方法的论文。\n原文位置：第 6 页，图 3。\n① 这一部分在讨论什么问题？参数识别的稳定性。\n② 这一部分作者提出了什么观点、发现或结论？先验约束能提高稳定性。\n③ 作者用了什么方法、数据或证据支持这些观点？对比不同样本量下的反演结果。\n④ 这些观点成立的条件、适用范围或局限是什么？需要与数据质量和样本量一起考虑。\n⑤ 这一部分对我的博士课题有什么用？可用于当前参数识别。\n⑥ 我还有什么没看懂或不确定？样本量变化是否影响结论。',
  '写论文':'【写论文】\n研究问题：某方法在不同参数条件下，是否能更稳定地识别 X？\n方法：固定数据集 A，改变参数 α 为 0.1、0.2、0.3，对比方法 M 和基线 B。\n当前结果：α=0.2 时 M 的误差最低；但样本量较小时波动明显增大。\n不确定处：波动来自参数、数据划分，还是随机初始化？\n下一步：固定随机种子，重复 10 次 α=0.2 的实验，记录均值和方差。',
  '读书':'【读书】\n书 / 章节：《如何阅读一本书》第四篇。\n核心内容：阅读不是摘录，而是带着问题与作者对话。\n我的理解：读论文前先写下想回答的问题，能避免只记零散结论。\n和研究或生活的关联：下次精读文献时可先列出三个问题。\n想继续追问 / 行动：试着用这个方法读下一篇关键论文。',
  '沟通':'【沟通】\n和谁讨论：与导师讨论阶段性结果。\n达成结论 / 仍有分歧：先验证基础假设；模型结构是否需要调整仍待讨论。\n我准备采取的动作：整理假设与验证清单。',
  '选择 / 决策':'【选择 / 决策】\n要做的选择：先扩充数据还是先调模型。\n备选方案：扩充数据；调整模型结构。\n考虑因素：当前误差主要来自样本不足。\n当前决定：先扩充数据。\n之后验证：比较扩充前后的稳定性。',
  '灵感':'【灵感】\n想到：把误差按频段分别评价。\n为什么可能有用：可定位问题主要来源。\n最小验证：先用已有两组数据画图比较。'
};
let selectedNoteTemplate='';
function renderNoteTemplates(){let holder=$('#noteTemplates'),example=$('#noteTemplateExample');if(!holder||!example)return;holder.innerHTML=Object.keys(noteTemplates).map(name=>`<button class="${selectedNoteTemplate===name?'selected':''}" data-template="${name}" type="button">${name}</button>`).join('');example.innerHTML=selectedNoteTemplate?`<p>示例</p><pre>${esc(noteExamples[selectedNoteTemplate])}</pre>`:'';$$('#noteTemplates button').forEach(button=>button.onclick=()=>{let name=button.dataset.template,onlyTag=/^【[^】]+】\s*$/.test(noteInput.value);if(noteInput.value.trim()&&!onlyTag&&!confirm('切换分类会覆盖当前内容，继续吗？'))return;selectedNoteTemplate=name;noteInput.value=noteTemplates[name];renderNoteTemplates();queueNoteDraft();noteInput.focus()})}
function resetNoteTemplate(){selectedNoteTemplate='';renderNoteTemplates()}
function ensureNoteTemplates(){if($('#noteTemplates'))return;let holder=document.createElement('div');holder.id='noteTemplates';holder.className='note-templates';let example=document.createElement('div');example.id='noteTemplateExample';example.className='note-template-example';let hint=document.createElement('p');hint.className='note-template-hint';hint.textContent='选择一个分类模板；每条随手记只记录一个可追溯的研究线索。';noteInput.before(hint);noteInput.before(example);noteInput.before(holder);renderNoteTemplates()}
ensureNoteTemplates();
function ensureScreenCaptureButton(){if($('#captureNoteScreen'))return;let screenButton=document.createElement('button');screenButton.id='captureNoteScreen';screenButton.className='plain';screenButton.type='button';screenButton.textContent='截取屏幕（桌面版）';$('#chooseNoteImage').after(screenButton);screenButton.onclick=captureNoteScreen}
async function captureNoteScreen(){
  if(window.phdDesktop?.captureScreen){
    try{
      let dataUrl=await window.phdDesktop.captureScreen(),blob=await (await fetch(dataUrl)).blob();
      if(blob)openScreenCropper(blob,'屏幕截图');
    }catch(error){alert(`未能截取屏幕：${error.message||'请重试。'}`)}
    return;
  }
  if(!navigator.mediaDevices?.getDisplayMedia){alert('iPhone 网页无法直接调用系统截屏。请按“侧边键＋音量加”截屏，返回后点“添加截图”从照片中选择。');return}
  try{
    let stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false}),video=document.createElement('video');
    video.muted=true;video.srcObject=stream;await video.play();await new Promise(resolve=>requestAnimationFrame(resolve));
    let canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);stream.getTracks().forEach(track=>track.stop());
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(blob)openScreenCropper(blob,'屏幕截图');
  }catch(error){if(error.name!=='AbortError')alert('未能截取屏幕，请重试或使用“添加截图”。')}
}
function openScreenCropper(blob,fileLabel='裁剪截图'){
  let url=URL.createObjectURL(blob),modal=document.createElement('div');
  modal.className='modal screen-crop-modal';
  modal.innerHTML=`<div><section class="screen-crop-dialog"><h2>裁剪图片区域</h2><p>在图片上拖动，框选要保存的区域。</p><div class="screen-crop-stage"><img src="${url}" alt="图片裁剪预览"><i></i></div><div class="screen-crop-actions"><button class="plain" type="button">取消</button><button class="confirm-crop" type="button">添加选中区域</button></div></section></div>`;
  document.body.append(modal);
  let stage=$('.screen-crop-stage'),image=stage.querySelector('img'),selection=stage.querySelector('i'),start=null,crop=null,usingPointer=false;
  Object.assign(selection.style,{position:'absolute',display:'block',pointerEvents:'none',boxSizing:'border-box',zIndex:'2'});
  const point=event=>{let rect=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(rect.width,event.clientX-rect.left)),y:Math.max(0,Math.min(rect.height,event.clientY-rect.top))}};
  const draw=event=>{if(!start)return;let end=point(event);crop={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};Object.assign(selection.style,{left:`${crop.x}px`,top:`${crop.y}px`,width:`${crop.width}px`,height:`${crop.height}px`})};
  const close=()=>{URL.revokeObjectURL(url);modal.remove()};
  const begin=event=>{if(event.button!==undefined&&event.button!==0)return;event.preventDefault();start=point(event);crop=null;Object.assign(selection.style,{left:`${start.x}px`,top:`${start.y}px`,width:'0px',height:'0px'});stage.style.cursor='crosshair'};
  const move=event=>{if(start){event.preventDefault();draw(event)}};
  const finish=event=>{if(!start)return;draw(event);start=null;stage.style.cursor='crosshair'};
  stage.addEventListener('pointerdown',event=>{usingPointer=true;begin(event)});
  window.addEventListener('pointermove',event=>{if(usingPointer)move(event)},true);
  window.addEventListener('pointerup',event=>{if(usingPointer){finish(event);usingPointer=false}},true);
  window.addEventListener('pointercancel',event=>{if(usingPointer){finish(event);usingPointer=false}},true);
  stage.addEventListener('mousedown',event=>{if(!usingPointer)begin(event)});
  window.addEventListener('mousemove',event=>{if(!usingPointer)move(event)},true);
  window.addEventListener('mouseup',event=>{if(!usingPointer)finish(event)},true);
  modal.querySelector('.plain').onclick=close;
  modal.querySelector('.confirm-crop').onclick=async event=>{
    if(!crop||crop.width<4||crop.height<4)return alert('请先拖动选择一个截取区域。');
    let button=event.currentTarget,originalText=button.textContent;button.disabled=true;button.textContent='正在添加…';
    try{
      let rect=stage.getBoundingClientRect(),canvas=document.createElement('canvas'),scaleX=image.naturalWidth/rect.width,scaleY=image.naturalHeight/rect.height;
      canvas.width=Math.max(1,Math.round(crop.width*scaleX));canvas.height=Math.max(1,Math.round(crop.height*scaleY));
      let context=canvas.getContext('2d');if(!context)throw new Error('无法创建图片画布');
      context.drawImage(image,crop.x*scaleX,crop.y*scaleY,crop.width*scaleX,crop.height*scaleY,0,0,canvas.width,canvas.height);
      let result=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!result)throw new Error('未能生成裁剪图片');
      let d=new Date(),p=n=>String(n).padStart(2,'0'),stamp=`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
      addPendingNoteImages([new File([result],`${fileLabel}_${stamp}.png`,{type:'image/png'})]);
      close();
    }catch(error){button.disabled=false;button.textContent=originalText;alert(`添加裁剪区域失败：${error.message||'请重试。'}`)}
  };
}
ensureScreenCaptureButton();
const CIRCLED_NUMBERS='①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳',CHINESE_NUMBERS='一二三四五六七八九十';
function nextChineseNumber(value){let index=CHINESE_NUMBERS.indexOf(value);return index>=0&&index<CHINESE_NUMBERS.length-1?CHINESE_NUMBERS[index+1]:value}
function noteEditorLineBreak(line,{shiftKey=false}={}){
  if(shiftKey)return {insert:'\n'};
  let leading=(line.match(/^[　 \t]*/)||[''])[0],body=line.slice(leading.length),match;
  if(match=body.match(/^([-*+])([ \t]+)(.*)$/))return match[3].trim()?{insert:`\n${leading}${match[1]} `}:{exit:true,leading};
  if(match=body.match(/^(\d{1,3})([.．、])([ \t]+)(.*)$/)){let next=+match[1]+1;return match[4].trim()?{insert:`\n${leading}${next}${match[2]} `}:{exit:true,leading};}
  if(match=body.match(/^[（(](\d{1,3})[）)]([ \t]*)(.*)$/)){let next=+match[1]+1;return match[3].trim()?{insert:`\n${leading}（${next}） `}:{exit:true,leading};}
  if(match=body.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])([ \t]*)(.*)$/)){let index=CIRCLED_NUMBERS.indexOf(match[1]);return match[3].trim()&&index<CIRCLED_NUMBERS.length-1?{insert:`\n${leading}${CIRCLED_NUMBERS[index+1]} `}:match[3].trim()?{insert:`\n${leading}${match[1]} `}:{exit:true,leading};}
  if(match=body.match(/^([一二三四五六七八九十]+)、([ \t]*)(.*)$/))return match[3].trim()?{insert:`\n${leading}${nextChineseNumber(match[1])}、 `}:{exit:true,leading};
  // 普通段落和“字段：内容”都只继承用户原本的行首缩进；不再按字段字符数补空格。
  return {insert:`\n${leading}`};
}
window.noteEditorLineBreak=noteEditorLineBreak;
noteInput.addEventListener('keydown',event=>{if(event.key!=='Enter'||event.isComposing)return;let start=noteInput.selectionStart,end=noteInput.selectionEnd,before=noteInput.value.slice(0,start),lineStart=before.lastIndexOf('\n')+1,line=before.slice(lineStart),action=noteEditorLineBreak(line,{shiftKey:event.shiftKey});if(event.shiftKey)return;event.preventDefault();if(action.exit){noteInput.setRangeText(action.leading,lineStart,start,'end')}else noteInput.setRangeText(action.insert,start,end,'end');noteInput.dispatchEvent(new Event('input',{bubbles:true}));});
function syncNoteEditorImages(){let existing=(window.noteEditorImages||[]).filter(image=>!image.pending);window.noteEditorImages=[...existing,...pendingNoteImages.map(entry=>({id:entry.id,file:entry.file,pending:true}))]}
function renderPendingNoteImages(){notePreview.innerHTML=pendingNoteImages.map((entry,index)=>`<div><img src="${URL.createObjectURL(entry.file)}" alt="待上传图片 ${index+1}">${entry.inline?'<small>文中</small>':''}<button data-index="${index}" aria-label="移除图片">×</button></div>`).join('');$$('#noteImagePreview button').forEach(button=>button.onclick=()=>{let [removed]=pendingNoteImages.splice(+button.dataset.index,1);if(removed?.inline){let marker=`[[图片::${removed.id}]]`;noteInput.value=noteInput.value.replace(new RegExp(`(^|\\n)${marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=\\n|$)`),'$1').replace(/\n{3,}/g,'\n\n');noteInput.dispatchEvent(new Event('input',{bubbles:true}))}syncNoteEditorImages();renderPendingNoteImages()});syncNoteEditorImages()}
function addPendingNoteImages(files,{inline=false,ids=[]}={}){let added=[...files].filter(file=>file?.type?.startsWith('image/')).map((file,index)=>({file,id:ids[index]||crypto.randomUUID(),inline}));pendingNoteImages.push(...added);renderPendingNoteImages();return added}
function clipboardHtmlPlan(html){let doc=new DOMParser().parseFromString(html,'text/html'),images=[],output='',blocks=new Set(['P','DIV','SECTION','ARTICLE','HEADER','FOOTER','H1','H2','H3','H4','H5','H6','LI','UL','OL','BLOCKQUOTE','PRE','TABLE','TR']);let newline=()=>{if(output&&!output.endsWith('\n'))output+='\n'};let nodeText=node=>String(node?.textContent||'').replace(/[\t\r\n ]+/g,' ').trim();let walk=node=>{if(node.nodeType===Node.TEXT_NODE){output+=String(node.nodeValue||'').replace(/[\t\r\n ]+/g,' ');return}if(node.nodeType!==Node.ELEMENT_NODE)return;let tag=node.tagName;if(['SCRIPT','STYLE','NOSCRIPT'].includes(tag))return;if(tag==='IMG'){newline();let id=crypto.randomUUID();images.push({id,src:node.getAttribute('src')||'',alt:node.getAttribute('alt')||''});output+=`[[图片::${id}]]`;newline();return}if(tag==='BR'){output+='\n';return}if(tag==='SUB'||tag==='SUP'){let text=nodeText(node);if(text)output+=tag==='SUB'?`_{${text}}`:`^{${text}}`;return}let block=blocks.has(tag);if(block)newline();if(tag==='LI'){let parent=node.parentElement,prefix=parent?.tagName==='OL'?`${[...parent.children].indexOf(node)+1}. `:'- ';output+=prefix}for(let child of node.childNodes)walk(child);if(block)newline()};walk(doc.body);return {text:output.replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim(),images}}
async function clipboardImageFile(meta,item,index){let direct=item?.getAsFile?.();if(direct?.type?.startsWith('image/'))return direct;try{if(meta.src){let response=await fetch(meta.src),blob=await response.blob();if(response.ok&&blob.type.startsWith('image/'))return new File([blob],`粘贴图片_${index+1}.${imageExtension(blob)}`,{type:blob.type})}}catch{}return null}
async function smartPasteNoteClipboard(transfer){if(!transfer)return {handled:false};let html=transfer.getData('text/html')||'',imageItems=[...(transfer.items||[])].filter(item=>item.kind==='file'&&item.type.startsWith('image/')),hasRichMath=/<\/?(?:sub|sup)\b/i.test(html);if(!/<img\b/i.test(html)&&!imageItems.length&&!hasRichMath)return {handled:false};let plan;if(/<img\b/i.test(html)||hasRichMath)plan=clipboardHtmlPlan(html);else{let images=imageItems.map(()=>({id:crypto.randomUUID(),src:'',alt:''}));plan={images,text:images.map(image=>`[[图片::${image.id}]]`).join('\n')}}let files=[],failed=0;for(let [index,meta] of plan.images.entries()){let file=await clipboardImageFile(meta,imageItems[index],index);if(file)files.push({file,id:meta.id});else{failed++;plan.text=plan.text.replace(`[[图片::${meta.id}]]`,meta.alt?`【图片未能读取：${meta.alt}】`:'【图片未能从剪贴板读取】')}}let start=noteInput.selectionStart,end=noteInput.selectionEnd,insert=plan.text;if(files.length){let ids=files.map(item=>item.id);addPendingNoteImages(files.map(item=>item.file),{inline:true,ids})}noteInput.setRangeText(insert,start,end,'end');noteInput.dispatchEvent(new Event('input',{bubbles:true}));showNoteDraftStatus(files.length?`已智能粘贴 ${files.length} 张图片，文字按随手记格式排版`:'已粘贴文字',true);if(failed)alert(`${failed} 张图片未能从剪贴板读取，已在原位置标记。请使用“添加截图”补充。`);return {handled:true,images:files.length,failed}}
window.smartPasteNoteClipboard=smartPasteNoteClipboard;
noteInput.addEventListener('paste',event=>{let transfer=event.clipboardData,html=transfer?.getData('text/html')||'',hasImage=[...(transfer?.items||[])].some(item=>item.kind==='file'&&item.type.startsWith('image/')),hasRichMath=/<\/?(?:sub|sup)\b/i.test(html);if(!/<img\b/i.test(html)&&!hasImage&&!hasRichMath)return;event.preventDefault();smartPasteNoteClipboard(transfer)});
$('#quickNote').onclick=()=>{noteInput.value='';pendingNoteImages=[];window.noteEditorImages=[];resetNoteTemplate();restoreNoteDraft();renderPendingNoteImages();noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#takeNotePhoto').onclick=()=>noteCameraInput.click();
$('#chooseNoteImage').onclick=()=>noteImagesInput.click();
noteCameraInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
noteImagesInput.onchange=event=>{let files=[...event.target.files];event.target.value='';if(cropSelectedImage){cropSelectedImage=false;if(files[0])openScreenCropper(files[0],'裁剪截图');return}addPendingNoteImages(files)};
noteInput.addEventListener('input',()=>queueNoteDraft());
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNoteDraftNow()});
window.addEventListener('pagehide',()=>saveNoteDraftNow());
$('#saveNote').onclick=async()=>{let text=noteInput.value.trim();if(!text&&!pendingNoteImages.length)return noteInput.focus();let now=new Date(),id=crypto.randomUUID(),stamp=now.toISOString(),imageIds=await saveNoteImages(id,pendingNoteImages,now);notes.push({id,date:day(),createdAt:stamp,updatedAt:stamp,text,images:imageIds});saveNotes();clearNoteDraft('new');noteModal.classList.add('hidden');renderNotes()};
