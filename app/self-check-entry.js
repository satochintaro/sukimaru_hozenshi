"use strict";
(()=>{
 if(!/\/(player|grade1)\.html$/.test(location.pathname)||window.SKIMARU_SELF_CHECK_ENTRY_1695)return;
 window.SKIMARU_SELF_CHECK_ENTRY_1695=true;
 const base=new URL('./',document.currentScript.src),target=new URL('self-check.html',base);
 const obsolete=new Set(['academic-2026.html','practical-2026.html','self-check.html'].map(p=>new URL(p,base).pathname));
 function mount(){
  const host=document.querySelector('#sc-home .pad');if(!host)return;
  for(const card of host.querySelectorAll('[data-exam-entry="2026"]'))card.remove();
  let entry=host.querySelector('[data-self-check-only]');
  if(!entry){
   entry=document.createElement('a');entry.setAttribute('data-self-check-only','');entry.setAttribute('data-self-check-entry','');entry.href=target.href;entry.textContent='2026年度 本試験の自己採点 →';
   // Ordinary link: screen-wide section rules must never apply to this entry.
   entry.style.cssText='display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;flex:0 0 auto;align-self:stretch;width:100%;height:auto;min-height:48px;max-height:80px;margin:0;padding:12px 14px;border:1px solid #c6cfbf;border-radius:12px;background:#fffdf7;color:#174b3e;font-size:15px;font-weight:700;line-height:1.5;text-decoration:none;order:5';
   host.insertBefore(entry,host.querySelector(':scope > .learning-footer'));
  }
  for(const a of host.querySelectorAll('a[href]')){if(a===entry)continue;try{if(obsolete.has(new URL(a.href,base).pathname))a.remove();}catch{}}
 }
 function start(){mount();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.getElementById('main')||document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
