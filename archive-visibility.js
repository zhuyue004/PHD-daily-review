// The archive is for daily reviews and quick notes. Diaries remain in the diary view.
(()=>{
  const renderArchive=archive;
  archive=function(){
    renderArchive();
    document.querySelectorAll('#records .archive-note[data-diary-id]').forEach(card=>card.remove());
    Array.from(document.querySelectorAll('#records .archive-heading'))
      .find(heading=>heading.textContent.includes('· 日记'))?.remove();
  };
  document.querySelector('#search').oninput=()=>archive();
})();
