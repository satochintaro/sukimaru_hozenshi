"use strict";
(() => {
  const C=window.SKIMARU_COACH||{};
  let managerScope="overall";
  let managerExamMode="academic";
  let selectedPlayerKey="";
  let coachExamDate="";

  const labelMode=()=>managerExamMode==="academic"?"学科":managerExamMode==="practical"?"実技":"総合";
  const safeEsc=v=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pct=(c,t)=>t?Math.round(c/t*100):null;

  function visibleAllRows(){
    try{return rows.filter(r=>!hiddenPlayers.has(rowPlayerKey(r)));}catch(e){return Array.isArray(rows)?rows:[];}
  }
  function latest(list,type){
    return list.filter(x=>x.examType===type).sort((a,b)=>new Date(b.receivedAt||b.sentAt)-new Date(a.receivedAt||a.sentAt))[0]||null;
  }
  function allPeople(){
    const map=new Map();
    visibleAllRows().forEach(r=>{
      const key=r.playerNo||`LEGACY:${r.name}`;
      if(!map.has(key))map.set(key,{key,playerNo:r.playerNo||"旧データ",name:r.name,rows:[]});
      map.get(key).rows.push(r);
    });
    return [...map.values()].map(g=>{
      g.academic=latest(g.rows,"academic");
      g.practical=latest(g.rows,"practical");
      g.last=[g.academic?.receivedAt||g.academic?.sentAt,g.practical?.receivedAt||g.practical?.sentAt].filter(Boolean).sort().pop()||null;
      const t=(g.academic?.total||0)+(g.practical?.total||0);
      const c=(g.academic?.correct||0)+(g.practical?.correct||0);
      g.overall=pct(c,t);
      const at=C.aggregateCats?C.aggregateCats(g.academic?.cats||{},"academic"):{};
      const pt=C.aggregateCats?C.aggregateCats(g.practical?.cats||{},"practical"):{};
      g.themes=C.mergeThemes?C.mergeThemes(at,pt):{};
      g.weak=C.weakestTheme?C.weakestTheme(g.themes,5):null;
      return g;
    }).sort((a,b)=>new Date(b.last||0)-new Date(a.last||0));
  }

  function peopleForMode(){
    const people=allPeople();
    if(managerExamMode==="academic")return people.filter(g=>g.academic);
    if(managerExamMode==="practical")return people.filter(g=>g.practical);
    return people.filter(g=>g.academic||g.practical);
  }

  function syncAcademicMode(){
    if(managerExamMode==="combined")return;
    analysisMode=managerExamMode;
    buildGroups();
    setConnection();
  }

  function stat(label,value,sub=""){
    return `<div class="manager-stat-card compact-stat"><span>${safeEsc(label)}</span><b>${safeEsc(value)}</b>${sub?`<small>${safeEsc(sub)}</small>`:""}</div>`;
  }
  function simpleBar(label,value,sample=""){
    const v=value==null?0:Math.max(0,Math.min(100,value));
    return `<div class="mgr-simple-bar"><span>${safeEsc(label)}</span><i><em style="width:${v}%"></em></i><b>${value==null?"—":value+"%"}</b>${sample?`<small>${safeEsc(sample)}</small>`:""}</div>`;
  }

  function weakestCategories(row,type){
    const subjects=type==="practical"?PRACTICAL_SUBJ:SUBJ;
    return subjects.map(cat=>{
      const x=row?.cats?.[cat]||{},t=Number(x.t)||0,c=Number(x.c)||0;
      return {label:cat,rate:t?Math.round(c/t*100):null,t};
    }).filter(x=>x.t>0).sort((a,b)=>(a.rate??999)-(b.rate??999));
  }

  function overallAdvice(title,rate,type,sample){
    if(rate==null)return {title:"まだ分析データが不足しています",body:"回答データが増えると、優先して教育する分野を自動で絞り込みます。",tone:"info"};
    if(rate<60)return {title:`${title}を最優先でフォロー`,body:`全体正答率 ${rate}% 。まず基本事項を短時間で確認し、代表問題を5問→翌日に再確認する流れがおすすめです。`,tone:"danger"};
    if(rate<75)return {title:`${title}を重点補強`,body:`全体正答率 ${rate}% 。15分程度のミニ教育と誤答問題の反復を組み合わせると定着を確認しやすくなります。`,tone:"warn"};
    return {title:`${title}は概ね良好`,body:`全体正答率 ${rate}% 。維持学習を続けながら、次に低い分野へ教育時間を移す段階です。`,tone:"good"};
  }

  function renderOverallSingle(type){
    syncAcademicMode();
    const A=analyze();
    const label=type==="academic"?"学科":"実技";
    const weakest=[...A.catData].filter(x=>x.sample>0).sort((a,b)=>a.value-b.value)[0]||null;
    const advice=overallAdvice(weakest?.label||label,weakest?.value??null,type,weakest?.sample||0);
    const improved=groups.filter(g=>g.changePrev>0).length;

    let h=`<div class="mgr-page-head"><div><span>OVERALL</span><h2>${label}・全体分析</h2><p>全員の傾向だけを表示します。個人の内容は「個人別分析」に分離しました。</p></div></div>`;
    h+=`<div class="manager-stat-grid mgr-summary-grid">${stat("対象",groups.length+"人")}${stat("最新平均",A.avg+"%")}${stat("提出履歴",visibleRows().length+"件")}${stat("前回より成長",improved+"人")}</div>`;

    h+=`<div class="mgr-focus-grid">
      <section class="manager-section mgr-focus weak-focus">
        <div class="mgr-section-title"><span>📉</span><div><h2>全体の苦手分野</h2><p>最新提出を集計した優先順位</p></div></div>
        ${A.catData.filter(x=>x.sample>0).sort((a,b)=>a.value-b.value).slice(0,5).map(x=>simpleBar(x.label,x.value,`${x.sample}回答`)).join("")||'<p class="manager-empty-small">まだ分析できる回答がありません。</p>'}
      </section>
      <section class="manager-section mgr-focus ai-focus ${advice.tone}">
        <div class="mgr-section-title"><span>🧠</span><div><h2>全体向けAI教育</h2><p>次に実施する教育を1つに絞って表示</p></div></div>
        <div class="mgr-ai-main"><small>今週の優先</small><strong>${safeEsc(advice.title)}</strong><p>${safeEsc(advice.body)}</p></div>
      </section>
    </div>`;

    if(A.weak.length){
      h+=`<details class="manager-section mgr-details"><summary>苦手問題 TOP${Math.min(5,A.weak.length)} を見る</summary><div class="weak-list">`;
      A.weak.slice(0,5).forEach((item,i)=>h+=`<div class="weak-card"><span class="weak-rank">${i+1}</span><div><b>${safeEsc(item.text)}</b><p>${safeEsc(item.cat)} ／ ${item.n}名が要注意</p></div></div>`);
      h+="</div></details>";
    }
    h+=`<details class="manager-section mgr-details"><summary>分野別の詳細グラフを見る</summary><div class="manager-chart wide">${svgBars(A.catData)}</div></details>`;
    return h;
  }

  function aggregateRawCats(records){
    const out={};
    records.forEach(row=>{
      Object.entries(row?.cats||{}).forEach(([cat,x])=>{
        if(!out[cat])out[cat]={c:0,t:0};
        out[cat].c+=Number(x?.c)||0;out[cat].t+=Number(x?.t)||0;
      });
    });
    return out;
  }

  function renderOverallCombined(){
    const people=allPeople();
    const latestA=people.map(g=>g.academic).filter(Boolean);
    const latestP=people.map(g=>g.practical).filter(Boolean);
    const aAvg=latestA.length?Math.round(latestA.reduce((s,r)=>s+r.rate,0)/latestA.length):0;
    const pAvg=latestP.length?Math.round(latestP.reduce((s,r)=>s+r.rate,0)/latestP.length):0;
    const both=people.filter(g=>g.academic&&g.practical).length;

    const aTheme=C.aggregateCats?C.aggregateCats(aggregateRawCats(latestA),"academic"):{};
    const pTheme=C.aggregateCats?C.aggregateCats(aggregateRawCats(latestP),"practical"):{};
    const themes=C.mergeThemes?C.mergeThemes(aTheme,pTheme):{};
    const themeRows=C.themeRows?C.themeRows(themes).filter(x=>x.t>0).sort((a,b)=>(a.rate??999)-(b.rate??999)):[];
    const weak=themeRows[0]||null;
    const advice=overallAdvice(weak?.theme||"共通テーマ",weak?.rate??null,"combined",weak?.t||0);

    let h=`<div class="mgr-page-head"><div><span>OVERALL</span><h2>学科＋実技・全体分析</h2><p>学科と実技を共通テーマでまとめて、全体教育だけを表示します。</p></div></div>`;
    h+=`<div class="manager-stat-grid mgr-summary-grid">${stat("対象",people.length+"人")}${stat("両方提出",both+"人")}${stat("学科平均",aAvg+"%")}${stat("実技平均",pAvg+"%")}</div>`;
    h+=`<div class="mgr-focus-grid">
      <section class="manager-section mgr-focus weak-focus">
        <div class="mgr-section-title"><span>🎯</span><div><h2>全体の共通弱点</h2><p>学科＋実技を同じテーマで集計</p></div></div>
        ${themeRows.slice(0,6).map(x=>simpleBar(x.theme,x.rate,`${x.t}回答`)).join("")||'<p class="manager-empty-small">共通分析データがまだありません。</p>'}
      </section>
      <section class="manager-section mgr-focus ai-focus ${advice.tone}">
        <div class="mgr-section-title"><span>🧠</span><div><h2>全体向けAI教育</h2><p>学科・実技を横断した教育提案</p></div></div>
        <div class="mgr-ai-main"><small>今週の優先</small><strong>${safeEsc(advice.title)}</strong><p>${safeEsc(advice.body)}</p></div>
      </section>
    </div>`;
    return h;
  }

  function playerPicker(people){
    if(!people.length)return "";
    if(!selectedPlayerKey||!people.some(p=>p.key===selectedPlayerKey))selectedPlayerKey=people[0].key;
    return `<div class="manager-section mgr-player-picker">
      <label for="mgr-player-select"><span>PLAYER</span>確認するプレイヤー</label>
      <select id="mgr-player-select">${people.map(p=>`<option value="${safeEsc(p.key)}"${p.key===selectedPlayerKey?" selected":""}>${safeEsc(p.playerNo)} ｜ ${safeEsc(p.name)}</option>`).join("")}</select>
    </div>`;
  }

  function historyForPerson(person,type){
    return person.rows.filter(r=>r.examType===type).sort((a,b)=>new Date(a.receivedAt||a.sentAt)-new Date(b.receivedAt||b.sentAt));
  }

  function renderIndividualSingle(type){
    const people=peopleForMode();
    if(!people.length)return `<div class="manager-empty"><div>📭</div><b>${labelMode()}の個人データがありません</b></div>`;
    if(!selectedPlayerKey||!people.some(p=>p.key===selectedPlayerKey))selectedPlayerKey=people[0].key;
    const p=people.find(x=>x.key===selectedPlayerKey);
    const row=type==="academic"?p.academic:p.practical;
    const hist=historyForPerson(p,type);
    const prev=hist.length>1?hist.at(-2):null;
    const best=hist.length?Math.max(...hist.map(x=>x.rate)):row.rate;
    const weak=weakestCategories(row,type);
    const advice=individualAdvice(row);
    const label=type==="academic"?"学科":"実技";
    const unit=type==="academic"?"問":"空欄";

    let h=playerPicker(people);
    h+=`<div class="mgr-page-head person"><div><span>PERSONAL</span><h2>${safeEsc(p.name)}・${label}</h2><p>${safeEsc(p.playerNo)} ／ 最終 ${fmtDate(row.receivedAt||row.sentAt)}</p></div></div>`;
    h+=`<div class="manager-stat-grid mgr-summary-grid">${stat("最新",row.rate+"%")}${stat("最高",best+"%")}${stat("前回比",prev?signed(row.rate-prev.rate):"—")}${stat("回答数",row.total+unit)}</div>`;

    h+=`<div class="mgr-focus-grid">
      <section class="manager-section mgr-focus weak-focus">
        <div class="mgr-section-title"><span>📉</span><div><h2>この人の苦手分野</h2><p>弱い順に表示</p></div></div>
        ${weak.slice(0,5).map(x=>simpleBar(x.label,x.rate,`${x.t}回答`)).join("")||'<p class="manager-empty-small">まだ分野別データがありません。</p>'}
      </section>
      <section class="manager-section mgr-focus ai-focus ${safeEsc(advice.cls||"info")}">
        <div class="mgr-section-title"><span>🤖</span><div><h2>この人向けAI教育</h2><p>次にやることだけを表示</p></div></div>
        <div class="mgr-ai-main"><small>${safeEsc(advice.level)}</small><strong>${safeEsc(weak[0]?.label||"学習継続")}</strong><p>${safeEsc(advice.text)}</p></div>
      </section>
    </div>`;

    if((row.alerts||[]).length){
      h+=`<details class="manager-section mgr-details"><summary>この人の要注意問題 ${row.alerts.length}件</summary><div class="weak-list">${row.alerts.slice(0,10).map((x,i)=>`<div class="weak-card"><span class="weak-rank">${i+1}</span><div><b>${safeEsc(x.text||`問題 ${x.id||""}`)}</b><p>${safeEsc(x.cat||"")}</p></div></div>`).join("")}</div></details>`;
    }
    h+=`<details class="manager-section mgr-details"><summary>提出履歴 ${hist.length}回を見る</summary><div class="history-list">${[...hist].reverse().map(r=>`<div class="history-item"><div><b>${fmtDate(r.receivedAt||r.sentAt)}</b><span>${r.correct}/${r.total}${unit}正解</span></div><strong>${r.rate}%</strong></div>`).join("")}</div></details>`;
    return h;
  }

  function combinedPersonAdvice(p,weak){
    if(!p.academic||!p.practical)return {tone:"info",title:"もう一方のデータも集める",body:"学科と実技の両方が揃うと、共通の弱点をより正確に判定できます。"};
    if(weak&&weak.rate<65)return {tone:"warn",title:`${weak.theme}を集中フォロー`,body:`学科・実技を合わせた共通テーマで ${weak.rate}% 。同じテーマを学科5問→実技1課題の順で続けて復習すると関連づけやすくなります。`};
    if((p.overall??0)>=85)return {tone:"good",title:"学科・実技とも良い状態",body:"現在は大きな弱点が少ないため、年度別過去問と実技を交互に回して定着を維持します。"};
    return {tone:"info",title:"一番弱い共通テーマから1つずつ",body:"学科と実技を別々に詰め込まず、共通テーマ単位で短時間学習を繰り返す構成が向いています。"};
  }

  function renderIndividualCombined(){
    const people=peopleForMode();
    if(!people.length)return `<div class="manager-empty"><div>📭</div><b>個人データがありません</b></div>`;
    if(!selectedPlayerKey||!people.some(p=>p.key===selectedPlayerKey))selectedPlayerKey=people[0].key;
    const p=people.find(x=>x.key===selectedPlayerKey);
    const themes=C.themeRows?C.themeRows(p.themes).filter(x=>x.t>0).sort((a,b)=>(a.rate??999)-(b.rate??999)):[];
    const weak=themes[0]||null;
    const advice=combinedPersonAdvice(p,weak);

    let h=playerPicker(people);
    h+=`<div class="mgr-page-head person"><div><span>PERSONAL</span><h2>${safeEsc(p.name)}・総合</h2><p>${safeEsc(p.playerNo)} ／ 学科＋実技</p></div></div>`;
    h+=`<div class="manager-stat-grid mgr-summary-grid">${stat("学科",p.academic?p.academic.rate+"%":"—")}${stat("実技",p.practical?p.practical.rate+"%":"—")}${stat("総合",p.overall==null?"—":p.overall+"%")}${stat("共通弱点",weak?.theme||"—")}</div>`;
    h+=`<div class="mgr-focus-grid">
      <section class="manager-section mgr-focus weak-focus">
        <div class="mgr-section-title"><span>🎯</span><div><h2>この人の共通弱点</h2><p>学科＋実技をテーマで統合</p></div></div>
        ${themes.slice(0,6).map(x=>simpleBar(x.theme,x.rate,`${x.t}回答`)).join("")||'<p class="manager-empty-small">共通分析データがまだありません。</p>'}
      </section>
      <section class="manager-section mgr-focus ai-focus ${advice.tone}">
        <div class="mgr-section-title"><span>🤖</span><div><h2>この人向けAI教育</h2><p>学科・実技を横断した次の一手</p></div></div>
        <div class="mgr-ai-main"><small>NEXT ACTION</small><strong>${safeEsc(advice.title)}</strong><p>${safeEsc(advice.body)}</p></div>
      </section>
    </div>`;
    return h;
  }

  function bindReport(){
    document.getElementById("mgr-player-select")?.addEventListener("change",e=>{selectedPlayerKey=e.target.value;renderManagerOrganized();});
  }

  function renderManagerOrganized(){
    const B=document.getElementById("ad-rep");if(!B)return;
    let html="";
    if(managerScope==="overall"){
      html=managerExamMode==="combined"?renderOverallCombined():renderOverallSingle(managerExamMode);
    }else{
      html=managerExamMode==="combined"?renderIndividualCombined():renderIndividualSingle(managerExamMode);
    }
    B.innerHTML=html;
    bindReport();
    updateTopTabs();
  }

  function updateTopTabs(){
    document.querySelectorAll("[data-manager-scope]").forEach(b=>b.classList.toggle("active",b.dataset.managerScope===managerScope));
    document.querySelectorAll("[data-manager-exam]").forEach(b=>b.classList.toggle("active",b.dataset.managerExam===managerExamMode));
    const connection=document.getElementById("connection-text");
    if(connection&&serverAvailable)connection.textContent=`Supabaseクラウド接続中・${managerScope==="overall"?"全体":"個人"}・${labelMode()}`;
  }

  async function loadCoachDate(){
    try{
      const r=await fetch(`${CLOUD.url}/rest/v1/coach_settings?select=key,value&key=eq.exam_date&limit=1`,{headers:{apikey:CLOUD.publishableKey},cache:"no-store"});
      if(r.ok){const j=await r.json();coachExamDate=j[0]?.value||"";}
    }catch(e){}
  }

  async function openCoachSettings(){
    let modal=document.getElementById("mgr-coach-dialog");
    if(!modal){
      modal=document.createElement("div");modal.className="player-detail";modal.id="mgr-coach-dialog";modal.setAttribute("aria-hidden","true");
      modal.innerHTML=`<div class="player-detail-card mgr-setting-card"><button class="player-detail-close" id="mgr-coach-close">×</button>
        <div class="manager-section-head"><div><h2>学習コーチ設定</h2><p>全体設定はここにまとめました。</p></div></div>
        <label>試験日<input type="date" id="mgr-coach-date"></label>
        <button class="btn-g" id="mgr-coach-save-date">試験日を保存</button>
        <label>全員向けメッセージ<textarea id="mgr-coach-message" maxlength="500" placeholder="全プレイヤーへのメッセージ"></textarea></label>
        <button class="btn-g" id="mgr-coach-send">全員へ送信</button>
      </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click",e=>{if(e.target===modal)closeCoachSettings();});
      modal.querySelector("#mgr-coach-close").addEventListener("click",closeCoachSettings);
      modal.querySelector("#mgr-coach-save-date").addEventListener("click",async()=>{
        const v=modal.querySelector("#mgr-coach-date").value;
        try{await window.SKIMARU_COACH_MANAGER?.saveExamDate(v);coachExamDate=v;notify("試験日を保存しました");}catch(e){notify("試験日を保存できません");}
      });
      modal.querySelector("#mgr-coach-send").addEventListener("click",async()=>{
        const t=modal.querySelector("#mgr-coach-message");
        try{await window.SKIMARU_COACH_MANAGER?.sendMessage("ALL",t.value);t.value="";notify("全員へ送信しました");}catch(e){notify("送信できません");}
      });
    }
    await loadCoachDate();
    modal.querySelector("#mgr-coach-date").value=coachExamDate||"";
    modal.classList.add("show");modal.setAttribute("aria-hidden","false");
  }
  function closeCoachSettings(){const m=document.getElementById("mgr-coach-dialog");if(m){m.classList.remove("show");m.setAttribute("aria-hidden","true");}}

  function setupTop(){
    const old=document.querySelector(".manager-mode-tabs");
    if(!old)return;
    let scope=document.querySelector(".manager-scope-tabs");
    if(!scope){
      scope=document.createElement("div");scope.className="manager-scope-tabs";
      scope.innerHTML=`<button type="button" class="active" data-manager-scope="overall">全体分析</button><button type="button" data-manager-scope="person">個人別分析</button>`;
      old.parentNode.insertBefore(scope,old);
    }
    old.innerHTML=`<button type="button" class="active" data-manager-exam="academic">学科</button><button type="button" data-manager-exam="practical">実技</button><button type="button" data-manager-exam="combined">総合</button>`;
    document.querySelectorAll("[data-manager-scope]").forEach(b=>b.addEventListener("click",()=>{managerScope=b.dataset.managerScope;renderManagerOrganized();}));
    document.querySelectorAll("[data-manager-exam]").forEach(b=>b.addEventListener("click",()=>{
      managerExamMode=b.dataset.managerExam;
      if(managerExamMode!=="combined")syncAcademicMode();
      renderManagerOrganized();
    }));

    const actions=document.querySelector(".manager-actions");
    if(actions&&!document.getElementById("mgr-coach-settings-btn")){
      const b=document.createElement("button");b.type="button";b.className="btn-g";b.id="mgr-coach-settings-btn";b.textContent="学習コーチ設定";b.addEventListener("click",openCoachSettings);actions.appendChild(b);
    }
  }

  // 既存の15秒更新時も、新しい整理画面を維持する。
  render=renderManagerOrganized;
  setupTop();
  updateTopTabs();

  // 認証済み・既存データがある場合はすぐ描画。
  requestAnimationFrame(()=>{try{if(authenticated)renderManagerOrganized();}catch(e){console.error(e);}});
})();
