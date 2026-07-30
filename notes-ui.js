const noteModal=$('#noteModal'),noteInput=$('#noteInput');
$('#quickNote').onclick=()=>{noteInput.value='';noteModal.classList.remove('hidden');setTimeout(()=>noteInput.focus(),50)};
$('#closeNote').onclick=()=>noteModal.classList.add('hidden');
noteModal.onclick=e=>{if(e.target===noteModal)noteModal.classList.add('hidden')};
$('#saveNote').onclick=()=>{let text=noteInput.value.trim();if(!text)return noteInput.focus();let now=new Date();notes.push({id:crypto.randomUUID(),date:day(),createdAt:now.toISOString(),text});saveNotes();noteModal.classList.add('hidden');renderNotes()};
