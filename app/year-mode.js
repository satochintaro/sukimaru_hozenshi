"use strict";
(function(){
  const Core=window.SKIMARU_YEAR_CORE;
  if(!Core || typeof QUESTIONS==="undefined") return;

  Core.annotateAcademic(QUESTIONS);

  // 2019～2022年度用の拡張データを別ファイルから追加可能。
  // 既存ID 1～600は変更しない。追加時は予約ID 1001～1400を使用する。
  const extras=Array.isArray(window.SKIMARU_EXTRA_QUESTIONS)?window.SKIMARU_EXTRA_QUESTIONS:[];
  if(extras.length){
    const used=new Set(QUESTIONS.map(q=>Number(q.id)));
    extras.forEach(q=>{
      const id=Number(q.id);
      if(Number.isInteger(id)&&!used.has(id)){QUESTIONS.push(q);used.add(id);}
    });
    Core.annotateAcademic(QUESTIONS);
  }

  function yearStats(year){
    const items=Core.academicQuestionsForYear(QUESTIONS,year);
    return Object.assign({questions:items.length},Core.accuracyFromStats(items,U.stats));
  }

  function statusText(year){
    const s=yearStats(year);
    if(!s.questions) return "問題データ未収録";
    if(!s.total) return `${s.questions}問・未着手`;
    return `${s.questions}問・正答率 ${s.rate}%`;
  }

  function startPastYear(year){
    const pool=Core.academicQuestionsForYear(QUESTIONS,year);
    if(!pool.length){notify(`${year}年度の問題データはまだ収録されていません`);return;}
    S.mode="past-year";S.subject=null;
    launch(pool.slice(),`${year}年度 過去問`);
  }

  function startPastYearQuick(year){
    const pool=Core.academicQuestionsForYear(QUESTIONS,year);
    if(!pool.length){notify(`${year}年度の問題データはまだ収録されていません`);return;}
    S.mode="past-year";S.subject=null;
    const q=balancedPick(pool,Math.min(10,pool.length));
    rec(q);launch(q,`${year}年度 ランダム10問`);
  }

  function showPastYears(){
    let section=document.getElementById("sc-years");
    if(!section){
      section=document.createElement("section");
      section.id="sc-years";section.setAttribute("aria-hidden","true");
      section.innerHTML=`<div class="hd"><button class="hd-back" type="button" aria-label="ホームへ戻る">‹</button>
        <div class="hd-ttl">年度別 過去問</div></div>
        <div class="pad"><p class="note">年度を選択してください。収録済み年度は本番100問またはランダム10問で学習できます。</p>
        <div class="scroll" id="year-list"></div></div>`;
      section.querySelector(".hd-back").addEventListener("click",goHome);
      document.body.insertBefore(section,document.getElementById("toast")||null);
    }
    const list=section.querySelector("#year-list");list.innerHTML="";
    Core.YEARS.slice().reverse().forEach(year=>{
      const s=yearStats(year),card=document.createElement("div");
      card.className="pn";card.style.marginBottom="9px";
      const rate=s.rate===null?"–":s.rate+"%";
      card.innerHTML=`<div class="row" style="padding:0">
        <span class="row-i">${String(year).slice(2)}</span>
        <span class="row-b"><span class="row-t">${year}年度</span><span class="row-d">${statusText(year)}</span></span>
        <span class="row-v">${rate}</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px">
          <button class="btn-g js-full" type="button"${s.questions?"":" disabled"}>本番 ${s.questions||100}問</button>
          <button class="btn-g js-quick" type="button"${s.questions?"":" disabled"}>ランダム10問</button>
        </div>`;
      if(s.questions){
        card.querySelector(".js-full").addEventListener("click",()=>startPastYear(year));
        card.querySelector(".js-quick").addEventListener("click",()=>startPastYearQuick(year));
      }
      list.appendChild(card);
    });
    show("sc-years");
  }

  // 学科提出データへ年度別集計を追加。既存フィールドはそのまま維持。
  const baseBuild=build;
  build=function(){
    const record=baseBuild();
    record.v=Math.max(8,Number(record.v)||0);
    record.examType="academic";
    record.yearResults=Core.academicYearResults(QUESTIONS,U.stats);
    return record;
  };

  // 問題画面に年度を明示。
  const baseRenderQ=renderQ;
  renderQ=function(){
    baseRenderQ();
    const year=Core.academicYearOf(S.q);
    if(year){
      const cat=document.getElementById("q-cat");
      if(cat) cat.textContent=`${year}年度｜${S.q.category}`;
    }
  };

  // ホームへ年度別ボタンを追加。
  const menu=document.querySelector(".player-main-menu");
  if(menu && !document.getElementById("mi-past-year")){
    const button=document.createElement("button");
    button.className="mi t-org";button.id="mi-past-year";button.type="button";
    button.innerHTML='<span class="mi-i">07</span><span class="mi-n">年度別<br>過去問</span>';
    button.addEventListener("click",showPastYears);
    menu.appendChild(button);
  }

  // 設定画面の問題数表示は実データに合わせる。
  const qn=document.getElementById("st-qn");if(qn)qn.textContent=QUESTIONS.length;

  window.showPastYears=showPastYears;
  window.startPastYear=startPastYear;
  window.startPastYearQuick=startPastYearQuick;
  window.skimaruAcademicYearStats=()=>Core.academicYearResults(QUESTIONS,U.stats);
})();
