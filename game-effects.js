"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof renderQ!=="function"||typeof judge!=="function")return;

  const baseRenderQ=renderQ;
  const baseJudge=judge;

  function clearAddedFx(){
    document.querySelectorAll(".battle-fx-root,.game-result-pop,.game-spark").forEach(e=>e.remove());
    document.body.classList.remove(
      "battle-screen-shake",
      "battle-hitstop",
      "battle-fail-shake"
    );
  }

  // 回答後の追加演出は一切入れない。
  judge=function(ok){
    clearAddedFx();
    return baseJudge.apply(this,arguments);
  };

  // 過去に間違えた問題の「再挑戦」表示だけ残す。
  renderQ=function(){
    clearAddedFx();
    const out=baseRenderQ.apply(this,arguments);

    try{
      document.querySelectorAll(".game-retry-badge").forEach(e=>e.remove());
      const q=S.q;
      const stat=U.stats?.[q?.id];
      const wrongs=Number(stat?.w)||0;

      if(!q||!wrongs||S.isMock||U.showWarn===false)return out;

      const card=document.querySelector(".q-card");
      const warn=document.getElementById("q-warn");

      if(card){
        const badge=document.createElement("div");
        badge.className="game-retry-badge simple-retry";
        badge.innerHTML=`<span>🔥</span><div><b>再挑戦</b><small>過去 ${wrongs}回ミス</small></div>`;
        card.prepend(badge);
      }

      if(warn){
        warn.textContent="🔥 過去に間違えた問題です";
        warn.classList.add("show","game-revenge-warn");
      }
    }catch(e){}

    return out;
  };
})();
