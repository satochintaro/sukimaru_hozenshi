"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof renderQ!=="function"||typeof judge!=="function")return;

  let retryState=null;
  let clearCombo=0;
  const baseRenderQ=renderQ;
  const baseJudge=judge;

  function removeFx(){
    document.querySelectorAll(".battle-fx-root,.game-retry-badge").forEach(e=>e.remove());
    document.body.classList.remove("battle-hitstop","battle-screen-shake","battle-fail-shake");
    document.querySelector(".q-card")?.classList.remove("game-retry-card","battle-card-in");
    document.getElementById("q-warn")?.classList.remove("game-revenge-warn");
  }

  function fxRoot(extra=""){
    const root=document.createElement("div");
    root.className=`battle-fx-root ${extra}`.trim();
    root.setAttribute("aria-hidden","true");
    document.body.appendChild(root);
    return root;
  }

  function addBurst(root,count,kind){
    for(let i=0;i<count;i++){
      const p=document.createElement("i");
      p.className=`battle-particle ${kind}`;
      p.style.setProperty("--i",String(i));
      p.style.setProperty("--count",String(count));
      p.style.setProperty("--delay",`${(i%5)*0.012}s`);
      root.appendChild(p);
    }
  }

  function hitStop(ms=95){
    document.body.classList.add("battle-hitstop");
    setTimeout(()=>document.body.classList.remove("battle-hitstop"),ms);
  }

  function retryIntro(wrongs){
    const root=fxRoot("battle-intro");
    root.innerHTML=`
      <div class="battle-vignette"></div>
      <div class="battle-speed-lines"></div>
      <div class="battle-slash slash-a"></div>
      <div class="battle-slash slash-b"></div>
      <div class="battle-intro-copy">
        <small>過去に間違えた問題</small>
        <b>再挑戦</b>
        <span>過去 ${wrongs}回ミス　ここで克服しよう</span>
      </div>`;
    requestAnimationFrame(()=>root.classList.add("go"));
    setTimeout(()=>root.remove(),1150);
  }

  function standardResultFx(ok){
    hitStop(ok?85:110);
    const root=fxRoot(`battle-standard ${ok?"correct":"wrong"}`);
    root.innerHTML=ok?`
      <div class="battle-standard-flash"></div>
      <div class="battle-shockwave standard-wave"></div>
      <div class="battle-result-copy"><b>正解！</b></div>`:`
      <div class="battle-standard-red"></div>
      <div class="battle-slash standard-fail"></div>
      <div class="battle-result-copy"><b>不正解</b></div>`;
    addBurst(root,ok?18:12,ok?"green":"red");
    requestAnimationFrame(()=>root.classList.add("go"));
    setTimeout(()=>root.remove(),ok?1050:1150);
  }

  function retryClearFx(wrongs){
    clearCombo++;
    hitStop(120);
    const root=fxRoot("battle-finish success");
    const combo=clearCombo>1?`<div class="battle-combo"><b>${clearCombo}</b><span>連続克服</span></div>`:"";
    root.innerHTML=`
      <div class="battle-white-flash"></div>
      <div class="battle-cross-flare"></div>
      <div class="battle-shockwave wave-a"></div>
      <div class="battle-shockwave wave-b"></div>
      <div class="battle-speed-lines finish-lines"></div>
      <div class="battle-finish-copy">
        <small>過去に間違えた問題</small>
        <b>克服！</b>
        <span>${wrongs}回のミスを乗り越えました</span>
      </div>${combo}`;
    addBurst(root,28,"gold");
    addBurst(root,14,"white");
    requestAnimationFrame(()=>root.classList.add("go"));
    setTimeout(()=>root.remove(),1850);
  }

  function retryMissFx(){
    clearCombo=0;
    hitStop(120);
    const root=fxRoot("battle-finish fail");
    root.innerHTML=`
      <div class="battle-red-flash"></div>
      <div class="battle-slash fail-a"></div>
      <div class="battle-slash fail-b"></div>
      <div class="battle-speed-lines fail-lines"></div>
      <div class="battle-finish-copy">
        <b>もう一度</b>
        <span>復習して次に克服しよう</span>
      </div>`;
    addBurst(root,18,"red");
    requestAnimationFrame(()=>root.classList.add("go"));
    setTimeout(()=>root.remove(),1550);
  }

  renderQ=function(){
    const out=baseRenderQ.apply(this,arguments);
    removeFx();
    retryState=null;
    try{
      const q=S.q,stat=U.stats?.[q?.id],wrongs=Number(stat?.w)||0;
      if(!q||!wrongs||S.isMock||U.showWarn===false)return out;
      retryState={id:q.id,wrongs};

      const card=document.querySelector(".q-card");
      const warn=document.getElementById("q-warn");
      retryIntro(wrongs);

      if(card){
        card.classList.add("game-retry-card","battle-card-in");
        const badge=document.createElement("div");
        badge.className="game-retry-badge battle";
        badge.innerHTML=`<span class="battle-flame">🔥</span><div><b>再挑戦</b><small>過去 ${wrongs}回ミス</small></div>`;
        card.prepend(badge);
        requestAnimationFrame(()=>badge.classList.add("show"));
        setTimeout(()=>card.classList.remove("battle-card-in"),900);
      }

      if(warn){
        warn.textContent="🔥 過去に間違えた問題です。ここで克服しよう";
        warn.classList.add("show","game-revenge-warn");
      }
    }catch(e){}
    return out;
  };

  judge=function(ok){
    const state=retryState&&S.q?.id===retryState.id?retryState:null;
    const out=baseJudge.apply(this,arguments);
    if(S.isMock)return out;
    setTimeout(()=>{
      if(state) ok?retryClearFx(state.wrongs):retryMissFx();
      else standardResultFx(!!ok);
    },60);
    return out;
  };
})();
