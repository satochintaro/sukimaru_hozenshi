"use strict";
(() => {
 if(window.SKIMARU_LIMIT_UNLOCK)return;
 const appBase=new URL('./',document.currentScript.src),pending=new Set(),shown=new Set();let timer=null,busy=false;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')||{};}catch{return {};}};
 const key=grade=>grade===1?'skimaru-grade1-v16':'skimaruData';
 const owner=()=>String(read('skimaruData').playerNo||'');
 const eligible=r=>Number(r.learningRank)>=3||(r.suddenDeath?.unlockRank===3&&r.suddenDeath?.unlocked===true);
 const lockIcon='<svg viewBox="0 0 64 72" aria-hidden="true"><path class="sd-unlock-shackle" d="M18 32V20a14 14 0 0 1 28 0v12" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><rect x="8" y="30" width="48" height="36" rx="10" fill="currentColor"/><circle cx="32" cy="44" r="5" fill="#fff9e9"/><path d="M32 48v8" stroke="#fff9e9" stroke-width="5" stroke-linecap="round"/></svg>';
 function observe(record,grade,persist){
  if(Number(record.learningRank)>=3){
   const latest=read(key(grade));if(Number(latest.suddenDeath?.revision||0)>Number(record.suddenDeath?.revision||0))record.suddenDeath=latest.suddenDeath;
   const l=record.suddenDeath?.schema===1?record.suddenDeath:{schema:1,best:0,totalAnswers:0,correctAnswers:0,history:[],reviewIds:[],unlocked:false,current:null};
   if(l.unlockRank!==3||l.unlocked!==true){l.unlockRank=3;l.unlocked=true;l.unlockNoticePending=true;l.unlockNoticeShown=false;l.revision=(Number(l.revision)||0)+1;l.updatedAt=new Date().toISOString();record.suddenDeath=l;try{persist();}catch{}}
  }
  if(read(key(grade)).suddenDeath?.unlockNoticePending===true){pending.add(grade);schedule();}
  return eligible(record);
 }
 function ready(grade){if(document.hidden||document.querySelector('dialog[open],.member-gate,.rollout-overlay,.cloud-dialog,.support-overlay'))return false;const onGrade=document.body.classList.contains('grade1-app')?1:2;if(onGrade!==grade)return false;return !!document.querySelector('#sc-home.active,#main #sc-home,#pt-home.active,#main > .pad.years,#sd-entry');}
 function schedule(){if(timer||busy||!pending.size)return;timer=setTimeout(()=>{timer=null;flush();},120);}
 async function flush(){if(busy)return;const grade=[...pending].find(ready);if(!grade)return;busy=true;const currentOwner=owner();
  const show=()=>{if(!ready(grade)||owner()!==currentOwner)return;if(shown.has(currentOwner+':'+grade)){pending.delete(grade);return;}const r=read(key(grade)),l=r.suddenDeath;if(!eligible(r)||l?.unlockNoticePending!==true||l.unlockNoticeShown===true){pending.delete(grade);return;}
   const d=document.createElement('dialog');d.id='sd-unlock-dialog';d.className='sd-unlock-dialog';d.setAttribute('aria-labelledby','sd-unlock-title');d.innerHTML='<div class="sd-unlock-art">'+lockIcon+'<i>✦</i><i>✧</i></div><p class="sd-unlock-rank">超越者に到達！</p><h2 id="sd-unlock-title">サドンデスモードが<br>解放されました</h2><p class="sd-unlock-name">限界チャレンジ</p><a class="sd-primary" data-usage-action="sd_unlocked_start">挑戦する →</a><button type="button" class="sd-secondary" data-usage-action="sd_unlock_later">あとで</button>';
   d.querySelector('a').href=new URL('sudden-death.html?grade='+grade,appBase).href;const opener=document.activeElement;d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();opener?.isConnected&&opener.focus({preventScroll:true});schedule();});
   document.body.append(d);try{d.showModal();}catch{d.remove();return;}
   // Mark only after the dialog is displayed; retries remain possible if persistence fails.
   l.unlockNoticePending=false;l.unlockNoticeShown=true;l.revision=(Number(l.revision)||0)+1;l.updatedAt=new Date().toISOString();
   shown.add(currentOwner+':'+grade);pending.delete(grade);try{localStorage.setItem(key(grade),JSON.stringify(r));pending.delete(grade);}catch{/* Do not discard the pending notice or learning data. */}
   if(read('skimaru-title-preferences-v1634').reducedMotion===true)d.classList.add('sd-reduced');requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('revealing')));
  };
  try{if(navigator.locks)await navigator.locks.request('skimaru-unlock:'+grade+':'+currentOwner,show);else show();}catch{/* A hidden/deactivated document retries on returning home. */}finally{busy=false;}
 }
 let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;schedule();});}}).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',schedule);document.addEventListener('close',schedule,true);window.addEventListener('pageshow',schedule);window.addEventListener('storage',e=>{if(e.key==='skimaruData'||e.key==='skimaru-grade1-v16'){for(const grade of [1,2])if(read(key(grade)).suddenDeath?.unlockNoticePending)pending.add(grade);schedule();}});
 window.SKIMARU_LIMIT_UNLOCK={observe,eligible,lockIcon};
})();
