const noteModal=$('#noteModal'),noteInput=$('#noteInput'),noteImagesInput=$('#noteImages'),noteCameraInput=$('#noteCamera'),notePreview=$('#noteImagePreview');
let pendingNoteImages=[],cropSelectedImage=false;
const NOTE_DRAFTS_KEY='phd-quick-note-drafts';
let noteDraftTimer;
let noteDraftStatusTimer;
function showNoteDraftStatus(text,settled=false){let status=$('#noteDraftStatus');if(!status){status=document.createElement('p');status.id='noteDraftStatus';status.className='local-draft-status';noteInput.insertAdjacentElement('afterend',status)}clearTimeout(noteDraftStatusTimer);status.textContent=text;status.classList.toggle('settled',settled);if(settled)noteDraftStatusTimer=setTimeout(()=>{status.textContent=''},1600)}
function noteDrafts(){try{return JSON.parse(localStorage.getItem(NOTE_DRAFTS_KEY)||'{}')}catch{return {}}}
function noteDraftKey(noteId=''){return noteId?`edit:${noteId}`:'new'}
function saveNoteDraftNow(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){if(noteModal.classList.contains('hidden'))return;let drafts=noteDrafts();drafts[key]={text:noteInput.value,template:selectedNoteTemplate||'',updatedAt:new Date().toISOString()};localStorage.setItem(NOTE_DRAFTS_KEY,JSON.stringify(drafts));showNoteDraftStatus('草稿已保存到本机',true)}
function queueNoteDraft(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){clearTimeout(noteDraftTimer);showNoteDraftStatus('正在自动保存本地…');noteDraftTimer=setTimeout(()=>saveNoteDraftNow(key),350)}
function restoreNoteDraft(key='new'){let saved=noteDrafts()[key];if(!saved)return false;noteInput.value=saved.text||'';selectedNoteTemplate=saved.template||'';renderNoteTemplates();return true}
function clearNoteDraft(key=noteDraftKey(typeof archiveEditingNote==='undefined'?'':archiveEditingNote?.id)){clearTimeout(noteDraftTimer);let drafts=noteDrafts();if(!(key in drafts))return;delete drafts[key];localStorage.setItem(NOTE_DRAFTS_KEY,JSON.stringify(drafts))}
const noteTemplates={
  '小循环':'【小循环】\n问题：\n尝试：\n结果：\n不确定：\n下一步：',
  '问题':'【问题】\n现象：\n我猜：\n已有证据：\n下一步：',
  '实验 / 数据':'【实验 / 数据】\n条件 / 版本：\n做了什么：\n结果：\n可能原因：\n下一步：',
  '文献':'【文献】\n论文 / 概念：\n关键观点：\n原文位置（页码 / 图表 / 章节）：\n和我课题的关系：\n要核实：',
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
  '文献':'【文献】\n论文 / 概念：某篇关于反演方法的论文。\n关键观点：先验约束能提高稳定性。\n原文位置（页码 / 图表 / 章节）：第 6 页，图 3。\n和我课题的关系：可用于当前参数识别。\n要核实：样本量变化是否影响结论。',
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
noteInput.addEventListener('keydown',event=>{if(event.key!=='Enter'||event.isComposing)return;event.preventDefault();let start=noteInput.selectionStart,end=noteInput.selectionEnd,before=noteInput.value.slice(0,start),after=noteInput.value.slice(end),line=before.slice(before.lastIndexOf('\n')+1),leading=(line.match(/^　*/)||[''])[0],field=line.match(/^(　*)[^：:\n]+[：:]/),indent=field?'　'.repeat([...field[0]].length):leading,insert=`\n${indent}`;noteInput.value=before+insert+after;noteInput.selectionStart=noteInput.selectionEnd=start+insert.length});
function renderPendingNoteImages(){notePreview.innerHTML=pendingNoteImages.map((file,index)=>`<div><img src="${URL.createObjectURL(file)}" alt="待上传图片 ${index+1}"><button data-index="${index}" aria-label="移除图片">×</button></div>`).join('');$$('#noteImagePreview button').forEach(button=>button.onclick=()=>{pendingNoteImages.splice(+button.dataset.index,1);renderPendingNoteImages()})}
function addPendingNoteImages(files){pendingNoteImages.push(...[...files].filter(file=>file.type.startsWith('image/')));renderPendingNoteImages()}
$('#quickNote').onclick=()=>{noteInput.value='';pendingNoteImages=[];resetNoteTemplate();restoreNoteDraft();renderPendingNoteImages();noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#takeNotePhoto').onclick=()=>noteCameraInput.click();
$('#chooseNoteImage').onclick=()=>noteImagesInput.click();
noteCameraInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
noteImagesInput.onchange=event=>{let files=[...event.target.files];event.target.value='';if(cropSelectedImage){cropSelectedImage=false;if(files[0])openScreenCropper(files[0],'裁剪截图');return}addPendingNoteImages(files)};
noteInput.addEventListener('input',()=>queueNoteDraft());
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNoteDraftNow()});
window.addEventListener('pagehide',()=>saveNoteDraftNow());
$('#saveNote').onclick=async()=>{let text=noteInput.value.trim();if(!text&&!pendingNoteImages.length)return noteInput.focus();let now=new Date(),id=crypto.randomUUID(),imageIds=await saveNoteImages(id,pendingNoteImages,now);notes.push({id,date:day(),createdAt:now.toISOString(),text,images:imageIds});saveNotes();clearNoteDraft('new');noteModal.classList.add('hidden');renderNotes()};
