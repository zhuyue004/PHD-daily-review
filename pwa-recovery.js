// iPhone 主屏幕 Web App 可能保留旧的 Service Worker 控制器。
// 新控制器接管后只刷新一次，让页面与全部脚本来自同一版本，避免混用缓存而白屏。
if('serviceWorker'in navigator&&!window.phdDesktop){
  let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloaded)return;
    reloaded=true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js?v=2026102617').then(registration=>registration.update()).catch(()=>{});
}
