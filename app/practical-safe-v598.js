"use strict";
(() => {
  if(document.body.dataset.learningMode!=="practical")return;
  const VERSION="5.9.8";
  document.body.classList.add("v58");
  document.body.classList.remove("skimaru-booting","skimaru-show-spinner","page-transitioning");
  document.title=`スキマル保全士 実技演習 Ver ${VERSION}`;
  const sub=document.querySelector("#pt-home .hd-sub");
  if(sub)sub.textContent=`自主保全士2級 / 実技 / Ver ${VERSION}`;

  const wrap=document.getElementById("pt-question-scroll");
  const answers=document.getElementById("pt-answer-area");

  function resetScroll(){
    if(wrap)wrap.scrollTop=0;
    if(answers)answers.scrollTop=0;
    window.scrollTo(0,0);
  }

  if(typeof renderPracticalTask==="function" && !renderPracticalTask.__safe598){
    const base=renderPracticalTask;
    const wrapped=function(){
      const out=base.apply(this,arguments);
      requestAnimationFrame(resetScroll);
      return out;
    };
    wrapped.__safe598=true;
    renderPracticalTask=wrapped;
  }

  const nativeScrollIntoView=Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView=function(options){
    if(this.closest && this.closest("#pt-quiz")){
      return nativeScrollIntoView.call(this,{block:"nearest",inline:"nearest",behavior:"auto"});
    }
    return nativeScrollIntoView.call(this,options);
  };

  window.addEventListener("pageshow",()=>{
    document.body.classList.remove("skimaru-booting","skimaru-show-spinner","page-transitioning");
  });

  let sx=0,sy=0,tracking=false;
  document.addEventListener("touchstart",e=>{
    if(!document.getElementById("pt-home")?.classList.contains("active"))return;
    if(e.touches.length!==1)return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;tracking=true;
  },{passive:true});
  document.addEventListener("touchend",e=>{
    if(!tracking||!e.changedTouches.length)return;
    tracking=false;
    const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(dx>80&&Math.abs(dx)>Math.abs(dy)*1.4)location.href="./player.html";
  },{passive:true});

  resetScroll();
})();