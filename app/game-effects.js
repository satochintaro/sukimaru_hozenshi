"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof renderQ!=="function")return;

  const baseRenderQ=renderQ;

  function cleanup(){
    document.querySelectorAll(
      ".game-retry-badge,.battle-fx-root,.game-result-pop,.game-spark"
    ).forEach(e=>e.remove());

    document.body.classList.remove(
      "battle-screen-shake","battle-hitstop","battle-fail-shake"
    );

    const card=document.querySelector("#sc-quiz .q-card");
    if(card)card.classList.remove("game-retry-card","battle-card-in");
  }

  renderQ=function(){
    cleanup();
    const out=baseRenderQ.apply(this,arguments);

    try{
      const q=S.q;
      const stat=U.stats?.[q?.id];
      const wrongs=Number(stat?.w)||0;
      const warn=document.getElementById("q-warn");

      // 再挑戦表示は問題カード内に入れない。
      // 既存の警告バー1本だけを利用する。
      if(warn){
        const show=!!(q && wrongs && !S.isMock && U.showWarn!==false);
        warn.classList.toggle("show",show);
        warn.classList.remove("game-revenge-warn");
        if(show)warn.textContent=`🔥 過去に間違えた問題です（${wrongs}回）`;
      }
    }catch(e){}

    return out;
  };

  cleanup();
})();
