function confirmFourDigitDelete(kind){
  return new Promise(resolve=>{
    const digits=new Uint32Array(1);
    crypto.getRandomValues(digits);
    const code=String(digits[0]%10000).padStart(4,'0');
    const overlay=document.createElement('div');
    overlay.className='delete-code-overlay';
    overlay.innerHTML=`<div class="delete-code-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteCodeTitle"><h2 id="deleteCodeTitle">删除${kind}？</h2><p>删除后无法撤销。请输入下面的四位数字以确认：</p><strong class="delete-code-value">${code}</strong><input class="delete-code-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="输入四位确认数字" placeholder="输入四位数字"><p class="delete-code-error" role="alert" aria-live="polite"></p><div class="delete-code-actions"><button type="button" class="delete-code-cancel">取消</button><button type="button" class="delete-code-submit">确认删除</button></div></div>`;
    document.body.append(overlay);
    const input=overlay.querySelector('.delete-code-input'),error=overlay.querySelector('.delete-code-error');
    const finish=confirmed=>{overlay.remove();document.removeEventListener('keydown',onKey);resolve(confirmed)};
    const check=()=>{if(input.value===code)return finish(true);error.textContent='数字不一致，请重新输入。';input.value='';input.focus()};
    const onKey=event=>{if(event.key==='Escape')finish(false);else if(event.key==='Enter'&&document.activeElement===input)check()};
    overlay.querySelector('.delete-code-cancel').onclick=()=>finish(false);
    overlay.querySelector('.delete-code-submit').onclick=check;
    overlay.onclick=event=>{if(event.target===overlay)finish(false)};
    input.oninput=()=>{input.value=input.value.replace(/\D/g,'').slice(0,4);error.textContent=''};
    document.addEventListener('keydown',onKey);
    input.focus();
  });
}
