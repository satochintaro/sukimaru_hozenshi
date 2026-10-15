'use strict';
(()=>{
 let identity='',mail=0,reports=0,known=false,lastOS=null,queued=false,osChain=Promise.resolve();
 function paintOne(el,count){
  if(!el)return;let badge=el.querySelector(':scope > .support-unread-badge');
  if(!el.dataset.unreadBaseLabel)el.dataset.unreadBaseLabel=el.getAttribute('aria-label')||el.textContent.trim().replace(/（\d+）$/,'');
  const label=el.dataset.unreadBaseLabel+(count?'、未読'+count+'件':'');if(el.getAttribute('aria-label')!==label)el.setAttribute('aria-label',label);
  if(!count){badge?.remove();return;}
  if(!badge){if(getComputedStyle(el).position==='static')el.style.position='relative';badge=document.createElement('span');badge.className='support-unread-badge';badge.setAttribute('aria-hidden','true');el.append(badge);}
  const value=count>99?'99+':String(count);if(badge.textContent!==value)badge.textContent=value;
 }
 function paint(){
  for(const el of document.querySelectorAll('.support-launchers [data-mail],[data-title-action="mail"]'))paintOne(el,mail);
  for(const el of document.querySelectorAll('.support-launchers [data-reports],[data-title-action="reports"]'))paintOne(el,reports);
  for(const el of document.querySelectorAll('#title-menu-open,#grade-menu,[data-shared-menu-open],#settings,#sc-home .hd-ico,.practical-hd .member-gear,.learning-contact > summary,[data-workspace="contact"]'))paintOne(el,mail+reports);
 }
 function queuePaint(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paint();});}
 function osBadge(){
  const total=mail+reports;if(!known||lastOS===total||typeof navigator.setAppBadge!=='function')return;
  lastOS=total;
  // Serialize OS writes: an old request must never finish after a later clear.
  osChain=osChain.then(async()=>{try{if(total===0&&typeof navigator.clearAppBadge==='function')await navigator.clearAppBadge();else await navigator.setAppBadge(total);}catch{lastOS=null;}});
 }
 function setIdentity(key){if(identity===key)return;identity=key;mail=0;reports=0;known=true;lastOS=null;try{const cached=JSON.parse(localStorage.getItem('skimaru-unread-state-v1654')||'null');if(cached?.key===key){mail=Math.min(9999,Math.max(0,Number(cached.mail)||0));reports=Math.min(9999,Math.max(0,Number(cached.reports)||0));}}catch{}paint();osBadge();}
 function update(key,m,r){if(key!==identity)return;mail=Math.max(0,Math.floor(Number(m)||0));reports=Math.max(0,Math.floor(Number(r)||0));known=true;try{localStorage.setItem('skimaru-unread-state-v1654',JSON.stringify({key,mail,reports}));}catch{}paint();osBadge();}
 function settings(){
  document.querySelector('.badge-settings-dialog')?.remove();const d=document.createElement('dialog');d.className='support-dialog badge-settings-dialog';d.innerHTML='<header><h2>ホーム画面の通知バッジ</h2><button type="button" class="contact-close" data-close aria-label="閉じる">×</button></header><p>メッセージや不具合の連絡が未読のとき、アイコンに件数を表示します。アプリ内の赤いバッジは通知の許可なしで使えます。</p><p>アプリを開いたとき・開いている間に更新します。アプリを閉じている間の新着通知は、今回の機能には含まれません。</p><p data-info role="status"></p><button type="button" class="support-primary" data-enable>通知バッジを許可する</button>';
  const info=d.querySelector('[data-info]'),b=d.querySelector('[data-enable]');
  function status(){
   if(typeof navigator.setAppBadge!=='function'){info.textContent='この端末・ブラウザでは、ホーム画面の件数バッジに対応していません。アプリ内の赤いバッジで確認できます。iPhoneではホーム画面に追加したアイコンから開いてください。';b.hidden=true;return;}
   if(typeof Notification==='undefined'){info.textContent='ホーム画面の表示は端末の設定に従います。アプリ内の未読件数はそのまま使えます。';b.hidden=true;return;}
   if(Notification.permission==='granted'){info.textContent='通知は許可されています。バッジが表示されない場合は、端末の通知設定でこのアプリの「バッジ」を有効にしてください。';b.hidden=true;}
   else if(Notification.permission==='denied'){info.textContent='通知が許可されていません。端末の通知設定からこのアプリを選び、通知とバッジを有効にしてください。';b.hidden=true;}
   else{info.textContent='許可の確認画面が出たら「許可」を選んでください。';b.hidden=false;}
  }
  b.onclick=async()=>{b.disabled=true;try{await Notification.requestPermission();status();lastOS=null;osBadge();}catch{info.textContent='許可できませんでした。ホーム画面のアプリアイコンから開いてお試しください。';}finally{b.disabled=false;}};
  d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());document.body.append(d);status();d.showModal();
 }
 function mountSettings(){
  for(const host of document.querySelectorAll('.support-launchers,#game-menu-dialog .game-menu-grid'))if(!host.hasAttribute('data-shared-menu-grid')&&!host.querySelector('[data-badge-settings]')){const b=document.createElement('button');b.type='button';b.dataset.badgeSettings='';window.SKIMARU_CONTACT_UI?.button(b,'通知設定','settings');b.onclick=()=>{document.getElementById('game-menu-dialog')?.close();settings();};host.append(b);}
 }

 function init(){mountSettings();paint();new MutationObserver(()=>{mountSettings();queuePaint();}).observe(document.body,{childList:true,subtree:true});}
 window.SKIMARU_BADGES={setIdentity,update,settings,status:()=>({mail,reports,total:mail+reports,known})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
