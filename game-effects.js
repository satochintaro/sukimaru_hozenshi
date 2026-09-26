"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof renderQ!=="function"||typeof judge!=="function")return;

  let retryState=null;
  let revengeCombo=0;
  const baseRenderQ=renderQ;
  const baseJudge=judge;

  function removeFx(){
    document.querySelectorAll(".battle-fx-root,.game-retry-badge").forEach(e=>e.remove());
    document.body.classList.remove("battle-screen-shake","battle-hitstop","battle-fail-shake");
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
      p.style.setProperty("--delay",`${(i%5)*0.015}s`);
      root.appendChild(p);
    }
  }

  function introFx(wrongs){
    const root=fxRoot("battle-intro");
    root.innerHTML=`
      <div class="battle-vignette"></div>
      <div class="battle-speed-lines"></div>
      <div class="battle-slash slash-a"></div>
      <div class="battle-slash slash-b"></div>
      <div class="battle-intro-copy">
        <small>PAST MISTAKE DETECTED</small>
        <b>REVENGE BATTLE</b>
        <span>過去 ${wrongs}回ミス　ここで取り返せ</span>
      </div>`;
    requestAnimationFrame(()=>root.classList.add("go"));
    document.body.classList.add("battle-screen-shake");
    setTimeout(()=>document.body.classList.remove("battle-screen-shake"),520);
    setTimeout(()=>root.remove(),1150);
  }

  function hitStop(){
    document.body.classList.add("battle-hitstop");
    setTimeout(()=>document.body.classList.remove("battle-hitstop"),120);
  }

  function successFx(wrongs){
    revengeCombo++;
    hitStop();

    const root=fxRoot("battle-finish success");
    const combo=revengeCombo>1
      ? `<div class="battle-combo"><b>${revengeCombo}</b><span>REVENGE COMBO</span></div>`
      : "";
    root.innerHTML=`
      <div class="battle-white-flash"></div>
      <div class="battle-cross-flare"></div>
      <div class="battle-shockwave wave-a"></div>
      <div class="battle-shockwave wave-b"></div>
      <div class="battle-speed-lines finish-lines"></div>
      <div class="battle-finish-copy">
        <small>PAST MISTAKE</small>
        <b>BREAKTHROUGH!</b>
        <span>${wrongs}回のミスを突破</span>
      </div>
      ${combo}`;
    addBurst(root,28,"gold");
    addBurst(root,14,"white");
    requestAnimationFrame(()=>root.classList.add("go"));
    document.body.classList.add("battle-screen-shake");
    setTimeout(()=>document.body.classList.remove("battle-screen-shake"),620);
    setTimeout(()=>root.remove(),1850);
  }

  function failFx(){
    revengeCombo=0;
    hitStop();

    const root=fxRoot("battle-finish fail");
    root.innerHTML=`
      <div class="battle-red-flash"></div>
      <div class="battle-slash fail-a"></div>
      <div class="battle-slash fail-b"></div>
      <div class="battle-speed-lines fail-lines"></div>
      <div class="battle-finish-copy">
        <small>NOT YET</small>
        <b>RETRY!</b>
        <span>まだ終わらない　次で決めろ</span>
      </div>`;
    addBurst(root,18,"red");
    requestAnimationFrame(()=>root.classList.add("go"));
    document.body.classList.add("battle-fail-shake");
    setTimeout(()=>document.body.classList.remove("battle-fail-shake"),720);
    setTimeout(()=>root.remove(),1550);
  }

  renderQ=function(){
    const out=baseRenderQ.apply(this,arguments);
    removeFx();
    retryState=null;

    try{
      const q=S.q;
      const stat=U.stats?.[q?.id];
      const wrongs=Number(stat?.w)||0;
      if(!q||!wrongs||S.isMock||U.showWarn===false)return out;

      retryState={id:q.id,wrongs};
      const card=document.querySelector(".q-card");
      const warn=document.getElementById("q-warn");

      introFx(wrongs);

      if(card){
        card.classList.add("game-retry-card","battle-card-in");
        const badge=document.createElement("div");
        badge.className="game-retry-badge battle";
        badge.innerHTML=`
          <span class="battle-flame">🔥</span>
          <div>
            <b>REVENGE BATTLE</b>
            <small>MISTAKE × ${wrongs}</small>
          </div>`;
        card.prepend(badge);
        requestAnimationFrame(()=>badge.classList.add("show"));
        setTimeout(()=>card.classList.remove("battle-card-in"),900);
      }

      if(warn){
        warn.textContent="🔥 REVENGE BATTLE ── 過去に落とした問題。ここで決めろ";
        warn.classList.add("show","game-revenge-warn");
      }
    }catch(e){
      console.warn("battle retry effect",e);
    }
    return out;
  };

  judge=function(ok){
    const state=retryState&&S.q?.id===retryState.id?retryState:null;
    const out=baseJudge.apply(this,arguments);
    if(state&&!S.isMock){
      setTimeout(()=>ok?successFx(state.wrongs):failFx(),70);
    }
    return out;
  };
})();
