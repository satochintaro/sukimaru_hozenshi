"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;

  function fix(){
    document.querySelectorAll(
      "#sc-quiz .game-retry-badge,.battle-fx-root,.game-result-pop,.game-spark"
    ).forEach(e=>e.remove());

    const card=document.querySelector("#sc-quiz .q-card");
    if(card)card.classList.remove("game-retry-card","battle-card-in");

    const ans=document.getElementById("ans");
    const jd=document.getElementById("jd");
    if(ans&&jd){
      if(jd.classList.contains("show")){
        ans.classList.remove("answer-locked");
        ans.classList.add("hide");
      }else{
        ans.classList.remove("answer-locked");
      }
    }

    document.body.classList.remove(
      "battle-screen-shake","battle-hitstop","battle-fail-shake"
    );
  }

  fix();

  const quiz=document.getElementById("sc-quiz");
  if(quiz){
    new MutationObserver(fix).observe(quiz,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["class"]
    });
  }
})();
