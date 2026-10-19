"use strict";
(() => {
 if(window.SKIMARU_LIMIT_CARD)return;
 const base=new URL('./',document.currentScript.src);
 const chain=()=>'<svg class="sd-chains" viewBox="0 0 360 88" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#abb0ae" stroke-width="2.3">'+[1,-1].map(sign=>'<g transform="translate(180 44) rotate('+(sign*12)+')">'+Array.from({length:25},(_,i)=>'<ellipse cx="'+((i-12)*16)+'" cy="0" rx="12" ry="4"/>').join('')+'</g>').join('')+'</g></svg>';
 function html(grade,unlocked,active,best){
  const title='<span class="sd-card-copy"><strong>限界チャレンジ</strong><small>'+(unlocked?(active?'途中から再開':'1000問チャレンジ · ベスト '+(Number(best)||0)+'問'):'学科200問で解放')+'</small></span>';
  const art='<img class="sd-entry-mascot" src="'+new URL('icon-v1657-512.png',base).href+'" alt="" width="112" height="112">';
  return unlocked?'<a class="sd-home-entry sd-premium-entry" data-sd-grade="'+grade+'" data-usage-action="sd_open" href="'+new URL('sudden-death.html?grade='+grade,base).href+'"><span class="sd-entry-content"><span class="sd-entry-eyebrow">その先の、自分へ。</span><strong>限界チャレンジ</strong><span class="sd-entry-best">自己ベスト <b>'+(Number(best)||0)+'</b> 問</span><span class="sd-entry-cta">'+(active?'挑戦を再開':'挑戦する')+' <i aria-hidden="true">→</i></span></span>'+art+'<span class="sd-entry-spark" aria-hidden="true">✦</span></a>':'<button type="button" class="sd-home-entry sd-locked" data-sd-grade="'+grade+'" aria-disabled="true" aria-label="限界チャレンジ、学科200問で解放">'+title+chain()+'<span class="sd-home-lock" aria-hidden="true">'+window.SKIMARU_LIMIT_UNLOCK.lockIcon+'</span></button>';
 }
 document.addEventListener('click',e=>{if(e.target.closest('.sd-home-entry.sd-locked')){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.SKIMARU_LIMIT_CARD={html};
})();
