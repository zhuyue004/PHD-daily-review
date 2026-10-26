// iPhone 主屏幕 Web App 可能保留旧的 Service Worker 控制器。
// 只请求更新；不可在控制器接管时强制刷新，否则 Safari 会丢失当前模块并回到首页。
if('serviceWorker'in navigator&&!window.phdDesktop){
  navigator.serviceWorker.register('sw.js?v=2026102617').then(registration=>registration.update()).catch(()=>{});
}
