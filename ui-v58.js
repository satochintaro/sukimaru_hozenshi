"use strict";
(() => {
  const VERSION="5.9.8";
  document.body.classList.add("v58");
  document.title=document.title
    .replace(/Ver\s*5\.\d+(?:\.\d+)?\s*TEST/gi,`Ver ${VERSION}`)
    .replace(/5\.\d+(?:\.\d+)?/g,VERSION)
    .replace(/\bTEST\b/gi,"");

  const mode=document.body.dataset.learningMode;
  if(mode==="academic"){
    document.querySelectorAll("#sc-home .practical-entry").forEach(el=>el.remove());
    const sub=document.querySelector("#sc-home .hd-sub");
    if(sub)sub.textContent=`自主保全士2級 / 学科 / Ver ${VERSION}`;
  }

  const managerSub=document.querySelector(".manager-header .hd-sub");
  if(managerSub){
    managerSub.textContent=document.body.classList.contains("viewer-page")
      ?`閲覧専用 / Ver ${VERSION}`
      :`全体・個人分析 / Ver ${VERSION}`;
  }

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>{
      const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,700));
      idle(async()=>{
        try{
          const reg=await navigator.serviceWorker.register("./service-worker.js?v=598",{updateViaCache:"none"});
          if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});
          reg.update().catch(()=>{});
        }catch(e){
          console.warn("PWA update check failed",e);
        }
      },{timeout:1500});
    });
  }
})();