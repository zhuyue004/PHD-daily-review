const noteModal=$('#noteModal'),noteInput=$('#noteInput'),noteImagesInput=$('#noteImages'),noteCameraInput=$('#noteCamera'),notePreview=$('#noteImagePreview');
let pendingNoteImages=[],cropSelectedImage=false;
const noteTemplates={
  '问题':'【问题】\n现象：\n我猜：\n下一步：',
  '小循环':'【小循环】\n问题：\n尝试：\n结果：\n不确定：\n下一步：',
  '实验 / 数据':'【实验 / 数据】\n做了什么：\n结果：\n可能原因：\n下一步：',
  '写论文':'【写论文】\n研究问题：\n方法：\n当前结果：\n不确定处：\n下一步：',
  '文献':'【文献】\n论文 / 概念：\n关键观点：\n和我课题的关系：\n要核实：',
  '灵感':'【灵感】\n想到：\n为什么可能有用：\n最小验证：',
  '沟通':'【沟通】\n和谁讨论：\n对方建议：\n我准备采取的动作：',
  '待办':'【待办】\n要做什么：\n为什么现在要做：\n最小下一步：\n截止时间：',
  '决策':'【决策】\n要做的选择：\n考虑因素：\n当前决定：\n之后验证：'
};
const noteExamples={
  '问题':'【问题】\n现象：参数变化后结果不稳定。\n我猜：可能与随机初始化有关。\n下一步：固定随机种子后重复运行。',
  '小循环':'【小循环】\n问题：为什么这组结果波动很大？\n尝试：固定随机种子，重复运行 3 次。\n结果：波动仍然存在，但比之前小。\n不确定：是否由训练数据量太少造成？\n下一步：把样本量从 100 增加到 300，再比较方差。',
  '实验 / 数据':'【实验 / 数据】\n做了什么：将参数 α 从 0.1 调到 0.2。\n结果：误差下降，但波动变大。\n可能原因：训练数据量不足。\n下一步：重复运行 10 次并比较。',
  '写论文':'【写论文】\n研究问题：某方法在不同参数条件下，是否能更稳定地识别 X？\n方法：固定数据集 A，改变参数 α 为 0.1、0.2、0.3，对比方法 M 和基线 B。\n当前结果：α=0.2 时 M 的误差最低；但样本量较小时波动明显增大。\n不确定处：波动来自参数、数据划分，还是随机初始化？\n下一步：固定随机种子，重复 10 次 α=0.2 的实验，记录均值和方差。',
  '文献':'【文献】\n论文 / 概念：某篇关于反演方法的论文。\n关键观点：先验约束能提高稳定性。\n和我课题的关系：可用于当前参数识别。\n要核实：样本量变化是否影响结论。',
  '灵感':'【灵感】\n想到：把误差按频段分别评价。\n为什么可能有用：可定位问题主要来源。\n最小验证：先用已有两组数据画图比较。',
  '沟通':'【沟通】\n和谁讨论：与导师讨论阶段性结果。\n对方建议：先验证基础假设。\n我准备采取的动作：整理假设与验证清单。',
  '待办':'【待办】\n要做什么：核对数据预处理流程。\n为什么现在要做：下次实验前需排除该变量。\n最小下一步：今晚列出检查项。\n截止时间：周五前。',
  '决策':'【决策】\n要做的选择：先扩充数据还是先调模型。\n考虑因素：当前误差主要来自样本不足。\n当前决定：先扩充数据。\n之后验证：比较扩充前后的稳定性。'
};
let selectedNoteTemplate='';
function renderNoteTemplates(){let holder=$('#noteTemplates'),example=$('#noteTemplateExample');if(!holder||!example)return;holder.innerHTML=Object.keys(noteTemplates).map(name=>`<button class="${selectedNoteTemplate===name?'selected':''}" data-template="${name}" type="button">${name}</button>`).join('');example.innerHTML=selectedNoteTemplate?`<p>示例</p><pre>${esc(noteExamples[selectedNoteTemplate])}</pre>`:'';$$('#noteTemplates button').forEach(button=>button.onclick=()=>{let name=button.dataset.template,onlyTag=/^【[^】]+】\s*$/.test(noteInput.value);if(noteInput.value.trim()&&!onlyTag&&!confirm('切换分类会覆盖当前内容，继续吗？'))return;selectedNoteTemplate=name;noteInput.value=noteTemplates[name];renderNoteTemplates();noteInput.focus()})}
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
  let stage=$('.screen-crop-stage'),image=stage.querySelector('img'),selection=stage.querySelector('i'),start=null,crop=null;
  const point=event=>{let rect=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(rect.width,event.clientX-rect.left)),y:Math.max(0,Math.min(rect.height,event.clientY-rect.top))}};
  const draw=event=>{let end=point(event);crop={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};Object.assign(selection.style,{left:`${crop.x}px`,top:`${crop.y}px`,width:`${crop.width}px`,height:`${crop.height}px`})};
  const close=()=>{URL.revokeObjectURL(url);modal.remove()};
  stage.addEventListener('pointerdown',event=>{start=point(event);crop=null;Object.assign(selection.style,{left:`${start.x}px`,top:`${start.y}px`,width:'0px',height:'0px'});stage.setPointerCapture?.(event.pointerId)});
  stage.addEventListener('pointermove',event=>{if(start)draw(event)});
  stage.addEventListener('pointerup',event=>{if(start)draw(event);start=null});
  modal.querySelector('.plain').onclick=close;
  modal.querySelector('.confirm-crop').onclick=async()=>{
    if(!crop||crop.width<4||crop.height<4)return alert('请先拖动选择一个截取区域。');
    let rect=stage.getBoundingClientRect(),canvas=document.createElement('canvas'),scaleX=image.naturalWidth/rect.width,scaleY=image.naturalHeight/rect.height;
    canvas.width=Math.round(crop.width*scaleX);canvas.height=Math.round(crop.height*scaleY);
    canvas.getContext('2d').drawImage(image,crop.x*scaleX,crop.y*scaleY,crop.width*scaleX,crop.height*scaleY,0,0,canvas.width,canvas.height);
    let result=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(result)addPendingNoteImages([new File([result],`${fileLabel}_${imageStamp(new Date())}.png`,{type:'image/png'})]);close();
  };
}
ensureScreenCaptureButton();
noteInput.addEventListener('keydown',event=>{if(event.key!=='Enter'||event.isComposing)return;event.preventDefault();let start=noteInput.selectionStart,end=noteInput.selectionEnd,before=noteInput.value.slice(0,start),after=noteInput.value.slice(end),line=before.slice(before.lastIndexOf('\n')+1),leading=(line.match(/^　*/)||[''])[0],field=line.match(/^(　*)[^：:\n]+[：:]/),indent=field?'　'.repeat([...field[0]].length):leading,insert=`\n${indent}`;noteInput.value=before+insert+after;noteInput.selectionStart=noteInput.selectionEnd=start+insert.length});
function renderPendingNoteImages(){notePreview.innerHTML=pendingNoteImages.map((file,index)=>`<div><img src="${URL.createObjectURL(file)}" alt="待上传图片 ${index+1}"><button data-index="${index}" aria-label="移除图片">×</button></div>`).join('');$$('#noteImagePreview button').forEach(button=>button.onclick=()=>{pendingNoteImages.splice(+button.dataset.index,1);renderPendingNoteImages()})}
function addPendingNoteImages(files){pendingNoteImages.push(...[...files].filter(file=>file.type.startsWith('image/')));renderPendingNoteImages()}
$('#quickNote').onclick=()=>{noteInput.value='';pendingNoteImages=[];resetNoteTemplate();renderPendingNoteImages();noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#takeNotePhoto').onclick=()=>noteCameraInput.click();
$('#chooseNoteImage').onclick=()=>noteImagesInput.click();
noteCameraInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
noteImagesInput.onchange=event=>{let files=[...event.target.files];event.target.value='';if(cropSelectedImage){cropSelectedImage=false;if(files[0])openScreenCropper(files[0],'裁剪截图');return}addPendingNoteImages(files)};
$('#saveNote').onclick=async()=>{let text=noteInput.value.trim();if(!text&&!pendingNoteImages.length)return noteInput.focus();let now=new Date(),id=crypto.randomUUID(),imageIds=await saveNoteImages(id,pendingNoteImages,now);notes.push({id,date:day(),createdAt:now.toISOString(),text,images:imageIds});saveNotes();noteModal.classList.add('hidden');renderNotes()};
