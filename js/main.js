// entry point — screen init handled in ui.js DOMContentLoaded listener

if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}
