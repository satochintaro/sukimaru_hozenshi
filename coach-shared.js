"use strict";
(function(root){
  const THEMES=["安全・5S","自主保全・日常保全","効率化・ロス","改善・解析","設備保全","図面・測定"];
  const MAP={
    academic:{
      "生産の基本":"安全・5S",
      "設備の日常保全":"自主保全・日常保全",
      "効率化とロス":"効率化・ロス",
      "改善・解析":"改善・解析",
      "設備保全の基礎":"設備保全"
    },
    practical:{
      "安全・環境":"安全・5S",
      "TPM・5S":"安全・5S",
      "自主保全":"自主保全・日常保全",
      "効率化とロス":"効率化・ロス",
      "改善・解析":"改善・解析",
      "設備保全":"設備保全",
      "図面・測定":"図面・測定"
    }
  };

  function safeNumber(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function rate(c,t){return t?Math.round(c/t*100):null;}
  function emptyThemes(){return Object.fromEntries(THEMES.map(x=>[x,{c:0,t:0}]));}

  function aggregateCats(cats,type){
    const out=emptyThemes(),map=MAP[type]||{};
    Object.entries(cats||{}).forEach(([cat,val])=>{
      const theme=map[cat];if(!theme)return;
      out[theme].c+=safeNumber(val&&val.c);
      out[theme].t+=safeNumber(val&&val.t);
    });
    return out;
  }

  function mergeThemes(...maps){
    const out=emptyThemes();
    maps.forEach(m=>THEMES.forEach(theme=>{
      out[theme].c+=safeNumber(m&&m[theme]&&m[theme].c);
      out[theme].t+=safeNumber(m&&m[theme]&&m[theme].t);
    }));
    return out;
  }

  function themeRows(themes){
    return THEMES.map(theme=>{
      const x=(themes||{})[theme]||{c:0,t:0};
      return {theme,c:safeNumber(x.c),t:safeNumber(x.t),rate:rate(safeNumber(x.c),safeNumber(x.t))};
    });
  }

  function weakestTheme(themes,minAnswers=5){
    const rows=themeRows(themes).filter(x=>x.t>=minAnswers&&x.rate!==null);
    return rows.sort((a,b)=>a.rate-b.rate)[0]||null;
  }

  function strongestTheme(themes,minAnswers=5){
    const rows=themeRows(themes).filter(x=>x.t>=minAnswers&&x.rate!==null);
    return rows.sort((a,b)=>b.rate-a.rate)[0]||null;
  }

  function summarizeYearHistory(history){
    const out={};
    (history||[]).forEach(item=>{
      const year=Number(item.year);if(!year)return;
      if(!out[year])out[year]={year,attempts:0,latest:null,best:null,previous:null};
      const g=out[year];
      g.attempts++;
      g.previous=g.latest;
      g.latest=safeNumber(item.rate);
      g.best=g.best===null?g.latest:Math.max(g.best,g.latest);
    });
    return out;
  }

  function bestPastScore(history){
    const values=(history||[]).map(x=>safeNumber(x.rate)).filter(x=>x>=0);
    return values.length?Math.max(...values):null;
  }

  function latestPastImprovement(history){
    if(!Array.isArray(history)||history.length<2)return null;
    const byYear={};
    history.forEach(x=>(byYear[x.year]||(byYear[x.year]=[])).push(x));
    let best=null;
    Object.values(byYear).forEach(items=>{
      if(items.length<2)return;
      const a=safeNumber(items[items.length-1].rate)-safeNumber(items[items.length-2].rate);
      if(best===null||a>best)best=a;
    });
    return best;
  }

  function daysUntil(dateString,now=new Date()){
    if(!dateString)return null;
    const target=new Date(dateString+"T00:00:00");
    if(Number.isNaN(target.getTime()))return null;
    const base=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.ceil((target-base)/86400000);
  }

  function coachMessage(summary){
    const academicTotal=safeNumber(summary.academicTotal);
    const practicalTotal=safeNumber(summary.practicalTotal);
    const total=academicTotal+practicalTotal;
    const weak=weakestTheme(summary.themes||{},8);
    const strong=strongestTheme(summary.themes||{},8);
    const improvement=summary.improvement==null?null:safeNumber(summary.improvement);
    const best=summary.bestPast==null?null:safeNumber(summary.bestPast);

    if(total<20){
      return {tone:"info",title:"まずはデータを集めよう",
        text:"あと少し問題を解くと、あなた専用の苦手傾向が見えるようになります。",
        action:"今日は学科10問か実技1課題から始めましょう。"};
    }
    if(improvement!==null&&improvement>=10){
      return {tone:"good",title:`前回より${improvement}点アップ！`,
        text:"過去問の点数が大きく伸びています。復習が結果につながっています。",
        action:"間違えた問題だけ確認して、次の年度にも挑戦しましょう。"};
    }
    if(best!==null&&best>=85){
      return {tone:"good",title:`過去問ベスト ${best}点`,
        text:"かなり仕上がってきています。高得点を安定して取れる状態を目指しましょう。",
        action:weak?`${weak.theme}を少し補強すると、さらに安定します。`:"誤答だけを短時間で復習しましょう。"};
    }
    if(weak&&weak.rate<65){
      return {tone:"warn",title:`${weak.theme}を重点復習`,
        text:`総合正答率は${weak.rate}%です。ここを伸ばすと全体点が上がりやすいです。`,
        action:`今日は「${weak.theme}」を学科10問＋実技1課題やってみましょう。`};
    }
    if(strong&&strong.rate>=85){
      return {tone:"good",title:`${strong.theme}が得意です`,
        text:`${strong.rate}%まで取れています。強みとして定着してきました。`,
        action:"得意分野を維持しながら、次に低い分野を10問だけ復習しましょう。"};
    }
    return {tone:"info",title:"いいペースです",
      text:"学科と実技の両方から学習データがたまってきています。",
      action:weak?`次は「${weak.theme}」を10分だけ復習しましょう。`:"今日も10問だけ続けてみましょう。"};
  }

  function badges(summary){
    const out=[];
    const total=safeNumber(summary.academicTotal);
    const streak=safeNumber(summary.streak);
    const best=summary.bestPast==null?null:safeNumber(summary.bestPast);
    const practicalRate=summary.practicalRate==null?null:safeNumber(summary.practicalRate);
    const years=new Set((summary.yearHistory||[]).map(x=>Number(x.year)));
    const improvement=summary.improvement==null?null:safeNumber(summary.improvement);

    if(total>=100)out.push({id:"q100",icon:"💯",label:"100問達成"});
    if(total>=500)out.push({id:"q500",icon:"🏃",label:"500問達成"});
    if(total>=1000)out.push({id:"q1000",icon:"🏆",label:"1000問達成"});
    if(streak>=7)out.push({id:"streak7",icon:"🔥",label:"7日連続"});
    if(best!==null&&best>=80)out.push({id:"past80",icon:"🎓",label:"過去問80点突破"});
    if(years.size>=7)out.push({id:"allYears",icon:"🗓️",label:"7年度挑戦"});
    if(practicalRate!==null&&practicalRate>=80)out.push({id:"prac80",icon:"🛠️",label:"実技80%突破"});
    if(improvement!==null&&improvement>=10)out.push({id:"up10",icon:"📈",label:"10点アップ"});
    return out;
  }

  const API={THEMES,MAP,rate,aggregateCats,mergeThemes,themeRows,weakestTheme,strongestTheme,
    summarizeYearHistory,bestPastScore,latestPastImprovement,daysUntil,coachMessage,badges};
  root.SKIMARU_COACH=API;
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof window!=="undefined"?window:globalThis);
