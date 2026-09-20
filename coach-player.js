"use strict";
(() => {
  const C=window.SKIMARU_COACH;if(!C)return;
  const COACH_KEY="skimaruCoachDataV1";
  const REMOTE_KEY="skimaruCoachRemoteV1";
  const ACADEMIC_KEY="skimaruData";
  const PRACTICAL_KEY="skimaruPracticalDataTestV1";
  const CLOUD=window.SKIMARU_SUPABASE||{};
  const current=document.body.dataset.learningMode;

  function parse(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||"null");return x&&typeof x==="object"?x:fallback;}catch(e){return fallback;}}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function coachData(){
    const d=parse(COACH_KEY,{});
    d.pastYearHistory=Array.isArray(d.pastYearHistory)?d.pastYearHistory:[];
    d.practicalHistory=Array.isArray(d.practicalHistory)?d.practicalHistory:[];
    d.practicalCats=d.practicalCats&&typeof d.practicalCats==="object"?d.practicalCats:{};
    return d;
  }
  function saveCoach(d){save(COACH_KEY,d);}
  function academicProfile(){return parse(ACADEMIC_KEY,{});}
  function practicalData(){return parse(PRACTICAL_KEY,{});}
  function playerNo(){return String(academicProfile().playerNo||"").trim();}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  function academicCats(){
    const out={};
    if(typeof QUESTIONS==="undefined"||typeof U==="undefined")return out;
    QUESTIONS.forEach(q=>{
      const s=U.stats&&U.stats[q.id];if(!s)return;
      if(!out[q.category])out[q.category]={c:0,t:0};
      out[q.category].c+=Number(s.c)||0;out[q.category].t+=(Number(s.c)||0)+(Number(s.w)||0);
    });
    return out;
  }

  function updatePracticalCats(){
    if(typeof TASKS==="undefined"||typeof P==="undefined")return {};
    const cats={};
    TASKS.forEach(task=>{
      const a=P.attempts&&P.attempts[task.id];if(!a)return;
      if(!cats[task.category])cats[task.category]={c:0,t:0};
      cats[task.category].c+=Number(a.lastCorrect)||0;
      cats[task.category].t+=Number(a.lastTotal)||0;
    });
    const d=coachData();d.practicalCats=cats;saveCoach(d);return cats;
  }

  function combinedSummary(){
    const d=coachData(),profile=academicProfile(),practical=practicalData();
    const ac=C.aggregateCats(academicCats(),"academic");
    const pc=C.aggregateCats(d.practicalCats||{},"practical");
    const themes=C.mergeThemes(ac,pc);
    const pRate=practical.totalBlanks?Math.round((Number(practical.correctBlanks)||0)/(Number(practical.totalBlanks)||1)*100):null;
    const bestPast=C.bestPastScore(d.pastYearHistory);
    const improvement=C.latestPastImprovement(d.pastYearHistory);
    return {
      themes,
      academicTotal:Number(profile.total)||0,
      academicCorrect:Number(profile.correct)||0,
      practicalTotal:Number(practical.totalBlanks)||0,
      practicalRate:pRate,
      streak:Number(profile.streak)||0,
      bestPast,
      improvement,
      yearHistory:d.pastYearHistory
    };
  }

  function remoteData(){return parse(REMOTE_KEY,{examDate:null,messages:[],updatedAt:null});}
  function cloudReady(){return /^https:\/\//.test(CLOUD.url||"")&&String(CLOUD.publishableKey||"").startsWith("sb_publishable_");}
  async function refreshRemote(){
    if(!cloudReady())return;
    const no=playerNo();if(!no)return;
    const headers={apikey:CLOUD.publishableKey};
    const remote=remoteData();
    try{
      const s=await fetch(`${CLOUD.url}/rest/v1/coach_settings?select=key,value&key=eq.exam_date&limit=1`,{headers,cache:"no-store"});
      if(s.ok){const rows=await s.json();remote.examDate=rows[0]?.value||null;}
    }catch(e){}
    try{
      const or=encodeURIComponent(`(player_no.eq.${no},player_no.eq.ALL)`);
      const r=await fetch(`${CLOUD.url}/rest/v1/player_messages?select=id,player_no,message,created_at,expires_at&or=${or}&order=created_at.desc&limit=10`,{headers,cache:"no-store"});
      if(r.ok){
        const now=Date.now(),rows=await r.json();
        remote.messages=rows.filter(x=>!x.expires_at||new Date(x.expires_at).getTime()>now);
      }
    }catch(e){}
    remote.updatedAt=new Date().toISOString();save(REMOTE_KEY,remote);renderCoach();
  }

  function countdownText(date){
    const d=C.daysUntil(date);
    if(d===null)return {big:"—",small:"試験日未設定",tone:""};
    if(d<0)return {big:"終了",small:"試験日を過ぎています",tone:""};
    if(d===0)return {big:"本日",small:"試験日です",tone:"urgent"};
    return {big:`あと ${d}日`,small:d<=7?"仕上げ期間です":d<=30?"過去問中心で仕上げよう":"毎日少しずつ積み上げよう",tone:d<=7?"urgent":""};
  }

  function yearCards(){
    const d=coachData(),map=C.summarizeYearHistory(d.pastYearHistory);
    return [2019,2020,2021,2022,2023,2024,2025].map(y=>{
      const x=map[y];
      if(!x)return `<div class="coach-year"><b>${y}</b><span>未挑戦</span></div>`;
      const diff=x.previous==null?"":`<small class="${x.latest>x.previous?"up":x.latest<x.previous?"down":""}">${x.latest>x.previous?"+":""}${x.latest-x.previous}pt</small>`;
      return `<div class="coach-year"><b>${y}</b><strong>${x.latest}点</strong><span>最高 ${x.best} / ${x.attempts}回 ${diff}</span></div>`;
    }).join("");
  }

  function managerMessages(){
    const msgs=remoteData().messages||[];
    if(!msgs.length)return "";
    return `<div class="coach-messages"><div class="coach-section-title">📩 マネージャーから</div>${msgs.slice(0,3).map(m=>
      `<article><p>${esc(m.message)}</p><small>${new Date(m.created_at).toLocaleDateString("ja-JP")}${m.player_no==="ALL"?"・全員向け":""}</small></article>`).join("")}</div>`;
  }

  function coachPanelHtml(){
    const summary=combinedSummary(),msg=C.coachMessage(summary),badges=C.badges(summary);
    const cd=countdownText(remoteData().examDate);
    const best=summary.bestPast==null?"—":summary.bestPast+"点";
    const pRate=summary.practicalRate==null?"—":summary.practicalRate+"%";
    return `<section class="coach-dashboard" id="coach-dashboard">
      <div class="coach-countdown ${cd.tone}"><span>EXAM COUNTDOWN</span><b>${cd.big}</b><small>${cd.small}</small></div>
      <div class="coach-message ${msg.tone}"><span>💬 今日のコーチ</span><h3>${esc(msg.title)}</h3><p>${esc(msg.text)}</p><strong>${esc(msg.action)}</strong></div>
      <div class="coach-mini-grid">
        <div><span>過去問ベスト</span><b>${best}</b></div>
        <div><span>実技正答率</span><b>${pRate}</b></div>
        <div><span>学科回答</span><b>${summary.academicTotal}問</b></div>
      </div>
      ${badges.length?`<div class="coach-badges">${badges.map(b=>`<span title="${esc(b.label)}">${b.icon}<small>${esc(b.label)}</small></span>`).join("")}</div>`:""}
      <div class="coach-section-title">年度別 過去問成績</div>
      <div class="coach-years">${yearCards()}</div>
      ${managerMessages()}
    </section>`;
  }

  function renderCoach(){
    if(current==="academic"){
      const home=document.querySelector("#sc-home .player-home-pad");
      if(!home)return;
      let panel=document.getElementById("coach-dashboard");
      const html=coachPanelHtml();
      if(panel){
        const box=document.createElement("div");box.innerHTML=html;panel.replaceWith(box.firstElementChild);
      }else{
        const head=home.querySelector(".player-menu-head");
        if(head)head.insertAdjacentHTML("beforebegin",html);else home.insertAdjacentHTML("afterbegin",html);
      }
    }else if(current==="practical"){
      updatePracticalCats();
      const home=document.querySelector("#pt-home .practical-pad");if(!home)return;
      let compact=document.getElementById("coach-practical-summary");
      const s=combinedSummary(),m=C.coachMessage(s),cd=countdownText(remoteData().examDate);
      const html=`<div class="coach-practical-summary" id="coach-practical-summary"><div><span>試験</span><b>${cd.big}</b></div><p><strong>${esc(m.title)}</strong><br>${esc(m.action)}</p></div>`;
      if(compact){const box=document.createElement("div");box.innerHTML=html;compact.replaceWith(box.firstElementChild);}
      else{const hero=home.querySelector(".pt-hero");if(hero)hero.insertAdjacentHTML("beforebegin",html);}
    }
  }

  function recordPastYear(){
    try{
      if(typeof S==="undefined"||S.mode!=="past-year"||!Array.isArray(S.queue)||S.queue.length<90)return;
      const year=window.SKIMARU_YEAR_CORE?.academicYearOf(S.queue[0]);if(!year)return;
      const d=coachData(),rate=Math.round((Number(S.ok)||0)/S.queue.length*100);
      const last=d.pastYearHistory[d.pastYearHistory.length-1];
      if(last&&last.year===year&&last.rate===rate&&Date.now()-new Date(last.at).getTime()<30000)return;
      d.pastYearHistory.push({year,total:S.queue.length,correct:Number(S.ok)||0,rate,at:new Date().toISOString()});
      d.pastYearHistory=d.pastYearHistory.slice(-100);saveCoach(d);
    }catch(e){}
  }

  function recordPracticalRun(){
    try{
      if(typeof P==="undefined"||!P.latestRun)return;
      const run=P.latestRun,d=coachData(),at=run.completedAt||new Date().toISOString();
      if(d.practicalHistory.some(x=>x.at===at))return;
      d.practicalHistory.push({title:run.title,correct:run.correct,total:run.total,rate:run.rate,cats:run.cats||{},at});
      d.practicalHistory=d.practicalHistory.slice(-100);
      d.practicalCats=updatePracticalCats()||d.practicalCats;
      saveCoach(d);
    }catch(e){}
  }

  function enrichYearPage(){
    const map=C.summarizeYearHistory(coachData().pastYearHistory);
    document.querySelectorAll("#year-list .pn").forEach(card=>{
      const year=Number(card.querySelector(".row-t")?.textContent?.match(/\d{4}/)?.[0]);const x=map[year];
      card.querySelector(".coach-year-inline")?.remove();
      if(x)card.insertAdjacentHTML("beforeend",`<div class="coach-year-inline">最新 <b>${x.latest}点</b>　最高 <b>${x.best}点</b>　挑戦 <b>${x.attempts}回</b>${x.previous==null?"":`　前回比 <b>${x.latest-x.previous>=0?"+":""}${x.latest-x.previous}pt</b>`}</div>`);
    });
  }

  if(current==="academic"){
    if(typeof result==="function"){
      const baseResult=result;
      result=function(){recordPastYear();const r=baseResult.apply(this,arguments);renderCoach();return r;};
    }
    if(typeof renderHome==="function"){
      const baseHome=renderHome;
      renderHome=function(){const r=baseHome.apply(this,arguments);requestAnimationFrame(renderCoach);return r;};
    }
    if(typeof build==="function"){
      const baseBuild=build;
      build=function(){
        const r=baseBuild.apply(this,arguments),d=coachData(),s=combinedSummary();
        r.coach={pastYearHistory:d.pastYearHistory,practicalHistory:d.practicalHistory.slice(-20),commonThemes:s.themes,badges:C.badges(s)};
        return r;
      };
    }
    if(typeof showPastYears==="function"){
      const baseYears=showPastYears;
      showPastYears=function(){const r=baseYears.apply(this,arguments);requestAnimationFrame(enrichYearPage);return r;};
    }
  }else if(current==="practical"){
    if(typeof renderPracticalResult==="function"){
      const basePracticalResult=renderPracticalResult;
      renderPracticalResult=function(){const r=basePracticalResult.apply(this,arguments);recordPracticalRun();renderCoach();return r;};
    }
    if(typeof renderPracticalHome==="function"){
      const basePracticalHome=renderPracticalHome;
      renderPracticalHome=function(){const r=basePracticalHome.apply(this,arguments);requestAnimationFrame(renderCoach);return r;};
    }
    updatePracticalCats();
  }

  renderCoach();
  refreshRemote();
  setInterval(refreshRemote,300000);
})();
