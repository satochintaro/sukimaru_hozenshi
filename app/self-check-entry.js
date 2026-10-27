"use strict";
(()=>{
 const base=new URL('./',document.currentScript.src);
 // Only the learning home screens have this entry. The title never does.
 if(!/\/(player|grade1)\.html$/.test(location.pathname))return;
 function mount(){
  const host=document.querySelector('#sc-home .pad');
  if(!host||host.querySelector('[data-self-check-entry]'))return;
  const a=document.createElement('a');a.dataset.selfCheckEntry='';
  a.href=new URL('self-check.html',base).href;
  a.textContent='2026年度 本試験の自己採点 →';
  a.style.cssText='display:block;margin:16px 0;padding:16px;border:1px solid #b59a58;border-radius:14px;background:#fffaf0;color:#174b3e;text-align:center;font-weight:700;text-decoration:none';
  host.append(a);
 }
 function start(){mount();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.getElementById('main')||document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
