const noteModal=$('#noteModal'),noteInput=$('#noteInput'),noteImagesInput=$('#noteImages'),noteCameraInput=$('#noteCamera'),notePreview=$('#noteImagePreview');
let pendingNoteImages=[];
const noteTemplates={
  '问题':'【问题】\n现象：\n我猜：\n下一步：',
  '实验 / 数据':'【实验 / 数据】\n做了什么：\n结果：\n可能原因：\n下一步：',
  '文献':'【文献】\n论文 / 概念：\n关键观点：\n和我课题的关系：\n要核实：',
  '灵感':'【灵感】\n想到：\n为什么可能有用：\n最小验证：',
  '沟通':'【沟通】\n和谁讨论：\n对方建议：\n我准备采取的动作：',
  '待办':'【待办】\n要做什么：\n为什么现在要做：\n最小下一步：\n截止时间：',
  '决策':'【决策】\n要做的选择：\n考虑因素：\n当前决定：\n之后验证：'
};
const noteExamples={
  '问题':'【问题】\n现象：参数变化后结果不稳定。\n我猜：可能与随机初始化有关。\n下一步：固定随机种子后重复运行。',
  '实验 / 数据':'【实验 / 数据】\n做了什么：将参数 α 从 0.1 调到 0.2。\n结果：误差下降，但波动变大。\n可能原因：训练数据量不足。\n下一步：重复运行 10 次并比较。',
  '文献':'【文献】\n论文 / 概念：某篇关于反演方法的论文。\n关键观点：先验约束能提高稳定性。\n和我课题的关系：可用于当前参数识别。\n要核实：样本量变化是否影响结论。',
  '灵感':'【灵感】\n想到：把误差按频段分别评价。\n为什么可能有用：可定位问题主要来源。\n最小验证：先用已有两组数据画图比较。',
  '沟通':'【沟通】\n和谁讨论：与导师讨论阶段性结果。\n对方建议：先验证基础假设。\n我准备采取的动作：整理假设与验证清单。',
  '待办':'【待办】\n要做什么：核对数据预处理流程。\n为什么现在要做：下次实验前需排除该变量。\n最小下一步：今晚列出检查项。\n截止时间：周五前。',
  '决策':'【决策】\n要做的选择：先扩充数据还是先调模型。\n考虑因素：当前误差主要来自样本不足。\n当前决定：先扩充数据。\n之后验证：比较扩充前后的稳定性。'
};
let selectedNoteTemplate='';
function renderNoteTemplates(){let holder=$('#noteTemplates'),example=$('#noteTemplateExample');if(!holder||!example)return;holder.innerHTML=Object.keys(noteTemplates).map(name=>`<button class="${selectedNoteTemplate===name?'selected':''}" data-template="${name}" type="button">${name}</button>`).join('');example.innerHTML=selectedNoteTemplate?`<p>示例</p><pre>${esc(noteExamples[selectedNoteTemplate])}</pre><button id="applyNoteTemplate" type="button">使用此模板开始记录</button>`:'';$$('#noteTemplates button').forEach(button=>button.onclick=()=>{selectedNoteTemplate=button.dataset.template;renderNoteTemplates()});let apply=$('#applyNoteTemplate');if(apply)apply.onclick=()=>{if(noteInput.value.trim()&&!confirm('使用模板会覆盖当前内容，继续吗？'))return;noteInput.value=noteTemplates[selectedNoteTemplate];selectedNoteTemplate='';renderNoteTemplates();noteInput.focus()}}
function resetNoteTemplate(){selectedNoteTemplate='';renderNoteTemplates()}
function ensureNoteTemplates(){if($('#noteTemplates'))return;let holder=document.createElement('div');holder.id='noteTemplates';holder.className='note-templates';let example=document.createElement('div');example.id='noteTemplateExample';example.className='note-template-example';let hint=document.createElement('p');hint.className='note-template-hint';hint.textContent='选择一个分类模板；每条随手记只记录一个可追溯的研究线索。';noteInput.before(hint);noteInput.before(example);noteInput.before(holder);renderNoteTemplates()}
ensureNoteTemplates();
function renderPendingNoteImages(){notePreview.innerHTML=pendingNoteImages.map((file,index)=>`<div><img src="${URL.createObjectURL(file)}" alt="待上传图片 ${index+1}"><button data-index="${index}" aria-label="移除图片">×</button></div>`).join('');$$('#noteImagePreview button').forEach(button=>button.onclick=()=>{pendingNoteImages.splice(+button.dataset.index,1);renderPendingNoteImages()})}
function addPendingNoteImages(files){pendingNoteImages.push(...[...files].filter(file=>file.type.startsWith('image/')));renderPendingNoteImages()}
$('#quickNote').onclick=()=>{noteInput.value='';pendingNoteImages=[];resetNoteTemplate();renderPendingNoteImages();noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#takeNotePhoto').onclick=()=>noteCameraInput.click();
$('#chooseNoteImage').onclick=()=>noteImagesInput.click();
noteCameraInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
noteImagesInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
$('#saveNote').onclick=async()=>{let text=noteInput.value.trim();if(!text&&!pendingNoteImages.length)return noteInput.focus();let now=new Date(),id=crypto.randomUUID(),imageIds=await saveNoteImages(id,pendingNoteImages,now);notes.push({id,date:day(),createdAt:now.toISOString(),text,images:imageIds});saveNotes();noteModal.classList.add('hidden');renderNotes()};
