"use strict";
const QUESTIONS = window.QUESTIONS;

/* ============================================================
   データ
   ============================================================ */
const APP={id:"skimaru-hozenshi",version:"4.7",schema:6};
const KEY="skimaruData";
const AUTO_BACKUP_KEY="skimaruDataAutoBackup";
const LEGACY_KEYS=["quizAppData"];
const SUBJ=["生産の基本","設備の日常保全","効率化とロス","改善・解析","設備保全の基礎"];
const INTERVAL=[1,3,7,14,30,60];
let loadMessage="";
let storageHealthy=true;

function baseData(){
  return {schemaVersion:APP.schema,updatedAt:null,name:"",streak:0,lastDate:null,total:0,correct:0,
    wrongIds:[],recentIds:[],daily:{},showWarn:true,useSRS:true,largeText:false,highContrast:false,
    onboardingDone:false,stats:{}};
}
function plainObject(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
function normalizeData(raw){
  if(!plainObject(raw)) return null;
  const d=Object.assign(baseData(),raw);
  d.stats=plainObject(d.stats)?d.stats:{};
  d.daily=plainObject(d.daily)?d.daily:{};
  d.wrongIds=Array.isArray(d.wrongIds)?[...new Set(d.wrongIds.map(Number).filter(Number.isInteger))]:[];
  d.recentIds=Array.isArray(d.recentIds)?d.recentIds.map(Number).filter(Number.isInteger):[];
  d.name=String(d.name||"").slice(0,20);
  d.total=Number.isFinite(Number(d.total))?Math.max(0,Number(d.total)):0;
  d.correct=Number.isFinite(Number(d.correct))?Math.max(0,Math.min(d.total,Number(d.correct))):0;
  d.streak=Number.isFinite(Number(d.streak))?Math.max(0,Number(d.streak)):0;
  if(d.showWarn===undefined) d.showWarn=(d.showPastWrong!==undefined?d.showPastWrong:true);
  if(d.useSRS===undefined) d.useSRS=true;
  if(d.lastDate===undefined) d.lastDate=d.lastStudyDate||null;
  if(raw.total===undefined&&raw.totalAnswered!==undefined) d.total=Number(raw.totalAnswered)||0;
  if(raw.correct===undefined&&raw.totalCorrect!==undefined) d.correct=Number(raw.totalCorrect)||0;
  for(const id of Object.keys(d.stats)){
    const s=plainObject(d.stats[id])?d.stats[id]:{};
    s.c=Number.isFinite(Number(s.c))?Math.max(0,Number(s.c)):Math.max(0,Number(s.correct)||0);
    s.w=Number.isFinite(Number(s.w))?Math.max(0,Number(s.w)):Math.max(0,Number(s.wrong)||0);
    s.everOK=s.everOK!==undefined?!!s.everOK:(s.everCorrect!==undefined?!!s.everCorrect:s.c>0);
    s.guess=Number.isFinite(Number(s.guess))?Math.max(0,Number(s.guess)):Math.max(0,Number(s.guessCount)||0);
    s.level=Math.max(0,Math.min(5,Number(s.level)||0));
    s.due=typeof s.due==="string"?s.due:today();
    s.last=typeof s.last==="string"?s.last:null;
    s.bm=!!s.bm;
    s.alertGuess=s.alertGuess!==undefined?!!s.alertGuess:s.guess>0;
    s.alertRelapse=s.alertRelapse!==undefined?!!s.alertRelapse:(s.w>0&&s.everOK);
    s.sureStreak=Math.max(0,Number(s.sureStreak)||0);
    d.stats[id]=s;
  }
  d.schemaVersion=APP.schema;
  return d;
}
function readStored(key){
  try{const raw=localStorage.getItem(key);return raw?normalizeData(JSON.parse(raw)):null;}catch(e){return null;}
}
function load(){
  const primary=readStored(KEY);
  if(primary) return primary;
  const auto=readStored(AUTO_BACKUP_KEY);
  if(auto){loadMessage="保存データを自動バックアップから復旧しました";return auto;}
  for(const key of LEGACY_KEYS){const legacy=readStored(key);if(legacy){loadMessage="旧版の学習履歴を移行しました";return legacy;}}
  return baseData();
}

let U=load();
let S={mode:"normal",subject:null,queue:[],i:0,ok:0,wrong:[],answered:false,
       conf:null,sure:false,everOK:false,q:null,isMock:false};
let currentSubject=null;

function save(){
  try{
    const current=localStorage.getItem(KEY);
    if(current) localStorage.setItem(AUTO_BACKUP_KEY,current);
    U.schemaVersion=APP.schema; U.updatedAt=new Date().toISOString();
    localStorage.setItem(KEY,JSON.stringify(U));
    storageHealthy=true; updateStorageStatus();
    return true;
  }catch(e){
    storageHealthy=false; updateStorageStatus();
    notify("学習履歴を保存できません。バックアップを保存してください");
    return false;
  }
}
let toastTimer=null;
function notify(message){
  const el=document.getElementById("toast");
  if(!el){loadMessage=message;return;}
  el.textContent=message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2600);
}

function fmt(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function today(){return fmt(new Date());}
function addDays(n){const d=new Date(); d.setDate(d.getDate()+n); return fmt(d);}
function daysBetween(a,b){ // b - a （日数）
  return Math.round((new Date(b)-new Date(a))/86400000);
}
function touchDate(){
  const t=today();
  const y=new Date(); y.setDate(y.getDate()-1);
  if(U.lastDate===t){}
  else if(U.lastDate===fmt(y)) U.streak+=1;
  else U.streak=1;
  U.lastDate=t;
  U.daily[t]=(U.daily[t]||0)+1;
}
function show(id){
  document.querySelectorAll("body > section").forEach(s=>{
    const active=s.id===id;
    s.classList.toggle("active",active);
    s.setAttribute("aria-hidden",String(!active));
  });
  const target=document.getElementById(id);
  const title=target&&target.querySelector(".hd-ttl");
  if(title){title.setAttribute("tabindex","-1");requestAnimationFrame(()=>title.focus({preventScroll:true}));}
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function st(id){
  if(!U.stats[id]) U.stats[id]={c:0,w:0,everOK:false,guess:0,level:0,due:today(),bm:false,alertGuess:false,alertRelapse:false,sureStreak:0};
  return U.stats[id];
}

/* ============================================================
   自動フォロー（SRS）— このアプリの核
   ============================================================ */
// 期限が来ている問題を、優先度順に返す
function dueQuestions(){
  const t=today();
  const list=QUESTIONS.filter(q=>{
    const s=U.stats[q.id];
    if(!s) return false;              // 未着手はフォロー対象外
    if(s.level>=5 && s.due>t) return false;
    return s.due<=t;                  // 期限到来
  });
  return list.sort((a,b)=>prio(b.id)-prio(a.id));
}
// 優先度スコア
function prio(id){
  const s=U.stats[id]; if(!s) return 0;
  const t=s.c+s.w;
  const over=Math.max(0, daysBetween(s.due, today()));   // 期限超過日数
  const wrongRate = t>0 ? s.w/t : 0;
  return over*10 + wrongRate*50 + (s.guess||0)*15 + (5-(s.level||0))*4;
}
// 回答後にレベルと次回出題日を更新
function updateSRS(id, correct, sure){
  const s=st(id);
  if(correct && sure){
    s.level=Math.min(5,(s.level||0)+1);                           // 定着へ前進
    s.due=addDays(INTERVAL[s.level]);
  }else{
    if(!correct) s.level=0;
    else s.level=Math.max(0,(s.level||0)-1);                     // あいまい正解は1段戻す
    s.due=addDays(1);                                            // まぐれ・誤答は翌日
  }
  s.last=today();
}
function masteredCount(){
  return Object.values(U.stats).filter(s=>s.level>=5).length;
}

/* ============================================================
   ホーム
   ============================================================ */
function renderHome(){
  const pct=U.total>0?Math.round(U.correct/U.total*100):0;
  document.getElementById("h-pct").textContent=pct+"%";
  document.getElementById("h-c").textContent=U.correct;
  document.getElementById("h-t").textContent=U.total;
  document.getElementById("h-d").textContent=U.streak;
  // セグメントゲージ（20分割）
  const gg=document.getElementById("h-gg");
  if(!gg.children.length){ for(let i=0;i<20;i++) gg.appendChild(document.createElement("i")); }
  const lit=Math.round(pct/5);
  [...gg.children].forEach((e,i)=>{
    e.classList.toggle("on", i<lit);
    e.classList.toggle("w", pct<80);   // 80%未満は注意色(黄)
  });

  document.getElementById("h-name").textContent=U.name||"未設定";
  document.getElementById("h-date").textContent=today().replace(/-/g,"/");
  document.getElementById("hd-no").textContent="No."+String(U.total).padStart(4,"0");
  renderOnboarding();

  // 今日のフォロー
  const due=U.useSRS?dueQuestions():[];
  const n=Math.min(due.length,10);
  const fol=document.getElementById("fol");
  if(!U.useSRS){
    fol.classList.add("ok");
    document.getElementById("fol-n").textContent="—";
    document.getElementById("fol-t").textContent="自動フォロー OFF";
    document.getElementById("fol-d").textContent="設定からONにすると、忘れかけた問題を自動で出します";
  }else if(n===0){
    fol.classList.add("ok");
    document.getElementById("fol-n").textContent="✓";
    document.getElementById("fol-t").textContent=U.total===0?"学習を開始してください":"本日の復習は完了";
    document.getElementById("fol-d").textContent=U.total===0
      ?"解いた問題は、忘れる頃に自動で再出題されます"
      :"いま復習すべき問題はありません";
  }else{
    fol.classList.remove("ok");
    document.getElementById("fol-n").textContent=n;
    document.getElementById("fol-t").textContent="要 復 習 項 目";
    document.getElementById("fol-d").textContent="蓄積データが選んだ、いま復習すべき問題";
  }

  const rb=document.getElementById("m-rev"), nb=U.wrongIds.length;
  rb.classList.toggle("hide",nb===0); rb.textContent=nb;
  const bm=bookmarks().length, bb=document.getElementById("m-bm");
  bb.classList.toggle("hide",bm===0); bb.textContent=bm;

  show("sc-home");
}
function renderHomeSubjects(){
  const colors=["#2878B8","#23875A","#C47A18","#8A5AA8","#D94841"];
  const list=document.getElementById("home-subjects");
  list.innerHTML="";
  SUBJ.forEach((subject,index)=>{
    const questions=QUESTIONS.filter(q=>q.category===subject);
    const attempted=questions.filter(q=>U.stats[q.id]).length;
    const score=acc(subject);
    const button=document.createElement("button");
    button.className="home-subject";
    button.style.setProperty("--cat",colors[index]);
    button.innerHTML=`<span class="home-subject-name">${esc(subject)}</span>
      <span class="home-subject-score">${score===null?"未着手":score+"%"}</span>
      <span class="home-subject-meta"><span>${attempted} / ${questions.length}問</span>
      <span class="home-subject-bar"><i style="width:${Math.round(attempted/questions.length*100)}%"></i></span></span>`;
    button.addEventListener("click",()=>showSets(subject));
    list.appendChild(button);
  });
}
function renderOnboarding(){
  const box=document.getElementById("onboarding");
  if(!box) return;
  box.classList.toggle("hide",U.onboardingDone||U.total>0);
}
function dismissOnboarding(){U.onboardingDone=true;save();renderOnboarding();}
function goHome(){ renderHome(); }

function startFollow(){
  if(!U.useSRS){ alert("設定から「自動フォロー」をONにしてください。"); return; }
  const due=dueQuestions();
  if(due.length===0){
    if(U.total===0){ showSubjects(); return; }
    alert("いま復習すべき問題はありません。新しい問題に進みましょう。");
    return;
  }
  S.mode="follow"; S.subject=null;
  launch(due.slice(0,10), "今日のフォロー");
}

/* ============================================================
   出題
   ============================================================ */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(pool,n){
  const rec=U.recentIds||[];
  const lim=Math.floor(pool.length/2);
  const ids=new Set(pool.map(q=>q.id));
  const avoid=new Set(rec.filter(i=>ids.has(i)).slice(-lim));
  const sh=shuffle(pool);
  return sh.filter(q=>!avoid.has(q.id)).concat(sh.filter(q=>avoid.has(q.id))).slice(0,n);
}
function balancedPick(pool,n,trueRatio=.6){
  const positives=pool.filter(q=>q.answer), negatives=pool.filter(q=>!q.answer);
  let t=Math.min(positives.length,Math.round(n*trueRatio));
  let f=Math.min(negatives.length,n-t);
  while(t+f<n&&t<positives.length)t++;
  while(t+f<n&&f<negatives.length)f++;
  return shuffle(pick(positives,t).concat(pick(negatives,f))).slice(0,n);
}
function rec(qs){
  let r=(U.recentIds||[]).concat(qs.map(q=>q.id));
  if(r.length>40) r=r.slice(r.length-40);
  U.recentIds=r; save();
}
function launch(queue,title,isMock){
  S.queue=queue; S.i=0; S.ok=0; S.wrong=[]; S.isMock=!!isMock;
  document.getElementById("q-ttl").textContent=title;
  renderQ(); show("sc-quiz");
}
function startQuiz(mode,subject,setIdx){
  let q,t;
  if(mode==="normal"){
    let pool=subject?QUESTIONS.filter(x=>x.category===subject):QUESTIONS;
    if(setIdx!==undefined){
      pool=pool.slice(setIdx*10,setIdx*10+10);
      q=shuffle(pool); t=`${subject} ${setIdx*10+1}-${setIdx*10+pool.length}`;
    }else{
      q=balancedPick(pool,10); t=subject||"全科目";
      rec(q);
    }
    S.mode="normal"; S.subject=subject||null;
  }else if(mode==="review"){
    q=shuffle(QUESTIONS.filter(x=>U.wrongIds.includes(x.id))).slice(0,10);
    S.mode="review"; S.subject=null; t="直近の誤答";
  }else{
    q=shuffle(S.wrong.slice()); S.mode="review"; S.subject=null; t="間違い復習";
  }
  if(!q.length){ alert("該当する問題がありません。"); return; }
  launch(q,t);
}
function startMock(){
  const q=shuffle(SUBJ.flatMap(category=>balancedPick(QUESTIONS.filter(x=>x.category===category),10)));
  S.mode="normal"; S.subject=null; rec(q);
  launch(q,"総合模擬試験",true);
}
function bookmarks(){ return QUESTIONS.filter(q=>U.stats[q.id]&&U.stats[q.id].bm); }
function startBookmark(){
  const b=bookmarks();
  if(!b.length){ alert("ブックマークした問題はありません。\n問題画面の☆をタップすると登録できます。"); return; }
  S.mode="review"; S.subject=null;
  launch(shuffle(b).slice(0,10),"ブックマーク");
}
function alerts(){ return QUESTIONS.filter(q=>{const s=U.stats[q.id];return s&&(s.alertGuess||s.alertRelapse);}); }
function weakQ(){ return QUESTIONS.filter(q=>{const s=U.stats[q.id];if(!s)return false;const t=s.c+s.w;return t>=2&&s.c/t<0.5;}); }
function freshQ(){ return QUESTIONS.filter(q=>!U.stats[q.id]); }
function startAlertReview(){const a=alerts();if(!a.length){alert("要注意問題はありません。");return;}S.mode="review";S.subject=null;launch(shuffle(a).slice(0,10),"要注意問題");}
function startWeak(){const a=weakQ();if(!a.length){alert("該当する問題はありません。");return;}S.mode="review";S.subject=null;launch(shuffle(a).slice(0,10),"正答率50%未満");}
function startFresh(){const a=freshQ();if(!a.length){alert("すべての問題に着手済みです。");return;}S.mode="normal";S.subject=null;const q=shuffle(a).slice(0,10);rec(q);launch(q,"未着手の問題");}

/* ---------- 科目・セット ---------- */
function acc(sub){
  let c=0,t=0;
  QUESTIONS.forEach(q=>{
    if(sub&&q.category!==sub) return;
    const s=U.stats[q.id]; if(!s) return;
    c+=s.c; t+=s.c+s.w;
  });
  return t>0?Math.round(c/t*100):null;
}
function showSubjects(){
  const L=document.getElementById("subj-list");
  L.innerHTML="";
  const m=acc(null);
  L.innerHTML+=`<button class="pn row" onclick="startQuiz('normal')" style="margin-bottom:8px">
    <span class="row-i">🎲</span>
    <span class="row-b"><span class="row-t">全科目ミックス</span>
      <span class="row-d">全${QUESTIONS.length}問からランダム10問</span>
      <span class="bar"><i style="width:${m||0}%"></i></span></span>
    <span class="row-v">${m!==null?m+"%":"–"}</span></button>`;
  SUBJ.forEach(s=>{
    const n=QUESTIONS.filter(q=>q.category===s).length;
    const a=acc(s);
    L.innerHTML+=`<button class="pn row" onclick="showSets('${s}')" style="margin-bottom:8px">
      <span class="row-b"><span class="row-t">${s}</span>
        <span class="row-d">${n} 問</span>
        <span class="bar"><i style="width:${a||0}%"></i></span></span>
      <span class="row-v">${a!==null?a+"%":"–"}</span>
      <span class="row-go">›</span></button>`;
  });
  show("sc-subj");
}
function showSets(sub){
  currentSubject=sub;
  document.getElementById("set-ttl").textContent=sub;
  const pool=QUESTIONS.filter(q=>q.category===sub);
  const L=document.getElementById("set-list");
  L.innerHTML="";
  const sets=Math.ceil(pool.length/10);
  for(let i=0;i<sets;i++){
    const part=pool.slice(i*10,i*10+10);
    let c=0,t=0,done=0;
    part.forEach(q=>{const s=U.stats[q.id];if(s){c+=s.c;t+=s.c+s.w;done++;}});
    const a=t>0?Math.round(c/t*100):null;
    const cls = done===0?"fresh":(done===part.length?"done":"part");
    const from=i*10+1, to=i*10+part.length;
    L.innerHTML+=`<button class="set ${cls}" onclick="startQuiz('normal','${sub}',${i})">
      <div class="set-n">${from}-${to}</div>
      <div class="set-v">${a!==null?a+"%":"未着手"}</div></button>`;
  }
  show("sc-sets");
}
function showReview(){
  document.getElementById("rv1").textContent=`${U.wrongIds.length} 問（最大10問）`;
  document.getElementById("rv2").textContent=`${alerts().length} 問（自信なし正解・正解後の誤答）`;
  document.getElementById("rv3").textContent=`${weakQ().length} 問（最大10問）`;
  document.getElementById("rv4").textContent=`${freshQ().length} 問（最大10問）`;
  document.getElementById("rv5").textContent=`${bookmarks().length} 問（☆をつけた問題）`;
  show("sc-rev");
}

/* ============================================================
   問題・回答
   ============================================================ */
function renderQ(){
  const q=S.queue[S.i];
  S.answered=false; S.conf=null; S.q=q;
  document.getElementById("q-cat").textContent=q.category;
  document.getElementById("q-txt").textContent=q.text;
  document.getElementById("q-no").textContent=`${S.i+1} / ${S.queue.length}`;
  document.getElementById("q-prog").style.width=((S.i+1)/S.queue.length*100)+"%";
  document.getElementById("q-prog-wrap").setAttribute("aria-valuenow",String(S.i+1));
  document.getElementById("q-prog-wrap").setAttribute("aria-valuemax",String(S.queue.length));

  document.getElementById("jd").classList.remove("show");
  document.getElementById("stamp").classList.remove("show","ng");
  document.getElementById("jd-w").classList.remove("show","dg");
  document.getElementById("jd-c").classList.add("hide");
  document.getElementById("ans").classList.remove("hide");
  document.getElementById("ch-s").classList.remove("on");
  document.getElementById("ch-g").classList.remove("on");
  document.getElementById("ch-s").setAttribute("aria-pressed","false");
  document.getElementById("ch-g").setAttribute("aria-pressed","false");
  document.getElementById("ox").classList.add("lock");
  document.getElementById("conf-h").classList.remove("hide");

  // ブックマーク
  const s=U.stats[q.id];
  const star=document.getElementById("q-star");
  star.textContent = (s&&s.bm)?"★":"☆";
  star.classList.toggle("on", !!(s&&s.bm));
  star.setAttribute("aria-pressed",String(!!(s&&s.bm)));

  // 誤答アラート（模擬試験中は出さない）
  const warn = U.showWarn && !S.isMock && s && s.w>0;
  document.getElementById("q-warn").classList.toggle("show", !!warn);
}
function toggleBookmark(){
  const s=st(S.q.id);
  s.bm=!s.bm; save();
  const star=document.getElementById("q-star");
  star.textContent=s.bm?"★":"☆";
  star.classList.toggle("on",s.bm);
  star.setAttribute("aria-pressed",String(s.bm));
}
function pickConf(sure){
  S.conf=sure;
  document.getElementById("ch-s").classList.toggle("on",sure);
  document.getElementById("ch-g").classList.toggle("on",!sure);
  document.getElementById("ch-s").setAttribute("aria-pressed",String(sure));
  document.getElementById("ch-g").setAttribute("aria-pressed",String(!sure));
  document.getElementById("ox").classList.remove("lock");
  document.getElementById("conf-h").classList.add("hide");
}
function answer(a){
  if(S.answered) return;
  if(S.conf===null){
    const h=document.getElementById("conf-h");
    h.classList.remove("hide"); h.classList.add("shake");
    setTimeout(()=>h.classList.remove("shake"),420);
    return;
  }
  S.answered=true;
  const q=S.q, ok=(a===q.answer), sure=S.conf;
  S.sure=sure;

  touchDate();
  U.total++;
  const s=st(q.id);
  S.everOK=s.everOK;

  if(ok){
    S.ok++; U.correct++; s.c++; s.everOK=true;
    if(!sure){
      s.guess=(s.guess||0)+1;
      s.alertGuess=true;
      s.sureStreak=0;
    }else{
      s.sureStreak=(s.sureStreak||0)+1;
      U.wrongIds=U.wrongIds.filter(i=>i!==q.id);
      if(s.sureStreak>=2){ s.alertGuess=false; s.alertRelapse=false; }
    }
  }else{
    s.w++; S.wrong.push(q);
    if(S.everOK) s.alertRelapse=true;
    s.sureStreak=0;
    if(!U.wrongIds.includes(q.id)) U.wrongIds.push(q.id);
  }
  updateSRS(q.id, ok, sure);    // ★ 忘却曲線で次回出題日を決める
  save();

  if(S.isMock){ nextQ(); return; }   // 模擬試験は解説を挟まない
  judge(ok);
}
function judge(ok){
  const q=S.q;
  document.getElementById("jd-s").classList.toggle("ng",!ok);
  const stp=document.getElementById("stamp");
  stp.textContent = ok?"正解":"不正解";
  stp.classList.toggle("ng",!ok);
  document.getElementById("jd-ans").textContent=q.answer?"○":"✕";
  document.getElementById("jd-e").textContent=q.explanation;

  const c=document.getElementById("jd-c");
  c.classList.toggle("hide", !(ok&&!S.sure));

  const w=document.getElementById("jd-w");
  w.classList.remove("show","dg");
  if(!ok && S.everOK){
    w.innerHTML="<b>⚠ 前は正解できた問題を、今回は落としました。</b><br>覚えたつもりで定着していないサインです。明日また出題します。";
    w.classList.add("show","dg");
  }else if(ok && !S.sure){
    w.innerHTML="<b>▲ 当たりましたが、自信はありませんでした。</b><br>まぐれの可能性があるため、定着とはみなさず再出題します。";
    w.classList.add("show");
  }

  document.getElementById("ans").classList.add("hide");
  document.getElementById("jd").classList.add("show");
  requestAnimationFrame(()=>stp.classList.add("show"));
  const next=document.getElementById("btn-next");
  next.textContent=(S.i===S.queue.length-1)?"結果を見る":"次へ";
  const sr=document.getElementById("sr-status");
  if(sr) sr.textContent=(ok?"正解。":"不正解。正答は"+(q.answer?"丸":"バツ")+"。")+q.explanation;
  requestAnimationFrame(()=>next.focus({preventScroll:true}));
}
function nextQ(){
  S.i++;
  if(S.i>=S.queue.length) result();
  else renderQ();
}
function quitQuiz(){ if(confirm("中断しますか？ここまでの回答は記録されています。")) goHome(); }

/* ============================================================
   結果
   ============================================================ */
function result(){
  const t=S.queue.length, c=S.ok, p=Math.round(c/t*100);
  document.getElementById("res-ttl").textContent=S.isMock?"模擬試験 結果":"結果";
  document.getElementById("res-c").textContent=c;
  document.getElementById("res-t").textContent=t;
  document.getElementById("res-p").textContent=`正答率 ${p}%`;
  document.getElementById("res-m").textContent=
    S.isMock ? (p>=80?"合格ライン。この調子です。":p>=60?"あと一歩。要注意問題を復習しましょう。":"基礎の反復が必要です。")
    : (p===100?"全問正解。文句なしです。":p>=80?"好調です。":p>=50?"間違えた問題こそ伸びしろです。":"復習すれば必ず身につきます。");

  // 次回フォロー予告（SRSの見える化）
  const lv=document.getElementById("res-lv");
  if(U.useSRS && S.wrong.length>0){
    lv.textContent=`▶ 間違えた ${S.wrong.length} 問は、明日また出題されます。正解を重ねるほど出題間隔が伸びます。`;
    lv.classList.remove("hide");
  }else if(U.useSRS && c===t && t>0){
    lv.textContent="▶ 全問正解。定着を確認するため、期間をおいて再出題します。";
    lv.classList.remove("hide");
  }else lv.classList.add("hide");

  const sec=document.getElementById("res-wsec"), L=document.getElementById("res-w");
  L.innerHTML="";
  if(S.wrong.length){
    sec.classList.remove("hide");
    S.wrong.forEach(q=>{L.innerHTML+=`<div class="wi"><span>✕</span><span>${esc(q.text)}</span></div>`;});
    document.getElementById("res-rt").classList.remove("hide");
  }else{
    sec.classList.add("hide");
    document.getElementById("res-rt").classList.add("hide");
  }
  const ag=document.getElementById("res-ag");
  ag.classList.toggle("hide", S.mode!=="normal");
  ag.textContent=S.subject?`「${S.subject}」でもう10問`:"もう10問";
  show("sc-res");
}
function again(){ startQuiz("normal", S.subject||undefined); }

/* ============================================================
   分析
   ============================================================ */
function showAnalysis(){
  document.getElementById("a-t").textContent=U.total;
  document.getElementById("a-a").textContent=U.total>0?Math.round(U.correct/U.total*100)+"%":"–";
  document.getElementById("a-d").textContent=U.streak+"日";
  document.getElementById("a-m").textContent=masteredCount()+"問";
  radar(); bars();
  const W=document.getElementById("a-cats"); W.innerHTML="";
  let any=false;
  SUBJ.forEach(c=>{
    const a=acc(c); if(a!==null) any=true;
    let n=0; QUESTIONS.forEach(q=>{if(q.category===c&&U.stats[q.id]){const s=U.stats[q.id];n+=s.c+s.w;}});
    W.innerHTML+=`<div class="cr"><div class="cl">${c}<span>${a!==null?a+"%（"+n+"問）":"未回答"}</span></div>
      <div class="cb"><div class="cf" style="width:${a||0}%"></div></div></div>`;
  });
  if(!any) W.innerHTML=`<p class="none">まだ記録がありません。</p>`;
  show("sc-an");
}
function radar(){
  const s=document.getElementById("radar");
  const cx=140,cy=120,R=80,n=5;
  const SH={"生産の基本":"生産の基本","設備の日常保全":"日常保全","効率化とロス":"効率化","改善・解析":"改善解析","設備保全の基礎":"保全基礎"};
  let h="";
  for(let g=1;g<=4;g++){
    const r=R*g/4,p=[];
    for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;p.push(`${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`);}
    h+=`<polygon points="${p.join(" ")}" fill="none" stroke="#D6CFBE" stroke-width="1"/>`;
  }
  for(let i=0;i<n;i++){
    const a=-Math.PI/2+i*2*Math.PI/n;
    h+=`<line x1="${cx}" y1="${cy}" x2="${(cx+R*Math.cos(a)).toFixed(1)}" y2="${(cy+R*Math.sin(a)).toFixed(1)}" stroke="#D6CFBE"/>`;
    const lx=cx+(R+21)*Math.cos(a), ly=cy+(R+21)*Math.sin(a);
    let an="middle";
    if(Math.cos(a)>0.3)an="start"; else if(Math.cos(a)<-0.3)an="end";
    h+=`<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" fill="#7A8899" font-size="9.5" text-anchor="${an}">${SH[SUBJ[i]]}</text>`;
  }
  const p=[],d=[];
  for(let i=0;i<n;i++){
    const a1=acc(SUBJ[i]), v=(a1===null?0:a1)/100;
    const a=-Math.PI/2+i*2*Math.PI/n, r=R*v;
    const x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
    p.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    d.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#C0392B"/>`);
  }
  h+=`<polygon points="${p.join(" ")}" fill="rgba(192,57,43,.18)" stroke="#C0392B" stroke-width="2"/>`+d.join("");
  s.innerHTML=h;
}
function bars(){
  const W=document.getElementById("b7"); W.innerHTML="";
  const ds=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);ds.push({k:fmt(d),l:`${d.getMonth()+1}/${d.getDate()}`});}
  const cs=ds.map(d=>U.daily[d.k]||0);
  const mx=Math.max(...cs,1);
  ds.forEach((d,i)=>{
    const c=cs[i], hh=Math.round(c/mx*100);
    const e=document.createElement("div");
    e.className="c";
    e.innerHTML=`<span class="v">${c>0?c:""}</span><span class="col"><span class="f ${c===0?"z":""}" style="height:0%"></span></span><span class="l">${d.l}</span>`;
    W.appendChild(e);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{e.querySelector(".f").style.height=(c===0?4:hh)+"%";}));
  });
}

/* ============================================================
   成績・要注意
   ============================================================ */
function showStats(){
  const L=document.getElementById("al-list"), B=document.getElementById("al-rev");
  L.innerHTML="";
  const a=alerts();
  if(!a.length){
    L.innerHTML=`<p class="none">今は要注意問題はありません。<br>「自信なしで当たった問題」や<br>「前は解けたのに落とした問題」が集まります。</p>`;
    B.classList.add("hide");
  }else{
    a.forEach(q=>{
      const s=U.stats[q.id], t=s.c+s.w, r=t>0?Math.round(s.c/t*100):0;
      const why=[];
      if(s.alertGuess) why.push("自信なしで正解");
      if(s.alertRelapse) why.push("正解後に誤答");
      L.innerHTML+=`<div class="ac"><div class="ac-t">${esc(q.text)}</div>
        <div class="ac-m"><span class="ac-g">${q.category}</span>
        <span class="ac-r">正答率 ${r}%（${s.c}/${t}）</span>
        <span class="ac-w">${why.join(" ・ ")}</span></div></div>`;
    });
    B.classList.remove("hide");
    B.textContent=`要注意問題を復習（${a.length}問）`;
  }
  show("sc-stats");
}

/* ============================================================
   設定
   ============================================================ */
function applyPreferences(){
  document.body.classList.toggle("large-text",!!U.largeText);
  document.body.classList.toggle("high-contrast",!!U.highContrast);
}
function setSwitch(id,on){const el=document.getElementById(id);if(!el)return;el.classList.toggle("on",!!on);el.setAttribute("aria-checked",String(!!on));}
async function updateStorageStatus(){
  const el=document.getElementById("storage-status"); if(!el) return;
  let label=storageHealthy?"正常に保存できます":"保存エラーがあります";
  try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();if(e.quota)label+=`（使用 ${Math.round((e.usage||0)/1024)}KB）`;}}catch(_){ }
  el.textContent=label;
  const restore=document.getElementById("restore-auto");if(restore)restore.classList.toggle("hide",!localStorage.getItem(AUTO_BACKUP_KEY));
}
function showSettings(){
  document.getElementById("st-name").textContent=U.name||"名前を入力";
  setSwitch("sw-warn",U.showWarn); setSwitch("sw-srs",U.useSRS);
  setSwitch("sw-large",U.largeText); setSwitch("sw-contrast",U.highContrast);
  document.getElementById("st-qn").textContent=QUESTIONS.length;
  updateStorageStatus(); show("sc-set");
}
function editName(){
  const v=prompt("名前を入力してください（成績送信で使われます）",U.name||"");
  if(v===null) return;
  U.name=v.trim().slice(0,20); save();
  document.getElementById("st-name").textContent=U.name||"名前を入力";
}
function toggleWarn(){U.showWarn=!U.showWarn;save();setSwitch("sw-warn",U.showWarn);}
function toggleSRS(){U.useSRS=!U.useSRS;save();setSwitch("sw-srs",U.useSRS);}
function toggleLargeText(){U.largeText=!U.largeText;save();applyPreferences();setSwitch("sw-large",U.largeText);}
function toggleContrast(){U.highContrast=!U.highContrast;save();applyPreferences();setSwitch("sw-contrast",U.highContrast);}
async function requestPersistentStorage(){
  if(!navigator.storage||!navigator.storage.persist){notify("このブラウザは保存保護に対応していません");return;}
  try{const ok=await navigator.storage.persist();notify(ok?"端末保存を保護しました":"ブラウザ設定により保護できませんでした");updateStorageStatus();}
  catch(e){notify("保存保護を設定できませんでした");}
}
function restoreAutoBackup(){
  const data=readStored(AUTO_BACKUP_KEY);if(!data){notify("自動バックアップがありません");return;}
  if(!confirm("直前の自動バックアップへ戻しますか？"))return;
  U=data;save();notify("自動バックアップから復元しました");setTimeout(()=>location.reload(),600);
}
function resetData(){
  if(!confirm("学習履歴をすべて削除します。\n成績・苦手リスト・ブックマーク・日次記録が消えます。\nこの操作は取り消せません。")) return;
  if(!confirm("本当にリセットしますか？")) return;
  const nm=U.name;
  localStorage.removeItem(KEY); localStorage.removeItem(AUTO_BACKUP_KEY);
  U=baseData(); U.name=nm; save();
  alert("リセットしました。");
  goHome();
}

/* ============================================================
   送信・集計
   ============================================================ */


function build(){
  const cats={};
  QUESTIONS.forEach(q=>{
    const s=U.stats[q.id]; if(!s) return;
    if(!cats[q.category]) cats[q.category]={c:0,t:0};
    cats[q.category].c+=s.c; cats[q.category].t+=s.c+s.w;
  });
  const al=alerts().slice(0,30).map(q=>{
    const s=U.stats[q.id], t=s.c+s.w;
    return {id:q.id,cat:q.category,text:q.text,rate:t>0?Math.round(s.c/t*100):0,
            guess:s.guess||0,relapse:(s.w>0&&s.everOK)?1:0};
  });
  return {v:6,name:U.name||"(未記入)",date:today(),total:U.total,correct:U.correct,
          streak:U.streak,cats,wrongCount:U.wrongIds.length,mastered:masteredCount(),alerts:al};
}
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,"0");}
function enc(o){const raw=JSON.stringify(o);const wrap={payload:o,checksum:checksum(raw)};return "SKM5:"+btoa(unescape(encodeURIComponent(JSON.stringify(wrap))));}
function dec(s){
  const raw=s.trim(),prefix=(raw.match(/^([A-Z0-9]+):/)||[])[1];
  let x=raw.replace(/^(SKM5|SKM4|SKM3|HZN2|HZN1):/,"");
  try{
    const parsed=JSON.parse(decodeURIComponent(escape(atob(x))));
    if((prefix==="SKM5"||prefix==="SKM4")&&parsed&&parsed.payload){if(parsed.checksum!==checksum(JSON.stringify(parsed.payload)))throw new Error("checksum");return parsed.payload;}
    return parsed;
  }catch(e){return JSON.parse(raw);}
}

const SUBMISSION_INBOX_KEY="skimaru-manager-inbox-v1";
const SUBMISSION_PENDING_KEY="skimaru-pending-submissions-v1";
const SUBMISSION_CHANNEL="skimaru-submissions";
function submissionId(){
  if(globalThis.crypto&&crypto.randomUUID)return crypto.randomUUID();
  return "sub-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
}
function readSubmissionList(key){try{const x=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(x)?x:[];}catch(e){return [];}}
function writeSubmissionList(key,list){try{localStorage.setItem(key,JSON.stringify(list.slice(-500)));return true;}catch(e){return false;}}
function saveLocalSubmission(record,key=SUBMISSION_INBOX_KEY){
  const list=readSubmissionList(key).filter(x=>x.id!==record.id);list.push(record);return writeSubmissionList(key,list);
}
function broadcastSubmission(record){
  try{const ch=new BroadcastChannel(SUBMISSION_CHANNEL);ch.postMessage({type:"submission",record});ch.close();}catch(e){}
}
async function postSubmission(record){
  const res=await fetch("./api/submissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({submission:record}),cache:"no-store"});
  if(!res.ok)throw new Error("server");return res.json();
}
async function retryPendingSubmissions(){
  const pending=readSubmissionList(SUBMISSION_PENDING_KEY);if(!pending.length)return;
  const remains=[];
  for(const record of pending){try{await postSubmission(record);}catch(e){remains.push(record);}}
  writeSubmissionList(SUBMISSION_PENDING_KEY,remains);
}

function showSend(){
  if(!U.name){
    if(confirm("提出には名前が必要です。入力しますか？")){ editName(); if(!U.name) return; }
    else return;
  }
  // 提出内容のサマリーを表示
  const a=alerts().length;
  document.getElementById("sb-name").textContent=U.name;
  document.getElementById("sb-total").textContent=U.total+" 問";
  document.getElementById("sb-acc").textContent=U.total>0?Math.round(U.correct/U.total*100)+"%":"–";
  document.getElementById("sb-alert").textContent=a+" 問";
  document.getElementById("sd-done").classList.add("hide");
  show("sc-send");
}


// 提出：マネージャー受信箱へ自動送付
async function submitResult(){
  if(U.total===0){alert("まだ回答がありません。学習してから提出してください。");return;}
  const btn=document.getElementById("submit-btn");
  btn.disabled=true;btn.textContent="送付中…";
  const sentAt=new Date().toISOString();
  const record={...build(),id:submissionId(),sentAt,clientReceivedAt:sentAt,source:"player"};
  let serverSaved=false,receivedAt=sentAt;
  try{
    const result=await postSubmission(record);
    serverSaved=true;receivedAt=(result.submission&&result.submission.receivedAt)||result.receivedAt||sentAt;
    const pending=readSubmissionList(SUBMISSION_PENDING_KEY).filter(x=>x.id!==record.id);writeSubmissionList(SUBMISSION_PENDING_KEY,pending);
  }catch(e){
    saveLocalSubmission(record,SUBMISSION_INBOX_KEY);
    saveLocalSubmission(record,SUBMISSION_PENDING_KEY);
    broadcastSubmission(record);
  }
  document.getElementById("sd-done").classList.remove("hide");
  document.getElementById("sd-title").textContent=serverSaved?"マネージャーへ送付しました":"この端末の受信箱へ送付しました";
  const dt=new Date(receivedAt);
  const when=dt.toLocaleString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  document.getElementById("sd-message").textContent=`送付者：${U.name} ／ 送付日時：${when}${serverSaved?"":"。別端末へ共有するにはLANサーバーで起動してください。"}`;
  notify(serverSaved?"送付が完了しました":"端末内受信箱へ保存しました");
  btn.disabled=false;btn.textContent="もう一度送付";
}
function dlJson(){
  const b=new Blob([JSON.stringify(build(),null,2)],{type:"application/json"});
  const u=URL.createObjectURL(b), a=document.createElement("a");
  a.href=u; a.download=`skimaru_${(U.name||"result").replace(/[^\w\u3040-\u30ff\u4e00-\u9fff]/g,"_")}_${today()}.json`;
  a.click(); URL.revokeObjectURL(u);
}
function exportBackup(){
  const raw=JSON.stringify(U);
  const payload={app:APP.id,version:APP.version,schema:APP.schema,exportedAt:new Date().toISOString(),checksum:checksum(raw),data:U};
  const b=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(b),a=document.createElement("a");
  a.href=u;a.download=`skimaru_backup_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  notify("学習履歴をバックアップしました");
}
function importBackup(event){
  const input=event.target,file=input.files&&input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(reader.result);
      const allowed=new Set([APP.id,"スキマル保全士",undefined]);
      if(!allowed.has(payload.app))throw new Error("app");
      const candidate=payload.data||payload;
      if(payload.checksum&&payload.checksum!==checksum(JSON.stringify(candidate)))throw new Error("checksum");
      const data=normalizeData(candidate);if(!data||!plainObject(data.stats))throw new Error("data");
      if(!confirm("現在の学習履歴を、選択したバックアップで置き換えますか？"))return;
      U=data;if(!save())throw new Error("save");
      notify("学習履歴を復元しました");setTimeout(()=>location.reload(),700);
    }catch(e){notify(e.message==="checksum"?"バックアップが破損しています":"バックアップを読み込めませんでした");}
    finally{input.value="";}
  };
  reader.onerror=()=>{notify("ファイルを読み込めませんでした");input.value="";};reader.readAsText(file);
}
/* 起動 */
applyPreferences();
renderHome();
document.addEventListener("keydown",event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
  if(!document.getElementById("sc-quiz").classList.contains("active"))return;
  const key=event.key.toLowerCase();
  if(!S.answered){
    if(key==="1")pickConf(true);else if(key==="2")pickConf(false);
    else if((key==="o"||key==="arrowleft")&&S.conf!==null)answer(true);
    else if((key==="x"||key==="arrowright")&&S.conf!==null)answer(false);
    else if(key==="b")toggleBookmark();else return;
  }else if(key==="enter"||key===" ")nextQ();else return;
  event.preventDefault();
});
window.addEventListener("online",retryPendingSubmissions);
window.addEventListener("load",()=>{
  if(loadMessage)notify(loadMessage);
  updateStorageStatus();
  retryPendingSubmissions();
  if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
});
