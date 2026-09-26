"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  if(typeof judge!=="function"||typeof renderQ!=="function")return;

  const baseRenderQ=renderQ;

  renderQ=function(){
    const r=baseRenderQ.apply(this,arguments);
    const ans=document.getElementById("ans");
    if(ans){
      ans.classList.remove("answer-locked");
      ans.removeAttribute("aria-disabled");
    }
    const stamp=document.getElementById("stamp");
    if(stamp){
      stamp.classList.remove("show","ng");
      stamp.setAttribute("aria-hidden","true");
    }
    return r;
  };

  judge=function(ok){
    const q=S.q;
    window.SkimaruSound?.[ok?"correct":"wrong"]?.();

    const panel=document.getElementById("jd-s");
    if(panel)panel.classList.toggle("ng",!ok);

    const stamp=document.getElementById("stamp");
    if(stamp){
      stamp.classList.remove("show","ng");
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
        warning.innerHTML="<b>⚠ 前は正解できた問題を、今回は落としました。</b><br>明日もう一度確認しましょう。";
        warning.classList.add("show","dg");
      }else if(ok&&!S.sure){
        warning.innerHTML="<b>▲ 正解ですが、自信なしでした。</b><br>定着確認のため再出題します。";
        warning.classList.add("show");
      }
    }

    const ans=document.getElementById("ans");
    if(ans){
      ans.classList.remove("hide");
      ans.classList.add("answer-locked");
      ans.setAttribute("aria-disabled","true");
    }

    const detail=document.getElementById("jd");
    if(detail)detail.classList.add("show");

    const next=document.getElementById("btn-next");
    if(next)next.textContent=(S.i===S.queue.length-1)?"結果を見る":"次へ";

    const sr=document.getElementById("sr-status");
    if(sr)sr.textContent=(ok?"正解。":"不正解。正答は"+(q.answer?"丸":"バツ")+"。")+q.explanation;
  };
})();
