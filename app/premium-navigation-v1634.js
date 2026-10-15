"use strict";
(() => {
 function update(){
  const grade1=document.body.classList.contains('grade1-app'),home=document.querySelector('#sc-home.active .player-home-pad,#main #sc-home .player-home-pad,#pt-home.active .practical-pad,#main > .pad.years');
  if(!home)return;const css=document.querySelector('link[href*="premium-learning-v1634.css"]'),styles=[...document.head.querySelectorAll('link[rel="stylesheet"]')];if(css&&styles.at(-1)!==css)document.head.append(css);
  const header=grade1?document.querySelector('.grade1-header,.hd'):document.querySelector('#sc-home.active .hd,#pt-home.active .hd');
  const title=header?.querySelector('.hd-ttl');if(title&&!title.querySelector('.premium-brand-icon')){const img=document.createElement('img');img.src='./icon-v1657-192.png';img.alt='';img.className='premium-brand-icon';title.prepend(img);}
  const back=header?.querySelector('.hd-back');if(back?.tagName==='A'){back.href='../index.html#grades';back.setAttribute('aria-label','級選択へ戻る');}
  for(const button of document.querySelectorAll('#sc-home .hd-ico,.practical-hd .member-gear,#settings'))if(button.dataset.premiumGear!=='true'){button.innerHTML=window.SKIMARU_ICONS?.svg('gear')||'⚙';button.dataset.premiumGear='true';button.setAttribute('aria-label','登録・学習設定');}
 }
 let queued=false;
 new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;update();});}}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{update();if(location.hash==='#settings'&&typeof window.showSettings==='function')window.showSettings();});else update();
 window.addEventListener('hashchange',()=>{if(location.hash==='#settings'&&typeof window.showSettings==='function')window.showSettings();});
})();
