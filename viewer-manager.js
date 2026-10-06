"use strict";
(() => {
  const CLOUD=window.SKIMARU_SUPABASE||{};
  const C=window.SKIMARU_COACH||{};
  const KEY="skimaru-manager-site-session-v15";
  const ACADEMIC=["生産の基本","設備の日常保全","効率化とロス","改善・解析","設備保全の基礎"];
  const PRACTICAL=["安全・環境","TPM・5S","自主保全","改善・解析","設備保全","図面・測定","効率化とロス"];
  let lastActivity=Date.now();
  for(const event of ["pointerdown","keydown","touchstart"])document.addEventListener(event,()=>lastActivity=Date.now(),{passive:true});
  let viewerSession=readSession(),rows=[],mode="combined",groups=[],toastTimer=null;

  function setSite(){const select=document.getElementById("site-filter");if(select&&viewerSession?.site){select.replaceChildren(new Option(viewerSession.site,viewerSession.site));select.value=viewerSession.site;select.disabled=true;}}
  async function comparison(){const data=await rpc("skimaru_manager_comparison",{p_token:viewerSession.token});let root=document.getElementById("site-comparison");if(!root){root=document.createElement("div");root.id="site-comparison";root.className="pn";root.style.cssText="padding:16px;margin:16px 0;overflow:auto";document.getElementById("viewer-report").before(root);}root.replaceChildren();const heading=document.createElement("h3");heading.textContent="拠点間比較（個人名なし・各人の最新提出）";root.append(heading);const table=document.createElement("table");table.style.cssText="width:100%;min-width:540px;border-collapse:collapse";const header=table.insertRow();["拠点","区分","人数","平均正解率","回答数","記録学習時間"].forEach(t=>{const c=document.createElement("th");c.style.cssText="text-align:left;padding:8px;border-bottom:1px solid #d4e1d8";c.textContent=t;header.append(c);});for(const x of data){const r=table.insertRow();[x.site,x.type==="practical"?"実技":"学科",x.learners,`${x.accuracy??"—"}%`,x.answers,`${Math.round((x.seconds||0)/60)}分`].forEach(t=>{const cell=r.insertCell();cell.textContent=t;cell.style.padding="8px";});}root.append(table);}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function parse(v,f){if(v==null)return f;if(typeof v==="string"){try{return JSON.parse(v);}catch(e){return f;}}return v;}
  function readSession(){try{return JSON.parse(sessionStorage.getItem(KEY)||"null");}catch(e){return null;}}
  function saveSession(v){viewerSession=v;try{v?sessionStorage.setItem(KEY,JSON.stringify(v)):sessionStorage.removeItem(KEY);}catch(e){}}
  function notify(msg){const e=document.getElementById("viewer-toast");e.textContent=msg;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2200);}
  function fmt(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
  function pct(c,t){return t?Math.round(c/t*100):null;}
  function signed(n){return `${n>0?"+":""}${n}pt`;}
  function configured(){return /^https:\/\//.test(CLOUD.url||"")&&String(CLOUD.publishableKey||"").startsWith("sb_publishable_");}

  async function rpc(name,body){
    const r=await fetch(`${CLOUD.url}/rest/v1/rpc/${name}`,{
      method:"POST",
      headers:{apikey:CLOUD.publishableKey,"Content-Type":"application/json"},
      body:JSON.stringify(body||{}),
      cache:"no-store"
    });
    if(!r.ok)throw new Error(await r.text().catch(()=>"通信エラー"));
    return await r.json().catch(()=>null);
  }

  function showLogin(message=""){
    document.getElementById("viewer-login").classList.add("show");
    document.getElementById("viewer-login-message").textContent=message;
  }
  function hideLogin(){
    document.getElementById("viewer-login").classList.remove("show");
    document.getElementById("viewer-login-message").textContent="";
    document.getElementById("viewer-password").value="";
  }

  async function valid(){
    if(!viewerSession?.token)return false;
    try{return Array.isArray(await rpc("skimaru_manager_rows",{p_token:viewerSession.token}));}
    catch(e){return false;}
  }

  async function login(){
    const input=document.getElementById("viewer-password"),btn=document.getElementById("viewer-login-btn"),password=input.value;
    if(!password){showLogin("管理者パスワードを入力してください。");return;}
    btn.disabled=true;btn.textContent="確認中…";
    try{
      const j=await rpc("skimaru_manager_login",{p_account:document.getElementById("viewer-account").value.trim(),p_password:password});
      const row=Array.isArray(j)?j[0]:j;
      if(!row?.token)throw new Error(row?.error||"login_failed");
      lastActivity=Date.now();saveSession({token:row.token,expires_at:row.expires_at,site:row.site,account:row.account});setSite();
      hideLogin();await load();notify("管理者画面を開きました");
    }catch(e){showLogin(e.message==="rate_limited"?"試行回数が上限に達しました。15分後にお試しください。":"管理者IDまたはパスワードが違います。");}
    finally{btn.disabled=false;btn.textContent="管理者画面を開く";}
  }

  async function logout(){
    const token=viewerSession?.token;closeDetail();saveSession(null);rows=[];groups=[];document.getElementById("site-comparison")?.remove();render();showLogin("退出しました。");
    if(token){try{await rpc("skimaru_manager_logout",{p_token:token});}catch(e){}}
  }

  async function load(){
    if(!viewerSession?.token){showLogin();return;}
    setConnection(false,"読み込み中…");
    try{
      const j=await rpc("skimaru_manager_rows",{p_token:viewerSession.token});
      if(!Array.isArray(j))throw new Error();
      rows=j.map(normalize);setSite();await comparison();
      buildGroups();
      setConnection(true,mode==="combined"?"総合分析":mode==="academic"?"学科分析":"実技分析");
      render();
    }catch(e){
      closeDetail();document.getElementById("site-comparison")?.remove();saveSession(null);rows=[];groups=[];setConnection(false,"認証切れ");render();showLogin("閲覧セッションの有効期限が切れました。");
    }
  }

  function normalize(x){
    const raw=parse(x.raw_result,{}),cats=parse(x.category_results,raw.cats||{}),alerts=parse(x.weak_questions,raw.alerts||[]);
    const total=Number(x.total_questions??raw.total)||0,correct=Number(x.correct_count??x.score??raw.correct)||0;
    return {
      id:x.submission_id||x.id,
      examType:raw.examType==="practical"?"practical":"academic",
      playerNo:String(x.player_no||raw.playerNo||"").trim(),
      name:x.user_name||raw.name||"(未記入)",site:raw.site||"四日市",
      total,correct,rate:pct(correct,total)||0,
      cats:cats&&typeof cats==="object"?cats:{},
      alerts:Array.isArray(alerts)?alerts:[],
      raw,
      at:x.created_at||x.submitted_at||raw.sentAt
    };
  }

  function matchesSite(r){const site=document.getElementById("site-filter")?.value||"";return !site||r.site===site;}
  ["site-filter"].forEach(id=>document.getElementById(id)?.addEventListener("change",()=>{closeDetail();buildGroups();render();setConnection(true,"拠点で絞り込み中");}));
  function buildGroups(){
    const map=new Map();
    rows.filter(matchesSite).forEach(r=>{
      const key=r.playerNo||`LEGACY:${r.site}:${r.name}`;
      if(!map.has(key))map.set(key,{key,playerNo:r.playerNo||"旧データ",name:r.name,site:r.site,rows:[]});
      map.get(key).rows.push(r);
    });
    groups=[...map.values()].map(g=>{
      g.rows.sort((a,b)=>new Date(a.at)-new Date(b.at));
      g.academic=g.rows.filter(x=>x.examType==="academic").at(-1)||null;
      g.practical=g.rows.filter(x=>x.examType==="practical").at(-1)||null;
      g.latest=g.rows.at(-1)||null;g.site=g.latest?.site||g.site;g.name=g.latest?.name||g.name;
      const a=C.aggregateCats?C.aggregateCats(g.academic?.cats||{},"academic"):{};
      const p=C.aggregateCats?C.aggregateCats(g.practical?.cats||{},"practical"):{};
      g.themes=C.mergeThemes?C.mergeThemes(a,p):{};
      const t=(g.academic?.total||0)+(g.practical?.total||0),c=(g.academic?.correct||0)+(g.practical?.correct||0);
      g.overall=pct(c,t);g.weak=C.weakestTheme?C.weakestTheme(g.themes,5):null;
      return g;
    }).sort((a,b)=>new Date(b.latest?.at||0)-new Date(a.latest?.at||0));
  }

  function setConnection(ok,label){
    document.getElementById("viewer-dot").classList.toggle("online",ok);
    document.getElementById("viewer-connection").textContent=ok?`閲覧専用・${label}`:label;
    document.getElementById("viewer-count").textContent=`${groups.length}人`;
  }

  function stat(label,value,sub=""){
    return `<div class="manager-stat-card"><span>${esc(label)}</span><b>${esc(value)}</b>${sub?`<small>${esc(sub)}</small>`:""}</div>`;
  }

  function subjectsFor(type){return type==="practical"?PRACTICAL:ACADEMIC;}
  function categoryRows(row,type){
    return subjectsFor(type).map(cat=>{
      const x=row?.cats?.[cat]||{},t=Number(x.t)||0,c=Number(x.c)||0;
      return {label:cat,rate:pct(c,t),t};
    });
  }
  function bars(items){
    return `<div class="viewer-bars">${items.map(x=>`<div class="viewer-bar"><span>${esc(x.label)}</span><i><em style="width:${x.rate||0}%"></em></i><b>${x.rate==null?"—":x.rate+"%"}</b><small>${x.t}問</small></div>`).join("")}</div>`;
  }
  function themeBars(g){
    if(!C.themeRows)return "";
    return bars(C.themeRows(g.themes).map(x=>({label:x.theme,rate:x.rate,t:x.t})));
  }

  function render(){
    document.querySelectorAll("[data-viewer-mode]").forEach(b=>b.classList.toggle("active",b.dataset.viewerMode===mode));
    if(mode==="combined")renderCombined();else renderType(mode);
  }

  function renderCombined(){
    const root=document.getElementById("viewer-report");
    if(!groups.length){root.innerHTML=`<div class="manager-empty"><div>📭</div><b>提出データがありません</b></div>`;return;}
    const both=groups.filter(g=>g.academic&&g.practical).length;
    const vals=groups.map(g=>g.overall).filter(v=>v!==null);
    const avg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
    let h=`<div class="manager-stat-grid">${stat("総合対象",groups.length+"人")}${stat("学科＋実技",both+"人")}${stat("総合平均",avg+"%")}${stat("権限","閲覧のみ")}</div>`;
    h+=`<div class="manager-section"><div class="manager-section-head"><div><h2>プレイヤー総合一覧</h2><p>学科・実技を同じPlayerNoでまとめています。</p></div></div><div class="player-table-wrap"><table class="player-table"><thead><tr><th>拠点</th><th>No.</th><th>表示名</th><th>学科</th><th>実技</th><th>総合</th><th>重点</th><th>最終</th></tr></thead><tbody>`;
    groups.forEach((g,i)=>h+=`<tr class="player-row" data-viewer-group="${i}" tabindex="0"><td>${esc(g.site)}</td><td><b>${esc(g.playerNo)}</b></td><td>${esc(g.name)}</td><td><strong>${g.academic?g.academic.rate+"%":"—"}</strong></td><td><strong>${g.practical?g.practical.rate+"%":"—"}</strong></td><td><strong>${g.overall==null?"—":g.overall+"%"}</strong></td><td>${g.weak?esc(g.weak.theme):"—"}</td><td>${fmt(g.latest?.at)}</td></tr>`);
    h+="</tbody></table></div></div>";
    root.innerHTML=window.SKIMARU_METRICS.html(groups.filter(g=>mode==="combined"||g[mode]),mode)+h;bindRows();window.SKIMARU_METRICS.bind(root,render,key=>openDetail(groups.find(g=>g.key===key)));
  }

  function renderType(type){
    const root=document.getElementById("viewer-report"),label=type==="academic"?"学科":"実技";
    const typeGroups=groups.filter(g=>type==="academic"?g.academic:g.practical);
    const vals=typeGroups.map(g=>(type==="academic"?g.academic:g.practical).rate);
    const avg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;
    if(!typeGroups.length){root.innerHTML=`<div class="manager-empty"><div>📭</div><b>${label}の提出データがありません</b></div>`;return;}
    let h=`<div class="manager-stat-grid">${stat(label+"対象",typeGroups.length+"人")}${stat("最新平均",avg+"%")}${stat("提出履歴",rows.filter(r=>r.examType===type&&matchesSite(r)).length+"件")}${stat("権限","閲覧のみ")}</div>`;
    h+=`<div class="manager-section"><div class="manager-section-head"><div><h2>${label}プレイヤー一覧</h2><p>最新提出を表示しています。</p></div></div><div class="player-table-wrap"><table class="player-table"><thead><tr><th>拠点</th><th>No.</th><th>表示名</th><th>最新</th><th>最高</th><th>回数</th><th>最終提出</th></tr></thead><tbody>`;
    typeGroups.forEach(g=>{
      const hist=g.rows.filter(x=>x.examType===type),latest=hist.at(-1),best=Math.max(...hist.map(x=>x.rate)),idx=groups.indexOf(g);
      h+=`<tr class="player-row" data-viewer-group="${idx}" tabindex="0"><td>${esc(g.site)}</td><td><b>${esc(g.playerNo)}</b></td><td>${esc(g.name)}</td><td><strong>${latest.rate}%</strong></td><td>${best}%</td><td>${hist.length}回</td><td>${fmt(latest.at)}</td></tr>`;
    });
    h+="</tbody></table></div></div>";
    root.innerHTML=window.SKIMARU_METRICS.html(groups.filter(g=>mode==="combined"||g[mode]),mode)+h;bindRows();window.SKIMARU_METRICS.bind(root,render,key=>openDetail(groups.find(g=>g.key===key)));
  }

  function bindRows(){
    document.querySelectorAll("[data-viewer-group]").forEach(el=>{
      const open=()=>openDetail(groups[Number(el.dataset.viewerGroup)]);
      el.addEventListener("click",open);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
    });
  }

  function yearHtml(g){
    const hist=g.academic?.raw?.coach?.pastYearHistory||[];
    if(!C.summarizeYearHistory)return '<p class="none">年度別履歴なし</p>';
    const m=C.summarizeYearHistory(hist);
    return [2019,2020,2021,2022,2023,2024,2025].map(y=>{
      const x=m[y];return `<div class="coach-manager-year"><b>${y}</b>${x?`<strong>${x.latest}点</strong><span>最高 ${x.best} / ${x.attempts}回${x.previous==null?"":` / ${signed(x.latest-x.previous)}`}</span>`:"<span>未提出</span>"}</div>`;
    }).join("");
  }

  function openDetail(g){
    const body=document.getElementById("viewer-detail-body");
    if(mode==="combined"){
      body.innerHTML=`<div class="detail-head"><div><span class="detail-no">${esc(g.site)} ／ ${esc(g.playerNo)}</span><h2>${esc(g.name)}</h2><p>学科・実技 総合分析 ／ 閲覧専用</p></div><strong>${g.overall==null?"—":g.overall}<small>${g.overall==null?"":"%"}</small></strong></div>
      <div class="detail-stat-grid">${stat("学科",g.academic?g.academic.rate+"%":"—")}${stat("実技",g.practical?g.practical.rate+"%":"—")}${stat("重点分野",g.weak?g.weak.theme:"—")}${stat("提出履歴",g.rows.length+"件")}</div>
      <div class="manager-section"><h2>学科＋実技 共通テーマ</h2>${themeBars(g)}</div>
      <div class="manager-section"><h2>年度別 過去問成績</h2><div class="coach-manager-years">${yearHtml(g)}</div></div>`;
    }else{
      const row=mode==="academic"?g.academic:g.practical,history=g.rows.filter(x=>x.examType===mode);
      body.innerHTML=`<div class="detail-head"><div><span class="detail-no">${esc(g.site)} ／ ${esc(g.playerNo)}</span><h2>${esc(g.name)}</h2><p>${mode==="academic"?"学科":"実技"}提出 ${history.length}回 ／ 閲覧専用</p></div><strong>${row?.rate??"—"}<small>${row?"%":""}</small></strong></div>
      <div class="manager-section"><h2>最新の分野別結果</h2>${bars(categoryRows(row,mode))}</div>
      <div class="manager-section"><h2>提出履歴</h2><div class="history-list">${[...history].reverse().map(r=>`<div class="history-item"><div><b>${fmt(r.at)}</b><span>${r.correct}/${r.total}${mode==="practical"?"空欄":"問"}正解</span></div><strong>${r.rate}%</strong></div>`).join("")}</div></div>`;
    }
    const modal=document.getElementById("viewer-detail");modal.classList.add("show");modal.setAttribute("aria-hidden","false");
  }
  function closeDetail(){const m=document.getElementById("viewer-detail");m.classList.remove("show");m.setAttribute("aria-hidden","true");}

  document.getElementById("viewer-login-btn").addEventListener("click",login);
  setInterval(async()=>{if(viewerSession&&(Date.now()-lastActivity>30*60*1000||!(await valid())))logout();},60000);
  document.getElementById("viewer-password").addEventListener("keydown",e=>{if(e.key==="Enter")login();});
  document.getElementById("viewer-logout").addEventListener("click",logout);
  document.getElementById("viewer-refresh").addEventListener("click",load);
  document.getElementById("viewer-detail-close").addEventListener("click",closeDetail);
  document.getElementById("viewer-detail").addEventListener("click",e=>{if(e.target.id==="viewer-detail")closeDetail();});
  document.querySelectorAll("[data-viewer-mode]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.viewerMode;render();setConnection(true,mode==="combined"?"総合分析":mode==="academic"?"学科分析":"実技分析");}));

  (async()=>{if(!configured()){showLogin("Supabase接続設定がありません。");return;}if(await valid()){hideLogin();await load();}else{saveSession(null);showLogin();}})();
})();
