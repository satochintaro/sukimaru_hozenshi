"use strict";
(() => {
  const C=window.SKIMARU_COACH;if(!C)return;
  const CLOUD=window.SKIMARU_SUPABASE||{};
  let combinedRows=[],combinedGroups=[],examDate="",combinedActive=false;

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function parse(v,f){if(v==null)return f;if(typeof v==="string"){try{return JSON.parse(v);}catch(e){return f;}}return v;}
  function dateText(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("ja-JP",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
  function pct(c,t){return t?Math.round(c/t*100):null;}
  async function token(){
    if(typeof ensureSession==="function"&&!(await ensureSession()))throw new Error("認証が必要です");
    if(typeof session==="undefined"||!session?.access_token)throw new Error("認証が必要です");
    return session.access_token;
  }
  async function getRawRows(){
    const t=await token();
    const endpoint=`${CLOUD.url}/rest/v1/${encodeURIComponent(CLOUD.table||"exam_results")}?select=*&order=created_at.desc&limit=5000`;
    const r=await fetch(endpoint,{headers:{apikey:CLOUD.publishableKey,Authorization:`Bearer ${t}`},cache:"no-store"});
    if(!r.ok)throw new Error("提出データを取得できません");
    return await r.json();
  }
  function normalizeRaw(x){
    const raw=parse(x.raw_result,{});
    const cats=parse(x.category_results,raw.cats||{});
    const total=Number(x.total_questions??raw.total)||0,correct=Number(x.correct_count??x.score??raw.correct)||0;
    return {
      id:x.submission_id||x.id,
      examType:raw.examType==="practical"?"practical":"academic",
      playerNo:String(x.player_no||raw.playerNo||"").trim(),
      name:x.user_name||raw.name||"(未記入)",
      total,correct,rate:pct(correct,total)||0,cats,
      raw,at:x.created_at||x.submitted_at||raw.sentAt
    };
  }
  function latest(items,type){return items.filter(x=>x.examType===type).sort((a,b)=>new Date(b.at)-new Date(a.at))[0]||null;}
  function groupRows(rows){
    const map=new Map();
    rows.forEach(r=>{
      const key=r.playerNo||`LEGACY:${r.name}`;
      if(!map.has(key))map.set(key,{key,playerNo:r.playerNo||"旧データ",name:r.name,rows:[]});
      map.get(key).rows.push(r);
    });
    return [...map.values()].map(g=>{
      g.academic=latest(g.rows,"academic");g.practical=latest(g.rows,"practical");
      const aThemes=C.aggregateCats(g.academic?.cats||{},"academic");
      const pThemes=C.aggregateCats(g.practical?.cats||{},"practical");
      g.themes=C.mergeThemes(aThemes,pThemes);
      const total=(g.academic?.total||0)+(g.practical?.total||0),correct=(g.academic?.correct||0)+(g.practical?.correct||0);
      g.overall=pct(correct,total);
      g.weak=C.weakestTheme(g.themes,5);
      g.last=[g.academic?.at,g.practical?.at].filter(Boolean).sort().pop()||null;
      return g;
    }).sort((a,b)=>new Date(b.last||0)-new Date(a.last||0));
  }

  async function loadExamDate(){
    try{
      const t=await token(),r=await fetch(`${CLOUD.url}/rest/v1/coach_settings?select=key,value&key=eq.exam_date&limit=1`,{headers:{apikey:CLOUD.publishableKey,Authorization:`Bearer ${t}`},cache:"no-store"});
      if(r.ok){const j=await r.json();examDate=j[0]?.value||"";}
    }catch(e){}
  }
  async function saveExamDate(value){
    const t=await token();
    const r=await fetch(`${CLOUD.url}/rest/v1/coach_settings?on_conflict=key`,{
      method:"POST",
      headers:{apikey:CLOUD.publishableKey,Authorization:`Bearer ${t}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify([{key:"exam_date",value}])
    });
    if(!r.ok)throw new Error(await r.text().catch(()=>"試験日を保存できません"));
    examDate=value;
  }
  async function sendMessage(playerNo,message){
    if(!String(message||"").trim())throw new Error("メッセージを入力してください");
    const t=await token();
    const r=await fetch(`${CLOUD.url}/rest/v1/player_messages`,{
      method:"POST",
      headers:{apikey:CLOUD.publishableKey,Authorization:`Bearer ${t}`,"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify({player_no:playerNo,message:String(message).trim().slice(0,500)})
    });
    if(!r.ok)throw new Error(await r.text().catch(()=>"メッセージを送信できません"));
  }

  function themeBars(themes){
    return C.themeRows(themes).map(x=>`<div class="coach-manager-bar"><span>${esc(x.theme)}</span><i><em style="width:${x.rate||0}%"></em></i><b>${x.rate==null?"—":x.rate+"%"}</b><small>${x.t}問</small></div>`).join("");
  }
  function yearHistoryHtml(g){
    const history=g.academic?.raw?.coach?.pastYearHistory||[];
    const map=C.summarizeYearHistory(history);
    return [2019,2020,2021,2022,2023,2024,2025].map(y=>{
      const x=map[y];
      if(!x)return `<div class="coach-manager-year"><b>${y}</b><span>未提出</span></div>`;
      return `<div class="coach-manager-year"><b>${y}</b><strong>${x.latest}点</strong><span>最高 ${x.best} / ${x.attempts}回${x.previous==null?"":` / ${x.latest-x.previous>=0?"+":""}${x.latest-x.previous}pt`}</span></div>`;
    }).join("");
  }

  function settingsHtml(){
    return `<div class="manager-section coach-manager-settings">
      <div class="manager-section-head"><div><h2>学習コーチ設定</h2><p>試験日と全員向けメッセージを設定します。</p></div></div>
      <div class="coach-manager-controls">
        <label>試験日<input type="date" id="coach-exam-date" value="${esc(examDate)}"></label>
        <button type="button" class="btn-g" id="coach-save-date">試験日を保存</button>
      </div>
      <div class="coach-manager-broadcast">
        <textarea id="coach-broadcast-text" maxlength="500" placeholder="全プレイヤーへ表示するメッセージ"></textarea>
        <button type="button" class="btn-g" id="coach-send-all">全員へ送信</button>
      </div>
    </div>`;
  }

  function renderCombined(){
    const B=document.getElementById("ad-rep");if(!B)return;
    document.querySelectorAll("[data-analysis-mode]").forEach(b=>b.classList.toggle("active",b.dataset.analysisMode==="combined"));
    if(!combinedGroups.length){B.innerHTML=settingsHtml()+`<div class="manager-empty"><div>📭</div><b>総合分析データがありません</b><p>学科または実技の提出を待ってください。</p></div>`;bindSettings();return;}
    const both=combinedGroups.filter(g=>g.academic&&g.practical).length;
    const avg=combinedGroups.filter(g=>g.overall!==null).reduce((s,g,_,arr)=>s+(g.overall||0)/arr.length,0);
    let h=settingsHtml()+`<div class="manager-stat-grid">
      <div class="manager-stat-card"><span>総合対象</span><b>${combinedGroups.length}人</b></div>
      <div class="manager-stat-card"><span>学科＋実技提出</span><b>${both}人</b></div>
      <div class="manager-stat-card"><span>総合平均</span><b>${Math.round(avg||0)}%</b></div>
      <div class="manager-stat-card"><span>試験日</span><b>${examDate||"未設定"}</b></div>
    </div>`;
    h+=`<div class="manager-section"><div class="manager-section-head"><div><h2>プレイヤー総合一覧</h2><p>学科・実技を同じPlayerNoでまとめて表示します。</p></div></div><div class="player-table-wrap"><table class="player-table"><thead><tr><th>No.</th><th>表示名</th><th>学科</th><th>実技</th><th>総合</th><th>重点</th><th>最終</th></tr></thead><tbody>`;
    combinedGroups.forEach((g,i)=>h+=`<tr class="player-row coach-combined-row" data-coach-group="${i}" tabindex="0"><td><b>${esc(g.playerNo)}</b></td><td>${esc(g.name)}</td><td><strong>${g.academic?g.academic.rate+"%":"—"}</strong></td><td><strong>${g.practical?g.practical.rate+"%":"—"}</strong></td><td><strong>${g.overall==null?"—":g.overall+"%"}</strong></td><td>${g.weak?esc(g.weak.theme):"—"}</td><td>${dateText(g.last)}</td></tr>`);
    h+="</tbody></table></div></div>";
    B.innerHTML=h;bindSettings();
    B.querySelectorAll(".coach-combined-row").forEach(row=>{const open=()=>openCombinedDetail(combinedGroups[Number(row.dataset.coachGroup)]);row.addEventListener("click",open);row.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});});
  }

  function bindSettings(){
    document.getElementById("coach-save-date")?.addEventListener("click",async()=>{
      const v=document.getElementById("coach-exam-date").value;
      try{await saveExamDate(v);if(typeof notify==="function")notify("試験日を保存しました");renderCombined();}catch(e){if(typeof notify==="function")notify("試験日を保存できません");}
    });
    document.getElementById("coach-send-all")?.addEventListener("click",async()=>{
      const t=document.getElementById("coach-broadcast-text");
      try{await sendMessage("ALL",t.value);t.value="";if(typeof notify==="function")notify("全員へ送信しました");}catch(e){if(typeof notify==="function")notify("送信できません");}
    });
  }

  function openCombinedDetail(g){
    const modal=document.getElementById("player-detail"),body=document.getElementById("player-detail-body");if(!modal||!body)return;
    const best=C.bestPastScore(g.academic?.raw?.coach?.pastYearHistory||[]);
    let h=`<div class="detail-head"><div><span class="detail-no">${esc(g.playerNo)}</span><h2>${esc(g.name)}</h2><p>学科・実技 総合分析</p></div><strong>${g.overall==null?"—":g.overall}<small>${g.overall==null?"":"%"}</small></strong></div>
      <div class="detail-stat-grid">
        <div class="manager-stat-card"><span>学科</span><b>${g.academic?g.academic.rate+"%":"—"}</b></div>
        <div class="manager-stat-card"><span>実技</span><b>${g.practical?g.practical.rate+"%":"—"}</b></div>
        <div class="manager-stat-card"><span>過去問ベスト</span><b>${best==null?"—":best+"点"}</b></div>
        <div class="manager-stat-card"><span>重点分野</span><b>${g.weak?esc(g.weak.theme):"—"}</b></div>
      </div>
      <div class="manager-section"><h2>学科＋実技 共通テーマ</h2>${themeBars(g.themes)}</div>
      <div class="manager-section"><h2>年度別 過去問成績</h2><div class="coach-manager-years">${yearHistoryHtml(g)}</div></div>
      <div class="manager-section coach-message-compose"><h2>このプレイヤーへメッセージ</h2>
        <textarea id="coach-player-message" maxlength="500" placeholder="例：設備保全が伸びています。今週は2022年度を1回やってみましょう。"></textarea>
        <button type="button" class="btn-g" id="coach-send-player">送信</button>
      </div>`;
    body.innerHTML=h;
    body.querySelector("#coach-send-player")?.addEventListener("click",async()=>{
      const t=body.querySelector("#coach-player-message");
      try{await sendMessage(g.playerNo,t.value);t.value="";if(typeof notify==="function")notify(`${g.name}へ送信しました`);}catch(e){if(typeof notify==="function")notify("送信できません");}
    });
    modal.classList.add("show");modal.setAttribute("aria-hidden","false");
  }

  async function activateCombined(){
    combinedActive=true;
    try{
      document.getElementById("ad-rep").innerHTML='<div class="manager-empty"><div>⏳</div><b>総合データを集計中</b></div>';
      const raw=await getRawRows();combinedRows=raw.map(normalizeRaw);combinedGroups=groupRows(combinedRows);await loadExamDate();renderCombined();
    }catch(e){
      document.getElementById("ad-rep").innerHTML=`<div class="manager-empty"><div>⚠</div><b>総合分析を読み込めません</b><p>${esc(e.message||"")}</p></div>`;
    }
  }


  // 既存の15秒自動更新でも総合画面を維持する。
  if(typeof render==="function"){
    const baseRender=render;
    render=function(){
      if(combinedActive){renderCombined();return;}
      return baseRender.apply(this,arguments);
    };
  }
  if(typeof setAnalysisMode==="function"){
    const baseSetAnalysisMode=setAnalysisMode;
    setAnalysisMode=function(mode){
      combinedActive=false;
      return baseSetAnalysisMode.apply(this,arguments);
    };
  }
  document.getElementById("refresh")?.addEventListener("click",()=>{if(combinedActive)activateCombined();});

  const tabs=document.querySelector(".manager-mode-tabs");
  if(tabs){tabs.querySelectorAll('[data-analysis-mode="academic"],[data-analysis-mode="practical"]').forEach(b=>b.addEventListener("click",()=>{combinedActive=false;}));}
  if(tabs&&!tabs.querySelector('[data-analysis-mode="combined"]')){
    const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.dataset.analysisMode="combined";b.textContent="総合分析";
    tabs.insertBefore(b,tabs.firstChild);b.addEventListener("click",activateCombined);
  }
  window.SKIMARU_COACH_MANAGER={activateCombined,sendMessage,saveExamDate};
})();
