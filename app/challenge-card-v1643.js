"use strict";
(() => {
 if(window.SKIMARU_LIMIT_CARD)return;
 const base=new URL('./',document.currentScript.src);
 const chain=()=>'<svg class="sd-chains" viewBox="0 0 360 88" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#abb0ae" stroke-width="2.3">'+[1,-1].map(sign=>'<g transform="translate(180 44) rotate('+(sign*12)+')">'+Array.from({length:25},(_,i)=>'<ellipse cx="'+((i-12)*16)+'" cy="0" rx="12" ry="4"/>').join('')+'</g>').join('')+'</g></svg>';
 function html(grade,unlocked,active,best){
  const title='<span class="sd-card-copy"><strong>限界チャレンジ</strong><small>'+(unlocked?(active?'途中から再開':'自己ベスト '+(Number(best)||0)+'問'):'超越者で解放')+'</small></span>';
  return unlocked?'<a class="sd-home-entry" data-sd-grade="'+grade+'" data-usage-action="sd_open" href="'+new URL('sudden-death.html?grade='+grade,base).href+'">'+title+'<span class="sd-card-arrow" aria-hidden="true">→</span></a>':'<button type="button" class="sd-home-entry sd-locked" data-sd-grade="'+grade+'" aria-disabled="true" aria-label="限界チャレンジ、超越者で解放">'+title+chain()+'<span class="sd-home-lock" aria-hidden="true">'+window.SKIMARU_LIMIT_UNLOCK.lockIcon+'</span></button>';
 }
 let hold=null,suppress=null,suppressUntil=0;
 function cancel(){if(!hold)return;clearTimeout(hold.timer);cancelAnimationFrame(hold.raf);hold.card.classList.remove('sd-holding');hold.card.style.removeProperty('--sd-hold');hold=null;}
 function begin(card,event){
  cancel();if(document.querySelector('dialog[open],.member-gate,.rollout-overlay')||!window.SKIMARU_MEMBER?.valid())return;
  const h={card,id:event.pointerId,x:event.clientX,y:event.clientY,started:performance.now()};hold=h;card.classList.add('sd-holding');
  const tick=()=>{if(hold!==h)return;if(!card.isConnected||document.hidden){cancel();return;}card.style.setProperty('--sd-hold',Math.min(1,(performance.now()-h.started)/5000));h.raf=requestAnimationFrame(tick);};h.raf=requestAnimationFrame(tick);
  h.timer=setTimeout(()=>{
   if(hold!==h||!card.isConnected||document.hidden||!window.SKIMARU_MEMBER?.valid()){cancel();return;}
   const grade=card.dataset.sdGrade;suppress=card;suppressUntil=performance.now()+1500;cancel();location.assign(new URL('sudden-death.html?grade='+grade+'&mode=demo&start=1',base).href);
  },5000);
 }
 document.addEventListener('pointerdown',e=>{const card=e.target.closest('.sd-home-entry[data-sd-grade]');if(!card||e.button!==0||!e.isPrimary)return;begin(card,e);});
 document.addEventListener('pointermove',e=>{if(hold&&e.pointerId===hold.id&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>12)cancel();},{passive:true});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,e=>{if(hold&&e.pointerId===hold.id)cancel();});
 document.addEventListener('keydown',e=>{const card=e.target.closest('.sd-home-entry[data-sd-grade]');if(card&&[' ','Enter'].includes(e.key)){if(e.key==='Enter'&&!card.classList.contains('sd-locked'))return;e.preventDefault();if(!e.repeat)begin(card,e);}});
 document.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key))cancel();});
 document.addEventListener('contextmenu',e=>{if(e.target.closest('.sd-home-entry[data-sd-grade]'))e.preventDefault();});
 document.addEventListener('click',e=>{const card=e.target.closest('.sd-home-entry[data-sd-grade]');if(card&&(card.classList.contains('sd-locked')||card===suppress&&performance.now()<suppressUntil)){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('scroll',cancel,{passive:true,capture:true});
 window.addEventListener('pagehide',cancel);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
 window.SKIMARU_LIMIT_CARD={html};
})();
