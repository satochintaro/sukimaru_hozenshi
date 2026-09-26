"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof renderQ!=="function"||typeof judge!=="function")return;

  let retryState=null;
  const baseRenderQ=renderQ;
  const baseJudge=judge;

  function clearFx(){
    document.querySelectorAll(".game-retry-badge,.game-result-pop,.game-spark").forEach(e=>e.remove());
    document.querySelector(".q-card")?.classList.remove("game-retry-card","game-retry-enter","game-retry-clear","game-retry-miss");
    document.getElementById("q-warn")?.classList.remove("game-revenge-warn");
  }

  function addSparks(card){
    for(let i=0;i<8;i++){
      const s=document.createElement("i");
      s.className="game-spark";s.style.setProperty("--i",String(i));
      card.appendChild(s);
      setTimeout(()=>s.remove(),900);
    }
  }

  function resultPop(ok,wrongs){
    const card=document.querySelector(".q-card");if(!card)return;
    const pop=document.createElement("div");
    pop.className=`game-result-pop ${ok?"clear":"miss"}`;
    pop.innerHTML=ok?`<b>RETRY CLEAR!</b><span>過去のミスを克服</span>`:`<b>RETRY CONTINUES</b><span>次こそ取り返そう</span>`;
    card.appendChild(pop);
    card.classList.add(ok?"game-retry-clear":"game-retry-miss");
    if(ok)addSparks(card);
    setTimeout(()=>pop.classList.add("show"),20);
    setTimeout(()=>pop.remove(),1500);
  }

  renderQ=function(){
    const out=baseRenderQ.apply(this,arguments);
    clearFx();
    retryState=null;
    try{
      const q=S.q,s=U.stats?.[q?.id],wrongs=Number(s?.w)||0;
      if(!q||!wrongs||S.isMock||U.showWarn===false)return out;

      retryState={id:q.id,wrongs};
      const card=document.querySelector(".q-card"),warn=document.getElementById("q-warn");
      if(card){
        card.classList.add("game-retry-card","game-retry-enter");
        const badge=document.createElement("div");
        badge.className="game-retry-badge";
        badge.innerHTML=`<span>🔥</span><div><b>REVENGE CHANCE</b><small>過去 ${wrongs}回ミス</small></div>`;
        card.prepend(badge);
        requestAnimationFrame(()=>badge.classList.add("show"));
        setTimeout(()=>card.classList.remove("game-retry-enter"),850);
      }
      if(warn){
        warn.textContent="🔥 REVENGE ── 前に間違えた問題。ここで取り返そう";
        warn.classList.add("show","game-revenge-warn");
      }
    }catch(e){console.warn("game retry effect",e);}
    return out;
  };

  judge=function(ok){
    const state=retryState&&S.q?.id===retryState.id?retryState:null;
    const out=baseJudge.apply(this,arguments);
    if(state&&!S.isMock){
      requestAnimationFrame(()=>resultPop(!!ok,state.wrongs));
    }
    return out;
  };
})();
