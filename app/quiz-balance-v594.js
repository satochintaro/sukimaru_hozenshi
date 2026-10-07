"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;

  function clean(){
    document.querySelectorAll(
      "#sc-quiz .game-retry-badge,#sc-quiz [class*='retry-badge'],.battle-fx-root,.game-result-pop,.game-spark"
    ).forEach(e=>e.remove());

    document.querySelector("#sc-quiz .q-card")?.classList.remove(
      "game-retry-card","battle-card-in"
    );

    document.body.classList.remove(
      "battle-screen-shake","battle-hitstop","battle-fail-shake"
    );

    const ans=document.getElementById("ans");
    const jd=document.getElementById("jd");
    if(ans&&jd&&jd.classList.contains("show")){
      ans.classList.remove("answer-locked");
      ans.classList.add("hide");
    }
  }

  clean();

  // 問題切替直後の1フレームだけ再確認。
  requestAnimationFrame(clean);
})();
