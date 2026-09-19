"use strict";
(function(){
  const Core=window.SKIMARU_YEAR_CORE;
  if(!Core || typeof TASKS==="undefined") return;

  // 将来、利用可能な年度別実技データを追加する場合の拡張口。
  const extras=Array.isArray(window.SKIMARU_EXTRA_PRACTICAL_TASKS)?window.SKIMARU_EXTRA_PRACTICAL_TASKS:[];
  if(extras.length){
    const used=new Set(TASKS.map(t=>String(t.id)));
    extras.forEach(task=>{
      const id=String(task.id||"");
      if(id&&!used.has(id)){TASKS.push(task);used.add(id);}
    });
  }

  function practicalYearStats(){
    return Core.practicalYearResults(TASKS,P.attempts);
  }

  function startPracticalYear(year){
    const tasks=Core.practicalTasksForYear(TASKS,year);
    if(!tasks.length){notifyPractical(`${year}年度の実技問題データはまだ収録されていません`);return;}
    startPractical(tasks,`${year}年度 実技`);
  }

  function injectYearPanel(){
    const home=document.querySelector("#pt-home .practical-pad");
    if(!home || document.getElementById("pt-year-panel")) return;
    const panel=document.createElement("div");panel.id="pt-year-panel";panel.className="pn";
    panel.style.marginTop="12px";
    panel.innerHTML='<div class="lb">年 度 別 実 技</div><div id="pt-year-list" style="margin-top:8px"></div>';
    const anchor=document.querySelector("#pt-home .pt-section-head");
    home.insertBefore(panel,anchor||null);
    renderYearPanel();
  }

  function renderYearPanel(){
    const list=document.getElementById("pt-year-list");if(!list)return;
    const stats=practicalYearStats();list.innerHTML="";
    Core.YEARS.slice().reverse().forEach(year=>{
      const s=stats[year],b=document.createElement("button");
      b.type="button";b.className="pn row";b.style.marginBottom="7px";
      b.disabled=!s.tasks;
      const rate=s.rate===null?"–":s.rate+"%";
      b.innerHTML=`<span class="row-i">${String(year).slice(2)}</span><span class="row-b">
        <span class="row-t">${year}年度</span><span class="row-d">${s.tasks?`${s.tasks}課題・${s.attempted}課題挑戦`:"問題データ未収録"}</span>
        </span><span class="row-v">${rate}</span><span class="row-go">›</span>`;
      if(s.tasks)b.addEventListener("click",()=>startPracticalYear(year));
      list.appendChild(b);
    });
  }

  // 実技提出データへ年度別集計を追加する。
  const baseSubmit=submitPracticalResult;
  submitPracticalResult=async function(){
    if(P.latestRun){
      P.latestRun.yearResults=practicalYearStats();
      savePracticalData();
    }
    return baseSubmit();
  };

  const baseHome=renderPracticalHome;
  renderPracticalHome=function(){
    baseHome();
    injectYearPanel();renderYearPanel();
  };

  renderPracticalHome();
  window.startPracticalYear=startPracticalYear;
  window.skimaruPracticalYearStats=practicalYearStats;
})();
