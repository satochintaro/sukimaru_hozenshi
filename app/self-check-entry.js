"use strict";
(()=>{
 const base=new URL('./',document.currentScript.src);
 function mount(){const host=document.querySelector('.title-shell,#sc-home .pad,#settings-switches')||document.querySelector('main');if(!host||document.querySelector('[data-self-check-entry]'))return;const a=document.createElement('a');a.dataset.selfCheckEntry='';a.href=new URL('self-check.html',base).href;a.textContent='2026年度 本試験の自己採点 →';a.style.cssText='display:block;margin:16px 0;padding:18px;border:1px solid #b59a58;border-radius:14px;background:#fffaf0;color:#174b3e;text-align:center;font-weight:700;text-decoration:none';host.prepend(a);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
