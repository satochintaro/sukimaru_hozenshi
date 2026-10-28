"use strict";
(()=>{
 if(!/\/(player|grade1)\.html$/.test(location.pathname)||window.SKIMARU_EXAM_ENTRY_2026)return;
 window.SKIMARU_EXAM_ENTRY_2026=true;
 const base=new URL('./',document.currentScript.src),isGrade2=location.pathname.endsWith('/player.html');
 const definitions=[
  ...(isGrade2?[{file:'academic-2026.html',text:'学科の問題 →',attribute:'data-year-2026'},{file:'practical-2026.html',text:'実技の問題（選択A） →',attribute:'data-practical-year'}]:[]),
  {file:'self-check.html',text:'本試験の自己採点 →',attribute:'data-self-check-entry'}
 ];
 const paths=new Set(definitions.map(d=>new URL(d.file,base).pathname));
 function mount(){
  const host=document.querySelector('#sc-home .pad');if(!host)return;
  const cards=[...host.querySelectorAll('[data-exam-entry="2026"]')];let card=cards.shift();for(const extra of cards)extra.remove();
  if(!card){
   card=document.createElement('section');card.setAttribute('data-exam-entry','2026');card.setAttribute('aria-label','2026年度の問題と自己採点');
   card.style.cssText='display:grid;gap:8px;flex:0 0 auto;margin:14px 0;padding:14px;border:1px solid #d2c290;border-radius:16px;background:#fffaf0;color:#174b3e';
   const title=document.createElement('strong');title.textContent='2026年度 本試験';title.style.cssText='font-size:16px;line-height:1.5';card.append(title);
   for(const d of definitions){
    const a=document.createElement('a');a.setAttribute(d.attribute,'');a.href=new URL(d.file,base).href;a.textContent=d.text;
    a.style.cssText='display:block;box-sizing:border-box;margin:0;padding:12px 14px;border:1px solid #c6cfbf;border-radius:10px;background:#fffdf7;color:#174b3e;font-size:16px;font-weight:700;line-height:1.5;text-align:left;text-decoration:none';card.append(a);
   }
   const note=document.createElement('small');note.textContent='公式正解確認前の暫定解答です。';note.style.cssText='display:block;font-size:12px;line-height:1.6;color:#61766a';card.append(note);
   host.insertBefore(card,host.querySelector(':scope > .learning-footer'));
  }
  // Earlier versions created data-year2026 but looked for data-year-2026.
  // Remove every legacy copy by its destination, preserving the one card.
  for(const a of host.querySelectorAll('a[href]')){if(card.contains(a))continue;try{if(paths.has(new URL(a.href,base).pathname))a.remove();}catch{}}
 }
 function start(){
  mount();let queued=false;
  new MutationObserver(records=>{
   // Mutations made inside our completed card require no remount.
   if(queued||records.every(r=>r.target.closest?.('[data-exam-entry="2026"]')))return;
   queued=true;requestAnimationFrame(()=>{queued=false;mount();});
  }).observe(document.getElementById('main')||document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
