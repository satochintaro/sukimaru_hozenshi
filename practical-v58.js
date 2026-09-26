"use strict";
(() => {
  if(document.body.dataset.learningMode!=="practical")return;

  // After yearly tasks are merged, refresh counts and labels.
  function refresh58(){
    const total=typeof TASKS!=="undefined"?TASKS.length:90;
    const heroSmall=document.querySelector("#pt-home .pt-hero small");
    if(heroSmall)heroSmall.textContent=`全${total}課題・ランダム10課題・2019〜2025年度ベース`;
    const title=document.querySelector("#pt-home .hd-ttl");
    if(title)title.textContent="実技演習";
    const sub=document.querySelector("#pt-home .hd-sub");
    if(sub)sub.textContent="PLAYER / Ver 5.8.0 / 実技";
    document.querySelector("#pt-home .pt-test-badge")?.remove();
    const primary=document.querySelector("#pt-home .pt-primary");
    if(primary)primary.textContent="ランダム10課題";
    const reset=document.querySelector("#pt-home .pt-reset");
    if(reset)reset.textContent="実技成績をリセット";
  }

  if(typeof renderPracticalHome==="function"){
    const base=renderPracticalHome;
    renderPracticalHome=function(){
      const r=base.apply(this,arguments);
      requestAnimationFrame(refresh58);
      return r;
    };
  }

  if(typeof renderPracticalResult==="function"){
    const base=renderPracticalResult;
    renderPracticalResult=function(){
      const r=base.apply(this,arguments);
      const msg=document.getElementById("pt-result-message");
      if(msg){
        const rate=P.latestRun?.rate??0;
        msg.textContent=rate>=75
          ?"目標ライン（75点）に到達しました"
          :"75点を目標に、間違えた課題を復習しましょう";
      }
      return r;
    };
  }

  // Replace old test-mode reset wording while keeping the same stored data.
  resetPracticalData=function(){
    if(!confirm("実技成績をリセットしますか？\n学科の成績には影響しません。"))return;
    P=basePracticalData();
    savePracticalData();
    renderPracticalHome();
    notifyPractical("実技成績をリセットしました");
  };

  refresh58();
})();
