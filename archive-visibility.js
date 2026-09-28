// The archive is for daily reviews and quick notes. Diaries remain in the diary view.
(()=>{
  const renderArchive=archive;
  archive=function(){
    renderArchive();
    const diaryHeading=Array.from(document.querySelectorAll('#records .archive-heading'))
      .find(heading=>heading.textContent.includes('· 日记'));
    if(diaryHeading){
      let following=diaryHeading.nextElementSibling;
      while(following){const next=following.nextElementSibling;following.remove();following=next}
      diaryHeading.remove();
    }
  };
  document.querySelector('#search').oninput=()=>archive();
})();
