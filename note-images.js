const imageDb=()=>new Promise((resolve,reject)=>{let request=indexedDB.open('phd-daily-images',1);request.onupgradeneeded=()=>request.result.createObjectStore('images',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
const imageRequest=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
const imageExtension=file=>file.name?.split('.').pop()?.toLowerCase()||file.type?.split('/').pop()?.replace('jpeg','jpg')||'jpg';
const imageStamp=date=>{let d=new Date(date),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`};
async function compressImageForStorage(file){
  const target=300*1024,maxSide=1600;
  if(!file?.type?.startsWith('image/')||file.size<=target||file.type==='image/gif'||!globalThis.createImageBitmap)return {file,keptOriginal:true};
  try{
    let bitmap=await createImageBitmap(file),scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale)),canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;let context=canvas.getContext('2d');context.drawImage(bitmap,0,0,width,height);bitmap.close?.();
    let quality=.88,best;while(quality>=.5){let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(!blob)break;best=blob;if(blob.size<=target)break;quality-=.08}
    return best&&best.size<file.size?{file:new File([best],`${file.name?.replace(/\.[^.]+$/,'')||'image'}.jpg`,{type:'image/jpeg'}),keptOriginal:false}:{file,keptOriginal:true};
  }catch{return {file,keptOriginal:true}}
}
function notifyOriginalImages(count){if(count)alert(`为保证图片清晰，${count} 张图片未压缩，已保留原图。`)}
async function saveNoteImages(noteId,files,createdAt=new Date()){let db=await imageDb(),ids=[],originals=0,stamp=imageStamp(createdAt);for(let [index,source] of [...files].entries()){let result=await compressImageForStorage(source),file=result.file;if(result.keptOriginal)originals++;let id=crypto.randomUUID(),suffix=files.length>1?`_${index+1}`:'',name=`随手记${stamp}${suffix}.${imageExtension(file)}`;await imageRequest(db.transaction('images','readwrite').objectStore('images').put({id,noteId,name,type:file.type||'image/jpeg',blob:file}));ids.push(id)}notifyOriginalImages(originals);return ids}
async function getNoteImages(noteId){let db=await imageDb(),all=await imageRequest(db.transaction('images').objectStore('images').getAll());return all.filter(image=>image.noteId===noteId)}
async function allNoteImages(){let db=await imageDb();return imageRequest(db.transaction('images').objectStore('images').getAll())}
async function deleteNoteImages(noteIds){if(!noteIds?.length)return;let db=await imageDb(),all=await imageRequest(db.transaction('images').objectStore('images').getAll());for(let image of all.filter(image=>noteIds.includes(image.noteId)))await imageRequest(db.transaction('images','readwrite').objectStore('images').delete(image.id))}
async function deleteNoteImage(imageId){if(!imageId)return;let db=await imageDb();await imageRequest(db.transaction('images','readwrite').objectStore('images').delete(imageId))}
async function clearNoteImages(){let db=await imageDb();await imageRequest(db.transaction('images','readwrite').objectStore('images').clear())}
async function restoreNoteImages(images){let db=await imageDb();for(let image of images)await imageRequest(db.transaction('images','readwrite').objectStore('images').put(image))}
async function saveDiaryImages(diaryId,files,createdAt=new Date()){let db=await imageDb(),ids=[],originals=0,stamp=imageStamp(createdAt);for(let [index,source] of [...files].entries()){let result=await compressImageForStorage(source),file=result.file;if(result.keptOriginal)originals++;let id=crypto.randomUUID(),suffix=files.length>1?`_${index+1}`:'',name=`日记${stamp}${suffix}.${imageExtension(file)}`;await imageRequest(db.transaction('images','readwrite').objectStore('images').put({id,noteId:diaryId,name,type:file.type||'image/jpeg',blob:file}));ids.push(id)}notifyOriginalImages(originals);return ids}
async function getDiaryImages(diaryId){return getNoteImages(diaryId)}
async function deleteDiaryImages(diaryIds){return deleteNoteImages(diaryIds)}
