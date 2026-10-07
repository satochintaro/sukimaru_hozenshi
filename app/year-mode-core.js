"use strict";
(function(root){
  const YEARS = Object.freeze([2019,2020,2021,2022,2023,2024,2025]);
  const CURRENT_RANGES = Object.freeze({
    2023:[301,400],
    2024:[401,500],
    2025:[501,600]
  });
  const RESERVED_RANGES = Object.freeze({
    2019:[1001,1100],
    2020:[1101,1200],
    2021:[1201,1300],
    2022:[1301,1400]
  });

  function academicYearOf(question){
    if(!question) return null;
    const explicit = Number(question.year);
    if(YEARS.includes(explicit)) return explicit;
    const id = Number(question.id);
    if(!Number.isInteger(id)) return null;
    for(const [year,range] of Object.entries(CURRENT_RANGES)){
      if(id>=range[0] && id<=range[1]) return Number(year);
    }
    for(const [year,range] of Object.entries(RESERVED_RANGES)){
      if(id>=range[0] && id<=range[1]) return Number(year);
    }
    return null;
  }

  function annotateAcademic(questions){
    (questions||[]).forEach(q=>{
      const y=academicYearOf(q);
      if(y && !q.year) q.year=y;
    });
    return questions;
  }

  function academicQuestionsForYear(questions,year){
    const y=Number(year);
    return (questions||[]).filter(q=>academicYearOf(q)===y);
  }

  function accuracyFromStats(items,stats){
    let correct=0,total=0,attempted=0;
    (items||[]).forEach(item=>{
      const s=(stats||{})[item.id];
      if(!s) return;
      attempted++;
      const c=Math.max(0,Number(s.c)||0);
      const w=Math.max(0,Number(s.w)||0);
      correct+=c; total+=c+w;
    });
    return {
      attempted,
      correct,
      total,
      rate:total?Math.round(correct/total*100):null
    };
  }

  function academicYearResults(questions,stats){
    const out={};
    YEARS.forEach(year=>{
      const items=academicQuestionsForYear(questions,year);
      out[year]=Object.assign({questions:items.length},accuracyFromStats(items,stats));
    });
    return out;
  }

  function practicalTasksForYear(tasks,year){
    const y=Number(year);
    return (tasks||[]).filter(task=>Number(task.year)===y);
  }

  function practicalYearResults(tasks,attempts){
    const out={};
    YEARS.forEach(year=>{
      const items=practicalTasksForYear(tasks,year);
      let attempted=0,correct=0,total=0;
      items.forEach(task=>{
        const a=(attempts||{})[task.id];
        if(!a) return;
        attempted++;
        correct+=Math.max(0,Number(a.lastCorrect)||0);
        total+=Math.max(0,Number(a.lastTotal)||0);
      });
      out[year]={tasks:items.length,attempted,correct,total,rate:total?Math.round(correct/total*100):null};
    });
    return out;
  }

  function validateAcademicIds(questions){
    const seen=new Set(),duplicates=[],invalid=[];
    (questions||[]).forEach(q=>{
      const id=Number(q.id);
      if(!Number.isInteger(id)||id<=0) invalid.push(q.id);
      else if(seen.has(id)) duplicates.push(id);
      else seen.add(id);
    });
    return {ok:duplicates.length===0&&invalid.length===0,duplicates,invalid};
  }

  const API={YEARS,CURRENT_RANGES,RESERVED_RANGES,academicYearOf,annotateAcademic,
    academicQuestionsForYear,accuracyFromStats,academicYearResults,
    practicalTasksForYear,practicalYearResults,validateAcademicIds};
  root.SKIMARU_YEAR_CORE=API;
  if(typeof module!=="undefined" && module.exports) module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
