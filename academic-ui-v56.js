"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  const Core=window.SKIMARU_YEAR_CORE;
  if(!Core||typeof QUESTIONS==="undefined")return;

  function yearOf(q){
    return Core.academicYearOf(q);
  }

  function pastPool(){
    return QUESTIONS.filter(q=>yearOf(q));
  }

  function buildPastRandom10(){
    const pool=pastPool();
    const picked=[];
    const subjects=Array.isArray(SUBJ)?SUBJ:[...new Set(pool.map(q=>q.category))];
    subjects.forEach(cat=>{
      const catPool=pool.filter(q=>q.category===cat);
      picked.push(...balancedPick(catPool,Math.min(2,catPool.length)));
    });
    if(picked.length<10){
      const used=new Set(picked.map(q=>q.id));
      const extra=balancedPick(pool.filter(q=>!used.has(q.id)),10-picked.length);
      picked.push(...extra);
    }
    return shuffle(picked).slice(0,10);
  }

  function startPastRandom10(){
    const q=buildPastRandom10();
    if(!q.length){notify("過去問ベース問題がありません");return;}
    S.mode="past-random";
    S.subject=null;
    rec(q);
    launch(q,"過去問ランダム10問");
  }

  function installHomeCard(){
    document.querySelector(".practical-entry")?.classList.add("academic-hide-practical-entry");

    const menu=document.querySelector(".player-menu-head");
    if(!menu||document.getElementById("past-random-10"))return;

    const pool=pastPool();
    const years=[...new Set(pool.map(yearOf).filter(Boolean))].sort();
    const yearText=years.length?`${years[0]}〜${years.at(-1)}年度ベース`:"過去問ベース";

    const card=document.createElement("button");
    card.type="button";
    card.id="past-random-10";
    card.className="past-random-card";
    card.innerHTML=`
      <span class="past-random-icon">🎲</span>
      <span class="past-random-copy">
        <small>QUICK CHALLENGE</small>
        <b>ランダム10問</b>
        <em>${yearText} ／ 5科目ミックス</em>
      </span>
      <span class="past-random-go">▶</span>`;
    card.addEventListener("click",startPastRandom10);
    menu.insertAdjacentElement("afterend",card);
  }

  function ensureSourceBadge(){
    const qhd=document.querySelector("#sc-quiz .q-hd");
    if(!qhd)return null;
    let badge=document.getElementById("q-source-year");
    if(!badge){
      badge=document.createElement("span");
      badge.id="q-source-year";
      badge.className="q-source-year";
      const cat=document.getElementById("q-cat");
      if(cat)cat.insertAdjacentElement("afterend",badge);
      else qhd.prepend(badge);
    }
    return badge;
  }

  const baseRenderQ=renderQ;
  renderQ=function(){
    const out=baseRenderQ.apply(this,arguments);
    try{
      const q=S.q;
      const year=yearOf(q);
      const badge=ensureSourceBadge();
      const cat=document.getElementById("q-cat");
      if(cat&&q)cat.textContent=q.category;
      if(badge){
        badge.textContent=year?`${year}年度ベース`:"基礎問題";
        badge.classList.toggle("foundation",!year);
      }
    }catch(e){}
    return out;
  };

  installHomeCard();
  window.startPastRandom10=startPastRandom10;
})();
