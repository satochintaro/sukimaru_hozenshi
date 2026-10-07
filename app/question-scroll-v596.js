"use strict";
(() => {
  const mode=document.body.dataset.learningMode;
  if(mode!=="academic"&&mode!=="practical")return;

  const afterLayout=(fn)=>requestAnimationFrame(()=>requestAnimationFrame(fn));

  function setupAcademic(){
    const card=document.querySelector("#sc-quiz .q-card");
    const text=document.getElementById("q-txt");
    if(!card||!text)return;

    function refresh(){
      card.classList.remove("is-scrollable");
      card.scrollTop=0;
      afterLayout(()=>{
        const max=Math.min(window.innerHeight*0.34,300);
        const overflow=card.scrollHeight>max+6;
        card.classList.toggle("is-scrollable",overflow);
      });
    }

    new MutationObserver(refresh).observe(text,{childList:true,characterData:true,subtree:true});
    window.addEventListener("resize",refresh,{passive:true});
    window.addEventListener("orientationchange",refresh,{passive:true});
    refresh();
  }

  function setupPractical(){
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

    function refreshQuestion(){
      wrap.classList.remove("is-scrollable");
      wrap.scrollTop=0;
      afterLayout(()=>{
        const limit=Math.min(window.innerHeight*0.48,500);
        wrap.classList.toggle("is-scrollable",wrap.scrollHeight>limit+6);
      });
    }

    function refreshAnswers(){
      answers.classList.remove("is-scrollable");
      answers.scrollTop=0;
      afterLayout(()=>{
        const limit=Math.min(window.innerHeight*0.38,380);
        answers.classList.toggle("is-scrollable",answers.scrollHeight>limit+6);
      });
    }

    const questionObserver=new MutationObserver(()=>{
      refreshQuestion();
      refreshAnswers();
    });
    questionObserver.observe(wrap,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class","src"]});
    questionObserver.observe(answers,{childList:true,characterData:true,subtree:true});

    if(figure)figure.addEventListener("load",refreshQuestion,true);
    window.addEventListener("resize",()=>{refreshQuestion();refreshAnswers();},{passive:true});
    window.addEventListener("orientationchange",()=>{refreshQuestion();refreshAnswers();},{passive:true});

    refreshQuestion();
    refreshAnswers();
  }

  if(mode==="academic")setupAcademic();
  else setupPractical();
})();
