'use strict';
(()=>{
 const paths={mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',report:'<path d="m14 4-4 4 1 4 4 1 4-4c1 4-2 8-6 8L7 22l-4-4 6-6C8 8 10 4 14 4z"/>',reports:'<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',settings:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',back:'<path d="m15 5-7 7 7 7"/>',refresh:'<path d="M20 8a8 8 0 1 0 0 8M20 8V3m0 5h-5"/>'};
 const svg=key=>'<svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[key]||paths.mail)+'</svg>';
 function button(el,label,key){if(!el)return;const stamp=key+':'+label;if(el.dataset.contactStamp===stamp)return;const badge=el.querySelector(':scope>.support-unread-badge');el.classList.add('contact-action');el.dataset.contactStamp=stamp;el.dataset.unreadBaseLabel=label;el.setAttribute('aria-label',label);el.innerHTML=svg(key)+'<span class="contact-label"></span>';el.querySelector('.contact-label').textContent=label;if(badge)el.append(badge);}
 function decorate(){
  const heading=document.getElementById("game-menu-heading");if(heading&&!heading.dataset.currentHeading){heading.textContent="メニュー";heading.dataset.currentHeading="true";}
  document.querySelectorAll('[data-title-action="mail"]').forEach(el=>button(el,'お知らせ','mail'));
  document.querySelectorAll('[data-title-action="report"]').forEach(el=>button(el,'不具合を報告','report'));
  document.querySelectorAll('[data-title-action="reports"]').forEach(el=>button(el,'対応状況','reports'));
  document.querySelectorAll('[data-badge-settings]').forEach(el=>button(el,'通知設定','settings'));
  document.querySelectorAll('.learning-contact>summary').forEach(el=>{if(el.dataset.commonContact)return;const badge=el.querySelector(':scope>.support-unread-badge');el.innerHTML=svg('mail')+'<span>連絡</span>';el.classList.add('contact-summary');el.dataset.unreadBaseLabel='連絡';el.dataset.commonContact='true';if(badge)el.append(badge);});
  document.querySelectorAll('.support-dialog header>button').forEach(el=>{if(el.dataset.commonClose)return;el.classList.add('contact-close');el.innerHTML=svg('close');el.dataset.commonClose='true';});
  document.querySelectorAll('.manager-header .hd-back').forEach(el=>{if(el.dataset.commonBack)return;el.innerHTML=svg('back');el.dataset.commonBack='true';});
  document.querySelectorAll('.manager-refresh').forEach(el=>{if(el.dataset.commonRefresh)return;el.innerHTML=svg('refresh');el.setAttribute('aria-label','データを更新');el.dataset.commonRefresh='true';});
 }
 let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});}
 window.SKIMARU_CONTACT_UI={svg,button,decorate};
 function init(){decorate();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
