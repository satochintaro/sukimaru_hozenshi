'use strict';
(() => {
  const info = window.SKIMARU_PRACTICAL_V10;
  const YEAR = info.year, KEY = info.key;
  const params = new URLSearchParams(location.search);
  const requested = params.get('task');
  const selectedTask = info.tasks.find((t,i)=>requested===String(i+1));
  if(requested&&!selectedTask){location.replace(location.pathname);return;}
  const review=['wrong','marked','random'].includes(params.get('review'))?params.get('review'):null;
  const reviewRun=review?review+':'+(params.get('run')||'latest'):null;
  const $ = id => document.getElementById(id);
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  state = state && typeof state === 'object' ? state : {};
  const fullState=state;
  if(!requested&&!review&&params.get('mode')!=='all'){
    showTaskMenu();return;
  }
  if(selectedTask){fullState.taskSessions ||= {};state=fullState.taskSessions[requested] ||= {answers:{},branch:'A',finished:false};}
  if(review){fullState.reviewSessions ||= {};let nums;if(review==='random'){nums=info.questions.map(q=>q.number);for(let i=nums.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nums[i],nums[j]]=[nums[j],nums[i]];}nums=nums.slice(0,5);}else nums=window.SKIMARU_PRACTICAL_PROGRESS.numbers(info,review);state=fullState.reviewSessions[reviewRun] ||= {answers:{},branch:'A',finished:false,questionNumbers:nums};}
  const questions=info.questions.filter(q=>review?state.questionNumbers.includes(q.number):!selectedTask||(q.number>=selectedTask.start&&q.number<=selectedTask.end));
  if(!questions.length){document.querySelector('.wrap').innerHTML='<p>対象の問題はありません。</p><a href="./practical.html">実技トップへ戻る</a>';return;}
  const tasks=info.tasks.filter(t=>questions.some(q=>q.number>=t.start&&q.number<=t.end));
  const TOTAL=questions.length,FIRST=questions[0].number,LAST=questions.at(-1).number;
  state.answers = state.answers && typeof state.answers === 'object' ? state.answers : {};
  if (state.branch === 'B') {
    for (let n = info.branchRange[0]; n <= info.branchRange[1]; n++) delete state.answers[n];
    state.finished = false; state.completedAt = null; state.synced = false; state.attemptId = null;
  }
  state.branch = 'A';
  if (info.modern) state.finished = !!state.completedAt;
  const picked = n => info.modern ? questions.find(q=>q.number===Number(n))?.options[state.answers[n]?.picked]?.letter : state.answers[n];
  for (const q of questions) {
    if (state.answers[q.number] && !q.options.some(o => o.letter === picked(q.number))) {
      delete state.answers[q.number]; state.finished = false; state.completedAt = null; state.synced = false;
    }
  }
  state.startedAt ||= new Date().toISOString();
  state.version = '10.0.0';
  let current = FIRST;
  function startClock(){if(state.finished&&!state.measurementId)return;state.measurementId ||= crypto.randomUUID();window.SKIMARU_TIME?.start(KEY,state.measurementId,!state.finished);}
  startClock();
  const save = () => {if(selectedTask)fullState.taskSessions[requested]=state;localStorage.setItem(KEY, JSON.stringify(fullState));};
  save();
  const answered = () => questions.filter(q => q.options.some(o => o.letter === picked(q.number))).length;
  const taskOf = n => tasks.findIndex(t => n >= t.start && n <= t.end);
  const progress = () => {
    $('count').textContent = `${answered()} / ${TOTAL}問`;
    $('bar').style.width = `${answered() / TOTAL * 100}%`;
  };
  const imagePath = page => `./practical-${YEAR}-${info.imageVersion||'v10'}-p${page}.jpg`;
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
    const q = questions.find(q=>q.number===current), ti = taskOf(current), t = tasks[ti], taskNumber=info.tasks.indexOf(t)+1;
    progress(); $('tabs').replaceChildren();
    tasks.forEach((task,i) => {
      const button = document.createElement('button'); button.textContent = `課題${info.tasks.indexOf(task)+1}`;
      button.className = i === ti ? 'current' : ''; button.setAttribute('aria-current', i === ti ? 'true' : 'false');
      button.onclick = () => go(questions.find(q=>q.number>=task.start&&q.number<=task.end).number); $('tabs').append(button);
    });
    $('taskTitle').textContent = `課題${taskNumber}：${t.title}${t.branch ? '（選択A）' : ''}`;
    $('taskMeta').textContent = `設問 ${t.start}〜${t.end}`;
    $('reviewNote').textContent = state.finished ? '採点済み：解答を変更する場合は「最初から解く」を使用してください。' : '全問解答後にまとめて採点します。途中では正誤・正解を表示しません。';
    $('oneqNo').textContent = `問題 ${current}`;
    let mark=$('pt-bookmark');if(!mark){mark=document.createElement('button');mark.id='pt-bookmark';mark.className='pt-bookmark';mark.type='button';$('oneqPanel').prepend(mark);}
    const starred=!!fullState.bookmarks?.[current];mark.textContent=starred?'★ 重点マーク':'☆ 重点マーク';mark.setAttribute('aria-pressed',String(starred));mark.onclick=()=>{fullState.bookmarks ||= {};fullState.bookmarks[current]=!fullState.bookmarks[current];save();render();};
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
    if(q.questionFigure){
      const questionLabel=document.createElement('div');questionLabel.className='oneq-figure-label v10-question-label';
      questionLabel.textContent=q.questionFigure.title;
      const questionImage=document.createElement('div');questionImage.className='v10-inline-question';
      questionImage.append(viewport(q.questionFigure));
      $('source').append(questionLabel,questionImage);
    }
    const sourcePage=q.sourcePage || q.figure.page;
    $('oneqSource').textContent=q.sourcePage ? '設問の原本を見る' : '原本を見る';
    $('oneqSource').onclick = () => openOriginal(sourcePage, $('oneqSource'));
    if(sourcePage!==q.figure.page && !q.questionFigure){
      const sceneSource=document.createElement('button');sceneSource.type='button';
      sceneSource.className='oneq-source';sceneSource.textContent='状況図の原本を見る';
      sceneSource.onclick=()=>openOriginal(q.figure.page,sceneSource);$('source').append(sceneSource);
    }
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
      if(!questions.some(q=>q.number===n))continue;
      const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
      b.className = n === current ? 'active' : ''; b.setAttribute('aria-label', `問題${n}へ`);
      b.setAttribute('aria-current', n === current ? 'true' : 'false');
      b.onclick = () => go(n); $('oneqDots').append(b);
    }
    $('prev').disabled = current === FIRST;
    $('prev').onclick = () => go(questions[questions.findIndex(q=>q.number===current)-1]?.number);
    $('next').textContent = current === LAST ? (state.finished ? '採点結果を見る' : '採点する') : current === t.end ? '次の課題へ →' : '次へ →';
    $('next').onclick = () => current < LAST ? go(questions[questions.findIndex(q=>q.number===current)+1].number) : finish();
  }
  function syncOptions() {
    for (const b of $('questions').querySelectorAll('button')) {
      const chosen = picked(current) === b.dataset.letter;
      b.classList.toggle('chosen', chosen); b.setAttribute('aria-pressed', String(chosen));
    }
  }
  function go(n) {
    if (!questions.some(q=>q.number===n)) return;
    current = n; render(); $('oneqPanel').scrollIntoView({behavior:'auto',block:'start'});
  }
  function recordHistory() {
    let history;
    try { history = JSON.parse(localStorage.getItem('skimaruExamHistory_v1') || '[]'); } catch {}
    if (!Array.isArray(history)) history = [];
    const good = questions.filter(q => picked(q.number) === info.jitugi[q.number]).length;
    const id = state.attemptId || (state.attemptId = `${YEAR}-jitugi-${selectedTask?requested:'all'}-${crypto.randomUUID()}`);
    if (!history.some(r => r.id === id)) {
      history.push({elapsedSeconds:window.SKIMARU_TIME?.seconds(KEY,state.measurementId),timeMeasured:!!state.measurementId,id,year:YEAR,kind:'jitugi',scope:review?'review':selectedTask?'task':'year',taskNumber:selectedTask?info.tasks.indexOf(selectedTask)+1:null,title:review?`${YEAR}年度 ${review==='random'?'ランダム5問':review==='wrong'?'復習':'重点学習'}`:selectedTask?selectedTask.title:`${YEAR}年度 全課題`,total:TOTAL,correct:good,rate:Math.round(good/TOTAL*100),completedAt:state.completedAt,branch:'A',answers:info.modern ? Object.fromEntries(Object.entries(state.answers).map(([n,a])=>[n,a.picked])) : {...state.answers}});
      localStorage.setItem('skimaruExamHistory_v1',JSON.stringify(history)); save();
    }
  }
  function finish() {
    if (answered() < TOTAL) { alert(`未回答が${TOTAL-answered()}問あります。全問回答するまで正解は表示されません。`); return; }
    if (!state.finished) {
      if (!confirm('全問の解答を確定し、採点結果と正解を表示しますか？')) return;
      window.SKIMARU_TIME?.stop();state.finished = true; state.completedAt = new Date().toISOString();
      if(info.modern) for(const q of questions) state.answers[q.number].ok=picked(q.number)===info.jitugi[q.number];
      save();
    }
    recordHistory(); syncLegacy(); showResults();
  }

  function syncLegacy() {
    if(review || YEAR!==2025 || state.synced)return;
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
      P.latestRun={title:`${YEAR}年度 ${selectedTask?'課題'+(info.tasks.indexOf(selectedTask)+1):'全課題'} 実技（選択A）`,total:TOTAL,correct:totalCorrect,rate:Math.round(totalCorrect/TOTAL*100),results,completedAt:state.completedAt,year:YEAR,branch:'A'};
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
    if (!confirm(review?'この復習・重点学習の回答を消去して解き直しますか？課題別と全課題の回答は残ります。':selectedTask?'この課題の回答を消去して解き直しますか？他の課題と全課題の回答は残ります。':'全課題モードの回答を消去して解き直しますか？課題別の回答と成績履歴は残ります。')) return;
    const taskSessions=fullState.taskSessions;
    state={answers:{},branch:'A',finished:false,completedAt:null,synced:false,version:'16.9',startedAt:new Date().toISOString()};
    if(!selectedTask&&!review){const bookmarks=fullState.bookmarks,reviewSessions=fullState.reviewSessions;Object.keys(fullState).forEach(k=>delete fullState[k]);Object.assign(fullState,state);fullState.taskSessions=taskSessions;fullState.bookmarks=bookmarks;fullState.reviewSessions=reviewSessions;state=fullState;}
    if(review){state.questionNumbers=questions.map(q=>q.number);fullState.reviewSessions[reviewRun]=state;}
    startClock(); save(); current=FIRST;
    $('results').classList.add('hidden'); $('exam').classList.remove('hidden'); render();
  };
  const originalViewer=window.SKIMARU_IMAGE_VIEWER.create({year:YEAR,imagePath});
  const openOriginal=(page,trigger)=>originalViewer.open(page,trigger);
  const back=document.createElement('a');back.className='pt-task-back';back.href=review?(review==='random'?'./practical.html':'./practical.html#'+(review==='wrong'?'review':'bookmark')):location.pathname;back.textContent=review?'‹ 実技トップへ戻る':'‹ 課題選択へ戻る';document.querySelector('.wrap').prepend(back);
  $('reset').textContent=review?'この演習を解き直す':selectedTask?'この課題を解き直す':'全課題を解き直す';
  save();render();
  if(state.finished && answered()===TOTAL){recordHistory();syncLegacy();showResults();}
  function showTaskMenu(){
    const wrap=document.querySelector('.wrap');wrap.replaceChildren();
    const section=document.createElement('section');section.className='pt-task-menu';
    const heading=document.createElement('h2');heading.textContent='学習する課題を選ぶ';section.append(heading);
    const note=document.createElement('p');note.className='pt-task-menu-note';note.textContent='全課題を通して解くか、課題ごとに学習できます。採点は選んだ範囲の回答後に行います。';section.append(note);
    const all=document.createElement('a');all.className='pt-all-start';all.href=location.pathname+'?mode=all';all.textContent=`全課題をはじめる ／ ${info.total}問`;section.append(all);
    if(Object.keys(fullState.answers||{}).length){const n=document.createElement('p');n.className='pt-task-menu-note';n.textContent='全課題モードには以前の回答が保存されています。そのまま続きから利用できます。';section.append(n);}
    const list=document.createElement('div');list.className='pt-task-list';
    info.tasks.forEach((t,i)=>{const a=document.createElement('a');a.href=location.pathname+'?task='+(i+1);a.className='pt-task-card';const title=document.createElement('b');title.textContent=`課題${i+1}：${t.title}`;const meta=document.createElement('span');const session=fullState.taskSessions?.[i+1];meta.textContent=`${t.end-t.start+1}問${t.branch?' ／ 選択A':''}${session?.finished?' ／ 採点済み':Object.keys(session?.answers||{}).length?' ／ 続きから':''}`;a.append(title,meta);list.append(a);});
    section.append(list);wrap.append(section);
  }
})();
