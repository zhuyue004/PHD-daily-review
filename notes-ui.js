const noteModal=$('#noteModal'),noteInput=$('#noteInput'),noteImagesInput=$('#noteImages'),noteCameraInput=$('#noteCamera'),notePreview=$('#noteImagePreview');
let pendingNoteImages=[];
function renderPendingNoteImages(){notePreview.innerHTML=pendingNoteImages.map((file,index)=>`<div><img src="${URL.createObjectURL(file)}" alt="待上传图片 ${index+1}"><button data-index="${index}" aria-label="移除图片">×</button></div>`).join('');$$('#noteImagePreview button').forEach(button=>button.onclick=()=>{pendingNoteImages.splice(+button.dataset.index,1);renderPendingNoteImages()})}
function addPendingNoteImages(files){pendingNoteImages.push(...[...files].filter(file=>file.type.startsWith('image/')));renderPendingNoteImages()}
$('#quickNote').onclick=()=>{noteInput.value='';pendingNoteImages=[];renderPendingNoteImages();noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#takeNotePhoto').onclick=()=>noteCameraInput.click();
$('#chooseNoteImage').onclick=()=>noteImagesInput.click();
noteCameraInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
noteImagesInput.onchange=event=>{addPendingNoteImages(event.target.files);event.target.value=''};
$('#saveNote').onclick=async()=>{let text=noteInput.value.trim();if(!text&&!pendingNoteImages.length)return noteInput.focus();let now=new Date(),id=crypto.randomUUID(),imageIds=await saveNoteImages(id,pendingNoteImages,now);notes.push({id,date:day(),createdAt:now.toISOString(),text,images:imageIds});saveNotes();noteModal.classList.add('hidden');renderNotes()};
