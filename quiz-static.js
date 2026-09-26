"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof judge!=="function"||typeof renderQ!=="function")return;

  const baseRenderQ=renderQ;

  renderQ=function(){
    const r=baseRenderQ.apply(this,arguments);

    // 次の問題では元の回答画面を確実に復元。
    const ans=document.getElementById("ans");
    if(ans){
      ans.classList.remove("answer-locked");
      ans.classList.remove("hide");
      ans.removeAttribute("aria-disabled");
    }

    const stamp=document.getElementById("stamp");
    if(stamp){
      stamp.classList.remove("show","ng");
      stamp.setAttribute("aria-hidden","true");
    }
    return r;
  };

  // 元の回答後レイアウト：
  // 回答エリアを消して、正答・解説・次へを表示。
  // ただしスタンプアニメーションと自動focusは行わない。
  judge=function(ok){
    const q=S.q;
    window.SkimaruSound?.[ok?"correct":"wrong"]?.();

    const panel=document.getElementById("jd-s");
    if(panel)panel.classList.toggle("ng",!ok);

    const stamp=document.getElementById("stamp");
    if(stamp){
      stamp.textContent=ok?"正解":"不正解";
      stamp.classList.remove("show");
      stamp.classList.toggle("ng",!ok);
      stamp.setAttribute("aria-hidden","true");
    }

    const answer=document.getElementById("jd-ans");
    if(answer)answer.textContent=q.answer?"○":"✕";

    const explanation=document.getElementById("jd-e");
    if(explanation)explanation.textContent=q.explanation;

    const uncertain=document.getElementById("jd-c");
    if(uncertain)uncertain.classList.toggle("hide",!(ok&&!S.sure));

    const warning=document.getElementById("jd-w");
    if(warning){
      warning.classList.remove("show","dg");
      if(!ok&&S.everOK){
        warning.innerHTML="<b>⚠ 前は正解できた問題を、今回は落としました。</b><br>覚えたつもりで定着していないサインです。明日また出題します。";
        warning.classList.add("show","dg");
      }else if(ok&&!S.sure){
        warning.innerHTML="<b>▲ 当たりましたが、自信はありませんでした。</b><br>まぐれの可能性があるため、定着とはみなさず再出題します。";
        warning.classList.add("show");
      }
    }

    const ans=document.getElementById("ans");
    if(ans)ans.classList.add("hide");

    const detail=document.getElementById("jd");
    if(detail)detail.classList.add("show");

    const next=document.getElementById("btn-next");
    if(next)next.textContent=(S.i===S.queue.length-1)?"結果を見る":"次へ";

    const sr=document.getElementById("sr-status");
    if(sr)sr.textContent=(ok?"正解。":"不正解。正答は"+(q.answer?"丸":"バツ")+"。")+q.explanation;

    // requestAnimationFrame / focus / scroll は一切しない。
  };
})();
