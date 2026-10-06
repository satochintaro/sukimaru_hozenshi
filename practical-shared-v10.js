'use strict';
(() => {
  const info = window.SKIMARU_PRACTICAL_V10;
  const questions = info.questions;
  const TOTAL = info.total, YEAR = info.year;
  const tasks = info.tasks;
  const KEY = info.key;
  const $ = id => document.getElementById(id);
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  state = state && typeof state === 'object' ? state : {};
  state.answers = state.answers && typeof state.answers === 'object' ? state.answers : {};
  if (state.branch === 'B') {
    for (let n = info.branchRange[0]; n <= info.branchRange[1]; n++) delete state.answers[n];
    state.finished = false; state.completedAt = null; state.synced = false; state.attemptId = null;
  }
  state.branch = 'A';
  if (info.modern) state.finished = !!state.completedAt;
  const picked = n => info.modern ? questions[n-1]?.options[state.answers[n]?.picked]?.letter : state.answers[n];
  for (const q of questions) {
    if (state.answers[q.number] && !q.options.some(o => o.letter === picked(q.number))) {
      delete state.answers[q.number]; state.finished = false; state.completedAt = null; state.synced = false;
    }
  }
  state.startedAt ||= new Date().toISOString();
  state.version = '10.0.0';
  let current = 1;
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const answered = () => questions.filter(q => q.options.some(o => o.letter === picked(q.number))).length;
  const taskOf = n => tasks.findIndex(t => n >= t.start && n <= t.end);
  const progress = () => {
    $('count').textContent = `${answered()} / ${TOTAL}問`;
    $('bar').style.width = `${answered() / TOTAL * 100}%`;
  };
  const imagePath = page => `./practical-${YEAR}-v10-p${page}.jpg`;
  function viewport(figure) {
    const [x,y,w,h] = figure.box;
    const box = document.createElement('div'); box.className = 'v9-viewport';
    box.style.aspectRatio = String(595.276*w/(841.89*h));
    const img = document.createElement('img'); img.src = imagePath(figure.page);
    img.alt = figure.title; img.draggable = false;
    img.style.width = `${100/w}%`; img.style.left = `${-x/w*100}%`; img.style.top = `${-y/h*100}%`;
    box.append(img); return box;
  }
  function render() {
    const q = questions[current-1], ti = taskOf(current), t = tasks[ti];
    progress(); $('tabs').replaceChildren();
    tasks.forEach((task,i) => {
      const button = document.createElement('button'); button.textContent = `課題${i+1}`;
      button.className = i === ti ? 'current' : ''; button.setAttribute('aria-current', i === ti ? 'true' : 'false');
      button.onclick = () => go(task.start); $('tabs').append(button);
    });
    $('taskTitle').textContent = `課題${ti+1}：${t.title}${t.branch ? '（選択A）' : ''}`;
    $('taskMeta').textContent = `設問 ${t.start}〜${t.end}`;
    $('reviewNote').textContent = state.finished ? '採点済み：解答を変更する場合は「最初から解く」を使用してください。' : '全問解答後にまとめて採点します。途中では正誤・正解を表示しません。';
    $('oneqNo').textContent = `問題 ${current}`;
    $('oneqProgress').textContent = `${current-t.start+1} / ${t.end-t.start+1}`;
    $('oneqPrompt').textContent = q.prompt;
    $('oneqContext').textContent = q.context;
    $('source').replaceChildren();
    const label = document.createElement('div'); label.className = 'oneq-figure-label';
    const title = document.createElement('span'); title.textContent = q.figure.title;
    const hint = document.createElement('span'); hint.textContent = 'タップで原本全体'; label.append(title,hint);
    const figure = document.createElement('button'); figure.className = 'v9-figure-button'; figure.type = 'button';
    figure.setAttribute('aria-label', `${q.figure.title}：原本PDF ${q.figure.page}ページを全画面表示`);
    figure.append(viewport(q.figure)); figure.onclick = () => openOriginal(q.figure.page, figure);
    $('source').append(label, figure);
    $('oneqSource').onclick = () => openOriginal(q.figure.page, $('oneqSource'));
    $('questions').replaceChildren();
    const options = document.createElement('div'); options.className = 'options';
    options.classList.toggle('v9-long-options', q.options.some(o => o.text.length > 22));
    options.classList.toggle('v9-graphic-options', q.options.some(o => o.figure));
    q.options.forEach(option => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.letter = option.letter;
      button.setAttribute('aria-label', `問題${current} ${option.letter} ${option.text}`);
      button.disabled = !!state.finished;
      const letter = document.createElement('span'); letter.className = 'v9-letter'; letter.textContent = option.letter;
      const word = document.createElement('span'); word.className = 'oneq-word'; word.textContent = option.text;
      button.append(letter);
      if (option.figure) button.append(viewport(option.figure)); else button.append(word);
      button.onclick = () => {
        if (state.finished) return;
        state.answers[current] = info.modern ? {picked:q.options.indexOf(option),at:new Date().toISOString()} : option.letter; state.synced=false; save(); syncOptions(); progress();
      };
      options.append(button);
    });
    $('questions').append(options); syncOptions();
    $('oneqDots').replaceChildren();
    for (let n=t.start; n<=t.end; n++) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
      b.className = n === current ? 'active' : ''; b.setAttribute('aria-label', `問題${n}へ`);
      b.setAttribute('aria-current', n === current ? 'true' : 'false');
      b.onclick = () => go(n); $('oneqDots').append(b);
    }
    $('prev').disabled = current === 1;
    $('prev').onclick = () => go(current-1);
    $('next').textContent = current === TOTAL ? (state.finished ? '採点結果を見る' : '解答状況を確認') : current === t.end ? '次の課題へ →' : '次へ →';
    $('next').onclick = () => current < TOTAL ? go(current+1) : finish();
  }
  function syncOptions() {
    for (const b of $('questions').querySelectorAll('button')) {
      const chosen = picked(current) === b.dataset.letter;
      b.classList.toggle('chosen', chosen); b.setAttribute('aria-pressed', String(chosen));
    }
  }
  function go(n) {
    if (n < 1 || n > TOTAL) return;
    current = n; render(); $('oneqPanel').scrollIntoView({behavior:'auto',block:'start'});
  }
  function recordHistory() {
    let history;
    try { history = JSON.parse(localStorage.getItem('skimaruExamHistory_v1') || '[]'); } catch {}
    if (!Array.isArray(history)) history = [];
    const good = questions.filter(q => picked(q.number) === info.jitugi[q.number]).length;
    const id = state.attemptId || (state.attemptId = `${YEAR}-jitugi-${Date.now()}`);
    if (!history.some(r => r.id === id)) {
      history.push({id,year:YEAR,kind:'jitugi',total:TOTAL,correct:good,rate:Math.round(good/TOTAL*100),completedAt:state.completedAt,branch:'A',answers:info.modern ? Object.fromEntries(Object.entries(state.answers).map(([n,a])=>[n,a.picked])) : {...state.answers}});
      localStorage.setItem('skimaruExamHistory_v1',JSON.stringify(history)); save();
    }
  }
  function finish() {
    if (answered() < TOTAL) { alert(`未回答が${TOTAL-answered()}問あります。全問回答するまで正解は表示されません。`); return; }
    if (!state.finished) {
      if (!confirm('全問の解答を確定し、採点結果と正解を表示しますか？')) return;
      state.finished = true; state.completedAt = new Date().toISOString();
      if(info.modern) for(const q of questions) state.answers[q.number].ok=picked(q.number)===info.jitugi[q.number];
      save();
    }
    recordHistory(); syncLegacy(); showResults();
  }

  function syncLegacy() {
    if(YEAR!==2025 || state.synced)return;
    try {
      const raw=JSON.parse(localStorage.getItem('skimaruPracticalDataTestV1')||'{}')||{};
      const P=Object.assign({version:'0.2-test',totalTasks:0,totalBlanks:0,correctBlanks:0,wrongTaskIds:[],attempts:{},latestRun:null},raw);
      if(!P.attempts||typeof P.attempts!=='object')P.attempts={};
      if(!Array.isArray(P.wrongTaskIds))P.wrongTaskIds=[];
      let totalCorrect=0; const results=[];
      tasks.forEach(t=>{
        let correct=0;
        for(let n=t.start;n<=t.end;n++)if(picked(n)===info.jitugi[n])correct++;
        totalCorrect+=correct; const total=t.end-t.start+1, old=P.attempts[t.id]||{count:0,best:0};
        P.attempts[t.id]={count:(old.count||0)+1,best:Math.max(old.best||0,correct),lastCorrect:correct,lastTotal:total,lastAt:state.completedAt,year:YEAR};
        if(correct===total)P.wrongTaskIds=P.wrongTaskIds.filter(x=>x!==t.id);
        else if(!P.wrongTaskIds.includes(t.id))P.wrongTaskIds.push(t.id);
        results.push({id:t.id,title:t.title,category:t.category,correct,total});
      });
      P.totalTasks=(P.totalTasks||0)+tasks.length;
      P.totalBlanks=(P.totalBlanks||0)+TOTAL;
      P.correctBlanks=(P.correctBlanks||0)+totalCorrect;
      P.latestRun={title:`${YEAR}年度 実技（選択A）`,total:TOTAL,correct:totalCorrect,rate:Math.round(totalCorrect/TOTAL*100),results,completedAt:state.completedAt,year:YEAR,branch:'A'};
      localStorage.setItem('skimaruPracticalDataTestV1',JSON.stringify(P)); state.synced=true;save();
    }catch(e){console.warn('legacy sync failed',e);}
  }

  function showResults() {
    $('exam').classList.add('hidden'); $('results').classList.remove('hidden'); $('resultList').replaceChildren();
    let good=0;
    questions.forEach(q => {
      const ok = picked(q.number) === info.jitugi[q.number]; if (ok) good++;
      const row = document.createElement('div'); row.className = 'result-row';
      const text = document.createElement('span'); text.textContent = `問題${q.number}　あなた：${picked(q.number)}　正解：${info.jitugi[q.number]}`;
      const mark = document.createElement('b'); mark.textContent = ok ? '○' : '×'; mark.className = ok ? 'good' : 'bad';
      row.append(text,mark); $('resultList').append(row);
    });
    $('score').textContent = `${good} / ${TOTAL}問（${Math.round(good/TOTAL*100)}%）`; window.scrollTo(0,0);
  }
  $('resultBack').onclick = () => { $('results').classList.add('hidden'); $('exam').classList.remove('hidden'); render(); };
  $('reset').onclick = () => {
    if (!confirm('この年度の回答をすべて消去しますか？')) return;
    state={answers:{},branch:'A',finished:false,completedAt:null,synced:false,version:'10.0.0',startedAt:new Date().toISOString()}; save(); current=1;
    $('results').classList.add('hidden'); $('exam').classList.remove('hidden'); render();
  };
  // A dedicated viewer uses the complete page image. The inline window never alters image bytes.
  const viewer = $('originalViewer'), stage = $('originalStage'), image = $('originalImage');
  let previousFocus, scale=1, tx=0, ty=0, gesture=null, moved=false, multi=false, lastTap=0;
  const pointers = new Map();
  function transform() { image.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`; stage.dataset.scale=String(scale); }
  function distance() { const p=[...pointers.values()]; return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); }
  function midpoint() { const p=[...pointers.values()]; return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}; }
  function rebase() {
    const p=[...pointers.values()];
    gesture = p.length >= 2 ? {distance:distance(),mid:midpoint(),scale,tx,ty} : p.length ? {x:p[0].x,y:p[0].y,tx,ty} : null;
  }
  function openOriginal(page,trigger) {
    previousFocus=trigger; image.src=imagePath(page); image.alt=`${YEAR}年度 実技 原本PDF ${page}ページ`;
    $('originalPageLabel').textContent=`原本PDF ${page}ページ`;
    scale=1;tx=0;ty=0;lastTap=0;pointers.clear();transform();
    viewer.hidden=false; document.body.style.overflow='hidden'; $('viewerClose').focus();
  }
  function closeOriginal() {
    viewer.hidden=true; document.body.style.overflow=''; pointers.clear();gesture=null;lastTap=0;
    previousFocus?.focus({preventScroll:true});
  }
  $('viewerClose').onclick=closeOriginal;
  stage.addEventListener('pointerdown',e => {
    if(e.button!==0) return;
    if(!pointers.size){moved=false;multi=false;}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); try { stage.setPointerCapture(e.pointerId); } catch {}
    if(pointers.size>1){multi=true;lastTap=0;} rebase();
  });
  stage.addEventListener('pointermove',e => {
    if(!pointers.has(e.pointerId)||!gesture)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2 && gesture.distance){
      const mid=midpoint(),rect=image.getBoundingClientRect();
      const next=Math.min(6,Math.max(1,gesture.scale*distance()/Math.max(1,gesture.distance)));
      const ratio=next/gesture.scale;
      const originX=rect.left-tx, originY=rect.top-ty;
      tx=mid.x-originX-(gesture.mid.x-originX-gesture.tx)*ratio;
      ty=mid.y-originY-(gesture.mid.y-originY-gesture.ty)*ratio;scale=next;moved=true;
    } else if(pointers.size===1){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(Math.abs(dx)+Math.abs(dy)>8)moved=true;
      tx=gesture.tx+dx;ty=gesture.ty+dy;
    }
    transform();
  });
  function pointerEnd(e){
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);
    if(!pointers.size && !moved && !multi && e.type!=='pointercancel'){
      const now=Date.now(); if(lastTap && now-lastTap<330){closeOriginal();return;} lastTap=now;
    }
    rebase();
  }
  stage.addEventListener('pointerup',pointerEnd);stage.addEventListener('pointercancel',pointerEnd);
  stage.addEventListener('dblclick',e=>{e.preventDefault();closeOriginal();});
  stage.addEventListener('wheel',e=>{
    e.preventDefault();const old=scale;scale=Math.min(6,Math.max(1,scale*Math.exp(-e.deltaY*.002)));
    const r=image.getBoundingClientRect(),ratio=scale/old;
    tx-=(e.clientX-r.left)*(ratio-1);ty-=(e.clientY-r.top)*(ratio-1);transform();
  },{passive:false});
  document.addEventListener('keydown',e=>{
    if(viewer.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeOriginal();}
    if(e.key==='Tab'){e.preventDefault();$('viewerClose').focus();}
  });
  save();render();
  if(state.finished && answered()===TOTAL){recordHistory();syncLegacy();showResults();}
})();
