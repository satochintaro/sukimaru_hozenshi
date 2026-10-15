"use strict";
(() => {
 const appBase=new URL('./',document.currentScript.src);
 const read=(key,f={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||f;}catch{return f;}};
 const set=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
 const icons=window.SKIMARU_ICONS,menu=document.getElementById('game-menu-dialog'),settings=document.getElementById('title-settings-dialog'),manager=document.getElementById('manager-choice-dialog');
 let opener=null,leaving=false;
 document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icons.svg(el.dataset.icon));
 function view(){
  const grades=location.hash==='#grades';document.body.dataset.titleView=grades?'grades':'title';
  document.getElementById('game-title-view').hidden=grades;document.getElementById('grade-view').hidden=!grades;
  const p=read('skimaruData'),r=read('skimaru-registration-v13');
  document.getElementById('grade-registration-note').textContent=p.name&&r.playerNo===p.playerNo&&(r.confirmed||r.legacy)?p.site+' ／ '+p.name+' さんの記録を引き継ぎます。':'初めての方は、級を選んだあとに拠点と名前を登録します。';
  window.scrollTo(0,0);if(grades)document.querySelector('.grade-content h2').focus({preventScroll:true});
 }
 function applyMotion(){document.body.classList.toggle('reduced-motion',read('skimaru-title-preferences-v1634').reducedMotion===true);}
 function open(d){opener=document.activeElement;for(const other of [menu,settings,manager])if(other!==d&&other.open)other.close();d.showModal();}
 function close(d){if(d.open)d.close();}
 for(const d of [menu,settings,manager]){d.addEventListener('close',()=>opener?.isConnected&&opener.focus({preventScroll:true}));d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(d);});}
 function choose(){try{localStorage.setItem('skimaru-role','player');}catch{}if(location.hash!=='#grades')history.pushState({titleView:'grades'},'',location.pathname+location.search+'#grades');view();}
 // Keep keyboard focus available, but avoid Safari's programmatic focus ring after a tap.
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard-navigation');});
 document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-navigation'),{passive:true});
 document.addEventListener('touchstart',()=>document.body.classList.remove('keyboard-navigation'),{passive:true});
 const titleSurface=document.getElementById('game-title-view');
 titleSurface.addEventListener('click',e=>{
  if(titleSurface.hidden||e.target.closest('#title-menu-open'))return;
  choose();
 });
 document.getElementById('grade-back').onclick=()=>{history.pushState({titleView:'title'},'',location.pathname+location.search);view();document.getElementById('title-start').focus({preventScroll:true});};
 document.getElementById('title-menu-open').onclick=()=>open(menu);document.getElementById('grade-menu').onclick=()=>open(menu);
 document.getElementById('grade-manager').onclick=()=>open(manager);
 document.querySelector('[data-close-menu]').onclick=()=>close(menu);document.querySelector('[data-close-settings]').onclick=()=>close(settings);document.querySelector('[data-close-manager]').onclick=()=>close(manager);
 function settingsView(){const p=read('skimaruData');document.getElementById('title-profile-summary').textContent=p.name?p.site+' ／ '+p.name+' ／ '+(p.playerNo||''):'まだ登録されていません。級を選んで登録できます。';const grade=read('skimaru-last-grade-v1634',2);document.getElementById('title-profile-settings').href=new URL(grade===1?'grade1.html#settings':'player.html#settings',appBase).href;document.getElementById('title-reduce-motion').checked=read('skimaru-title-preferences-v1634').reducedMotion===true;open(settings);}
 document.getElementById('title-reduce-motion').onchange=e=>{set('skimaru-title-preferences-v1634',{...read('skimaru-title-preferences-v1634'),reducedMotion:e.target.checked});applyMotion();};
 document.getElementById('title-recovery-code').onclick=()=>{close(settings);const r=read('skimaru-registration-v13');if(!r.playerNo||!r.token){window.SKIMARU_ROLLOUT?.guide('player');return;}window.SKIMARU_BACKUP?.showCode();};
 document.querySelectorAll('[data-title-action]').forEach(b=>b.onclick=()=>{const action=b.dataset.titleAction;close(menu);if(action!=='settings')close(settings);if(action==='manager')open(manager);if(action==='settings')settingsView();if(action==='install')window.SKIMARU_ROLLOUT?.install();if(action==='guide')window.SKIMARU_ROLLOUT?.guide('player');if(action==='restore')window.SKIMARU_BACKUP?.restore();if(action==='mail')window.SKIMARU_SUPPORT?.mailbox();if(action==='report')window.SKIMARU_SUPPORT?.report();if(action==='reports')window.SKIMARU_SUPPORT?.reports();});
 function navigate(a){if(leaving)return;leaving=true;if(window.SKIMARU_PAGE_LOADING){window.SKIMARU_PAGE_LOADING.navigate(a.href);return;}document.getElementById('title-loading').hidden=false;requestAnimationFrame(()=>location.assign(a.href));}
 document.querySelectorAll('[data-learning-link]').forEach(a=>a.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();set('skimaru-last-grade-v1634',Number(a.dataset.grade));try{localStorage.setItem('skimaru-role','player');}catch{}navigate(a);}));
 document.querySelectorAll('[data-manager-link]').forEach(a=>a.onclick=()=>{try{localStorage.setItem('skimaru-role','manager');}catch{}});
 window.addEventListener('popstate',view);window.addEventListener('hashchange',view);
 window.addEventListener('pageshow',()=>{leaving=false;document.getElementById('title-loading').hidden=true;view();applyMotion();});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js?v=16.54',{updateViaCache:'none'}).then(reg=>reg.update().catch(()=>{})).catch(()=>{});
 view();applyMotion();const recovery=document.getElementById('startup-recovery');if(recovery)recovery.hidden=true;
 window.SKIMARU_TITLE_READY=true;
})();
