"use strict";
(() => {
  const mode=document.body.dataset.learningMode;
  if(mode!=="academic"&&mode!=="practical")return;

  const afterPaint=(fn)=>requestAnimationFrame(fn);

  if(mode==="academic"){
    if(typeof renderQ==="function"){
      const baseRenderQ=renderQ;
      renderQ=function(){
        const out=baseRenderQ.apply(this,arguments);
        afterPaint(()=>{
          const card=document.querySelector("#sc-quiz .q-card");
          if(card)card.scrollTop=0;
        });
        return out;
      };
    }
    return;
  }

  const quiz=document.querySelector("#pt-quiz .practical-quiz-pad");
  const head=document.querySelector("#pt-quiz .pt-task-head");
  const figure=document.querySelector("#pt-quiz .pt-figure");
  const material=document.querySelector("#pt-quiz .pt-material");
  const answers=document.querySelector("#pt-quiz .pt-answer-area");
  if(!quiz||!head||!material||!answers)return;

  let wrap=document.querySelector("#pt-quiz .pt-question-scroll");
  if(!wrap){
    wrap=document.createElement("div");
    wrap.className="pt-question-scroll";
    quiz.insertBefore(wrap,head);
    wrap.appendChild(head);
    if(figure)wrap.appendChild(figure);
    wrap.appendChild(material);
  }

  function resetScroll(){
    afterPaint(()=>{
      wrap.scrollTop=0;
      answers.scrollTop=0;
    });
  }

  if(typeof renderPracticalTask==="function"){
    const baseRenderPracticalTask=renderPracticalTask;
    renderPracticalTask=function(){
      const out=baseRenderPracticalTask.apply(this,arguments);
      resetScroll();
      return out;
    };
  }

  resetScroll();
})();
