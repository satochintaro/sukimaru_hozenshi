"use strict";
(() => {
  const VERSION="7.4.0";
  const TOTAL=72,BRANCH_START=64,BRANCH_END=72;
  const STORE="skimaruPractical2025V600";
  const LEGACY="skimaruPracticalDataTestV1";
  const tasks=(window.SKIMARU_2025_OFFICIAL_TASKS||[]).slice().sort((a,b)=>(a.officialOrder||0)-(b.officialOrder||0));
  if(!tasks.length){document.body.innerHTML='<p style="padding:30px">2025年度データを読み込めませんでした。</p>';return;}

  const originalPrompts=window.SKIMARU_2025_ORIGINAL_PROMPTS||[];
  const groupDefs={
    1:[
      {range:[1,1],label:"設問1 / 5",prompt:"この安全衛生活動の名称として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t1_sheet.webp"},
      {range:[2,3],label:"設問2 / 5",prompt:"1ラウンド「現状把握」に記入する内容のうち、「梯子」と「コンベヤ」に関する記述として、それぞれもっとも適切なものを選択肢から選んでください。",image:"./2025_t1_sheet.webp"},
      {range:[4,4],label:"設問3 / 5",prompt:"2ラウンド「本質追究」で行う内容として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t1_sheet.webp"},
      {range:[5,5],label:"設問4 / 5",prompt:"3ラウンド「対策樹立」に記入する内容のうち、「コンベヤ」に関する記述として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t1_sheet.webp"},
      {range:[6,6],label:"設問5 / 5",prompt:"4ラウンド「目標設定」まで終えた後、実施結果をメンバーがいつでも把握できるようにするために有効なツールとして、もっとも適切なものを選択肢から選んでください。",image:"./2025_t1_sheet.webp"}
    ],
    2:[
      {range:[7,10],label:"設問1 / 2",prompt:"【TPMの定義】の空欄⑦〜⑩に当てはまる語句として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t2_definition.webp"},
      {range:[11,14],label:"設問2 / 2",prompt:"【TPMの8本柱】の空欄⑪〜⑭に当てはまる語句として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t2_pillars.webp"}
    ],
    3:[{range:[15,21],label:"設問1 / 1",prompt:"【目で見る管理の例】の空欄⑮〜㉑に当てはまる語句として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t3_visual.webp"}],
    4:[
      {range:[22,29],label:"設問1 / 2",prompt:"【自主保全活動の第1〜3ステップ】の空欄㉒〜㉙に当てはまる語句として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t4_steps.webp"},
      {range:[30,30],label:"設問2 / 2",prompt:"自主保全活動の第1〜3ステップと活動例の組み合わせとして、もっとも適切なものを選択肢から選んでください。",image:"./2025_t4_steps.webp"}
    ],
    5:[
      {range:[31,35],label:"設問1 / 3",prompt:"【QCストーリーの一般的な手順】の空欄㉛〜㉟に当てはまる手順として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t5_story.webp"},
      {range:[36,38],label:"設問2 / 3",prompt:"【用いた品質管理手法】の空欄㊱〜㊳に当てはまる名称として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t5_story.webp"},
      {range:[39,41],label:"設問3 / 3",prompt:"【用いた品質管理手法】の空欄㊴〜㊶に当てはまる概略図として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t5_diagrams.webp"}
    ],
    6:[{range:[42,49],label:"設問1 / 1",prompt:"【改善の4原則（ECRS）】【5W2Hによる質問法】の空欄㊷〜㊾に当てはまる語句として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t6_ie.webp"}],
    7:[
      {range:[50,52],label:"設問1 / 3",prompt:"【設備の重要点検ポイント】の空欄50〜52に当てはまる名称として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t7_equipment.webp"},
      {range:[53,55],label:"設問2 / 3",prompt:"【設備の重要点検ポイント】の空欄53〜55に当てはまる機能として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t7_equipment.webp"},
      {range:[56,57],label:"設問3 / 3",prompt:"【設備の重要点検ポイント】の空欄56〜57に当てはまる点検ポイントの例として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t7_equipment.webp"}
    ],
    8:[
      {range:[58,59],label:"設問1 / 3",prompt:"工作物Aの正面図、平面図として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t8_a.webp"},
      {range:[60,61],label:"設問2 / 3",prompt:"工作物Bの正面図、右側面図として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t8_b.webp"},
      {range:[62,63],label:"設問3 / 3",prompt:"工作物Cの図面に示されたa、bの線の名称として、もっとも適切なものを選択肢から選んでください。",image:"./2025_t8_c.webp"}
    ],
    9:[{range:[64,72],label:"設問1 / 1",prompt:"空欄64〜72に当てはまる記述として、もっとも適切なものを選択肢から選んでください。",imageA:"./2025_t9_a.webp",imageB:"./2025_t9_b.webp"}]
  };

  const taskInfo={
    1:{category:"安全・環境",title:"課題1：危険予知訓練"},2:{category:"TPM",title:"課題2：TPM"},3:{category:"自主保全",title:"課題3：自主保全活動の支援ツール"},4:{category:"自主保全",title:"課題4：自主保全ステップ"},5:{category:"改善・解析",title:"課題5：QCストーリー"},6:{category:"改善・解析",title:"課題6：作業改善のためのIE"},7:{category:"設備保全",title:"課題7：設備保全の基礎"},8:{category:"図面・測定",title:"課題8：図面の見方"},9:{category:"効率化とロス",title:"課題9：効率化を阻害するロス"}
  };

  function emptyState(){return {version:VERSION,branch:null,answers:{},startedAt:new Date().toISOString(),completedAt:null,synced:false};}
  function loadState(){try{return Object.assign(emptyState(),JSON.parse(localStorage.getItem(STORE)||"null")||{});}catch(e){return emptyState();}}
  let state=loadState();
  let selected=null;
  let current=1;
  let toastTimer=null;

  const $=id=>document.getElementById(id);
  function save(){localStorage.setItem(STORE,JSON.stringify(state));}
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1800);}
  function taskFor(n,branch=state.branch){if(n<=63){return tasks.find(t=>t.blanks.some(b=>Number(String(b.id).replace("q",""))===n));}return tasks.find(t=>t.choiceBranch===branch);}
  function blankFor(n){const t=taskFor(n);return t?.blanks.find(b=>Number(String(b.id).replace("q",""))===n);}
  function taskNoFor(n){if(n<=6)return 1;if(n<=14)return 2;if(n<=21)return 3;if(n<=30)return 4;if(n<=41)return 5;if(n<=49)return 6;if(n<=57)return 7;if(n<=63)return 8;return 9;}
  function groupFor(n){const t=taskNoFor(n);return groupDefs[t].find(g=>n>=g.range[0]&&n<=g.range[1]);}
  function taskAnsweredCount(taskNo){const ranges={1:[1,6],2:[7,14],3:[15,21],4:[22,30],5:[31,41],6:[42,49],7:[50,57],8:[58,63],9:[64,72]};const [a,b]=ranges[taskNo];let c=0;for(let n=a;n<=b;n++)if(state.answers[n])c++;return c;}

  function showScreen(id){document.body.style.overflow='';for(const el of document.querySelectorAll('.screen')){const on=el.id===id;el.classList.toggle('active',on);el.setAttribute('aria-hidden',String(!on));}window.scrollTo({top:0,behavior:'auto'});}
  function imageFor(n){const g=groupFor(n);if(taskNoFor(n)===9)return state.branch==='B'?g.imageB:g.imageA;return g.image;}
  const taskRanges=[[1,6],[7,14],[15,21],[22,30],[31,41],[42,49],[50,57],[58,63],[64,72]];
  function closeTaskJump(){
    $('taskJumpPanel').hidden=true;
    $('taskJumpBackdrop').hidden=true;
    $('taskJumpBtn').setAttribute('aria-expanded','false');
  }
  function updateTaskJump(){
    const t=taskNoFor(Math.min(current,72));
    $('taskJumpBtn').innerHTML=`課題${t} / 9 <span aria-hidden="true">⌄</span>`;
    const host=$('taskJumpList');host.innerHTML='';
    taskRanges.forEach(([start,end],i)=>{
      const num=i+1, total=end-start+1;
      let answered=0;
      for(let n=start;n<=end;n++)if(state.answers[n])answered++;
      const btn=document.createElement('button');btn.type='button';
      btn.className='task-jump-item'+(num===t?' is-current':'');
      btn.setAttribute('aria-label',`${taskInfo[num].title}、${answered}/${total}問解答済み`);
      btn.innerHTML=`<span class="task-jump-number">${num}</span><span class="task-jump-name">${escapeHtml(taskInfo[num].title.replace(/^課題\d+：/,''))}<small>${start}〜${end}問・${answered}/${total}問 解答済み</small></span><span class="task-jump-state">${answered===total?'✓':num===t?'現在':'›'}</span>`;
      btn.addEventListener('click',()=>{
        closeTaskJump();
        if(num===9&&!state.branch){current=64;showBranch();return;}
        let target=start;
        while(target<=end&&state.answers[target])target++;
        current=target<=end?target:start;
        render();
      });
      host.appendChild(btn);
    });
  }
  function updateQuestionGrid(){
    const done=Object.keys(state.answers).filter(k=>Number(k)>=1&&Number(k)<=TOTAL).length;
    $('answerProgress').textContent=`回答済み ${done} / ${TOTAL}・未回答 ${TOTAL-done}`;
    const btn=$('jumpUnansweredBtn');btn.disabled=done===TOTAL;
    btn.textContent=done===TOTAL?'全問回答済み ✓':'次の未回答へ →';
    const grid=$('questionGrid');grid.replaceChildren();
    for(let n=1;n<=TOTAL;n++){
      const b=document.createElement('button');b.type='button';b.textContent=String(n);
      const answered=Boolean(state.answers[n]);
      b.className=(answered?'answered':'unanswered')+(n===current?' current':'');
      b.setAttribute('aria-label',`問題${n}：${answered?'回答済み':'未回答'}`);
      if(n===current)b.setAttribute('aria-current','step');
      b.addEventListener('click',()=>{current=n;if(n>=BRANCH_START&&n<=BRANCH_END&&!state.branch){showBranch();return;}render();});
      grid.appendChild(b);
    }
  }
  function jumpToUnanswered(){
    let target=null;
    for(let n=current+1;n<=TOTAL;n++)if(!state.answers[n]){target=n;break;}
    if(target===null)for(let n=1;n<=current;n++)if(!state.answers[n]){target=n;break;}
    if(target===null){toast('全問回答済みです');return;}
    current=target;if(current>=BRANCH_START&&current<=BRANCH_END&&!state.branch){showBranch();return;}render();
  }
  function openTaskJump(){
    updateTaskJump();
    $('taskJumpPanel').hidden=false;
    $('taskJumpBackdrop').hidden=false;
    $('taskJumpBtn').setAttribute('aria-expanded','true');
  }
  function render(){
    if(current===64&&!state.branch){showBranch();return;}
    if(current>72){current=72;}
    showScreen('examScreen');
    const tno=taskNoFor(current), info=taskInfo[tno], group=groupFor(current), blank=blankFor(current);
    if(!blank){toast('問題データを読み込めませんでした');return;}
    $('topMeta').textContent=`課題${tno} / 9`;
    $('topCount').textContent=`${current} / 72`;
    updateTaskJump();
    updateQuestionGrid();
    $('progressBar').style.width=`${(current-1)/72*100}%`;
    $('category').textContent=info.category;
    $('groupLabel').textContent=group.label;
    $('taskTitle').textContent=info.title+(tno===9?`（選択${state.branch}）`:"");
    const original=originalPrompts.find(x=>current>=x.start&&current<=x.end&&(!x.branch||x.branch===state.branch));
    $('groupPrompt').textContent=cleanOriginalPrompt(original?.prompt||group.prompt);
    $('focusLabel').textContent=blank.label;
    $('focusDetail').textContent=focusDescription(current,group,blank);
    $('blankLabel').textContent=blank.label;
    $('questionCaption').textContent=`【${blank.label}】の解答を選んでください。`;
    renderOfficialPages(current);
    selected=null;
    const saved=state.answers[current];
    const list=$('choiceList');list.innerHTML='';
    blank.choices.forEach((choice,idx)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='choice';btn.dataset.index=idx;
      const m=/^([ア-ンA-Z])．?(.*)$/.exec(choice);const mark=m?m[1]:String(idx+1);const body=m?m[2].trim():choice;
      btn.innerHTML=`<i>${mark}</i><span>${escapeHtml(body)}</span>`;
      btn.addEventListener('click',()=>pick(idx));list.appendChild(btn);
    });
    $('feedback').className='feedback';$('feedback').innerHTML='';
    $('submitBtn').classList.remove('hide');$('nextBtn').classList.add('hide');$('submitBtn').disabled=true;
    $('prevBtn').disabled=current===1;
    if(saved){applyAnswered(saved,blank);}else{list.scrollTop=0;}
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function cleanOriginalPrompt(prompt){
    return String(prompt||'').replace(/\s+/g,' ').replace(/、\s+/g,'、').trim();
  }
  function focusDescription(n,group,blank){
    // Show only the current blank and the original section title. Never render
    // the synthetic material text or its internal {{qN}} placeholders.
    const titles={1:'安全衛生活動',2:n<=10?'TPMの定義':'TPMの8本柱',3:'目で見る管理',4:'自主保全',5:n<=35?'QCストーリーの手順':n<=38?'品質管理手法':'QCストーリーの図',6:'IE',7:'設備保全',8:'図面',9:'設備効率・ロス'};
    return `${titles[taskNoFor(n)]||group.label}の【${blank.label}】を選択`;
  }
  function figureFor(n){
    const task=taskNoFor(n);
    if(task===1)return './figure_2025_p12.png';
    if(task===2)return n<=10?'./figure_2025_p14.png':'./figure_2025_p15.png';
    if(task===3)return './figure_2025_p16.png';
    if(task===4)return './figure_2025_p18.png';
    if(task===5)return './figure_2025_p20.png';
    if(task===6)return './figure_2025_p22.png';
    if(task===7)return './figure_2025_p24.png';
    if(task===8)return `./figure_2025_p${n<=59?26:n<=61?27:28}.png`;
    return `./figure_2025_p${state.branch==='B'?31:30}.png`;
  }
  function blankNumberFromId(id){
    const m=String(id||"").match(/(\d+)/);
    return m?Number(m[1]):null;
  }
  // Official source page for each question. The original paper is the authority;
  // no synthetic placeholders or reconstructed text are shown as exam wording.
  // Source pages always follow the original paper's ascending order.
  // Do not include blank pages (PDF p19 and p23).
  const officialPages={
    1:[12,13],2:[12,13],3:[12,13],4:[12,13],5:[12,13],6:[12,13],
    7:[14,15],8:[14,15],9:[14,15],10:[14,15],
    11:[14,15],12:[14,15],13:[14,15],14:[14,15],
    15:[16,17],16:[16,17],17:[16,17],18:[16,17],19:[16,17],20:[16,17],21:[16,17],
    22:[18],23:[18],24:[18],25:[18],26:[18],27:[18],28:[18],29:[18],30:[18],
    31:[20,21],32:[20,21],33:[20,21],34:[20,21],35:[20,21],
    36:[20,21],37:[20,21],38:[20,21],39:[20,21],40:[20,21],41:[20,21],
    42:[22],43:[22],44:[22],45:[22],46:[22],47:[22],48:[22],49:[22],
    50:[24,25],51:[24,25],52:[24,25],53:[24,25],54:[24,25],55:[24,25],56:[24,25],57:[24,25],
    58:[26],59:[26],60:[27],61:[27],62:[28],63:[28]
  };
  function renderOfficialPages(n){
    const pageList=n>=64?[state.branch==='B'?31:30]:(officialPages[n]||[]);
    const host=$('originalPages');host.replaceChildren();
    pageList.forEach((page,index)=>{
      const section=document.createElement('section');section.className='official-page';
      const heading=document.createElement('div');heading.className='official-page-label';
      heading.textContent=`原本 ${page-4}ページ`;
      const img=document.createElement('img');
      img.loading=index?'lazy':'eager';img.decoding='async';
      img.src=`./official_2025_p${page}.png`;
      img.alt=`2025年度 実技 原本 ${page-4}ページ`;
      img.className='original-inline-image';
      section.append(heading,img);host.appendChild(section);
    });
  }
  function pick(idx){if(state.completedAt)return;selected=idx;if(state.answers[current]){state.answers[current]={picked:idx,at:new Date().toISOString()};save();updateQuestionGrid();applyAnswered(state.answers[current],blankFor(current));}else{for(const b of $('choiceList').children)b.classList.toggle('selected',Number(b.dataset.index)===idx);$('submitBtn').disabled=false;}}
  function submit(){if(selected===null||state.completedAt)return;state.answers[current]={picked:selected,at:new Date().toISOString()};state.synced=false;save();updateQuestionGrid();applyAnswered(state.answers[current],blankFor(current));}
  function firstUnanswered(){for(let i=1;i<=72;i++)if(!state.answers[i])return i;return null;}
  function applyAnswered(answer,blank){
    selected=answer.picked;
    for(const b of $('choiceList').children){
      const idx=Number(b.dataset.index);
      b.disabled=Boolean(state.completedAt);
      b.classList.toggle('selected',idx===answer.picked);
      b.classList.remove('correct','wrong');
      if(state.completedAt){
        if(idx===blank.answer)b.classList.add('correct');
        if(idx===answer.picked&&idx!==blank.answer)b.classList.add('wrong');
      }
    }
    const fb=$('feedback');
    if(state.completedAt){
      const ok=answer.picked===blank.answer;
      fb.className=`feedback show ${ok?'ok':'ng'}`;
      fb.innerHTML=`<b>${ok?'正解':'不正解'}　正答：${escapeHtml(blank.choices[blank.answer])}</b><span>${escapeHtml(blank.explanation||'')}</span>`;
    }else{
      fb.className='feedback show';
      fb.textContent='回答を保存しました。採点は全問解答後です。別の選択肢で変更できます。';
    }
    $('submitBtn').classList.add('hide');$('nextBtn').classList.remove('hide');
    $('nextBtn').textContent=current===63&&!state.branch?'選択課題へ':current===72?'採点へ':'次へ';
  }
  function next(){
    if(!state.answers[current])return;
    if(current===63&&!state.branch){showBranch();return;}
    if(current===72){
      const missing=firstUnanswered();
      if(missing!==null){toast('未回答があります。未回答の問題へ移動します。');current=missing;render();return;}
      if(!state.branch){showBranch();return;}
      if(!state.completedAt&&!confirm('全72問の回答を確定して、まとめて採点しますか？'))return;
      showResult();return;
    }
    current++;render();
  }
  function prev(){if(current>1){current--;render();}}
  function showBranch(){closeTaskJump();updateTaskJump();showScreen('branchScreen');$('topMeta').textContent='課題9 / 選択式';$('topCount').textContent='64 / 72';$('progressBar').style.width=`${63/72*100}%`;}
  function chooseBranch(branch){state.branch=branch;state.completedAt=null;state.synced=false;save();current=64;render();}
  function correctCount(){let c=0;for(let n=1;n<=72;n++)if(state.answers[n]?.picked===blankFor(n)?.answer)c++;return c;}
  function recordHistory(){
    const key='skimaruExamHistory_v1';
    let history=[];try{history=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(history))history=[];}catch{}
    const id=state.attemptId||(state.attemptId=`2025-jitugi-${Date.now()}`);
    if(history.some(r=>r.id===id))return;
    const correct=correctCount();
    history.push({id,year:2025,kind:'jitugi',total:72,correct,
      rate:Math.round(correct/72*100),completedAt:state.completedAt||new Date().toISOString(),
      branch:state.branch||null});
    localStorage.setItem(key,JSON.stringify(history));save();
  }
  function showResult(){const missing=[];for(let n=1;n<=72;n++)if(!state.answers[n])missing.push(n);if(missing.length){current=missing[0];toast('未回答が'+missing.length+'問あります。全問解答後に採点します。');render();return;}closeTaskJump();updateTaskJump();if(!state.completedAt){state.completedAt=new Date().toISOString();for(let n=1;n<=72;n++)state.answers[n].ok=state.answers[n].picked===blankFor(n)?.answer;save();}recordHistory();syncLegacy();showScreen('resultScreen');$('topMeta').textContent='結果';$('topCount').textContent='72 / 72';$('progressBar').style.width='100%';const c=correctCount(),rate=Math.round(c/72*100);$('resultScore').textContent=c;$('resultRate').textContent=`正答率 ${rate}%・選択${state.branch}`;const list=$('resultTaskList');list.innerHTML='';for(let t=1;t<=9;t++){const total=[6,8,7,9,11,8,8,6,9][t-1];let ok=0;const ranges=[[1,6],[7,14],[15,21],[22,30],[31,41],[42,49],[50,57],[58,63],[64,72]][t-1];for(let n=ranges[0];n<=ranges[1];n++)if(state.answers[n]?.ok)ok++;const row=document.createElement('div');row.className='result-row';row.innerHTML=`<span>${escapeHtml(taskInfo[t].title)}</span><b>${ok} / ${total}</b>`;list.appendChild(row);}const review=document.createElement('div');review.className='answer-review';review.innerHTML='<h2>全72問の正解・解答</h2>';for(let n=1;n<=72;n++){const b=blankFor(n);if(!b)continue;const a=state.answers[n];const line=document.createElement('div');line.className='result-row';line.textContent=`問題${n}　解答：${b.choices[a.picked]}　正解：${b.choices[b.answer]}　${a.ok?'○':'×'}`;review.appendChild(line);}list.appendChild(review);}
  function syncLegacy(){if(state.synced)return;try{const raw=JSON.parse(localStorage.getItem(LEGACY)||'{}')||{};const P=Object.assign({version:'0.2-test',totalTasks:0,totalBlanks:0,correctBlanks:0,wrongTaskIds:[],attempts:{},latestRun:null},raw);if(!P.attempts||typeof P.attempts!=='object')P.attempts={};if(!Array.isArray(P.wrongTaskIds))P.wrongTaskIds=[];const ranges=[[1,6],[7,14],[15,21],[22,30],[31,41],[42,49],[50,57],[58,63],[64,72]];const ids=['Y2025-OFFICIAL-PT01','Y2025-OFFICIAL-PT02','Y2025-OFFICIAL-PT03','Y2025-OFFICIAL-PT04','Y2025-OFFICIAL-PT05','Y2025-OFFICIAL-PT06','Y2025-OFFICIAL-PT07','Y2025-OFFICIAL-PT08',`Y2025-OFFICIAL-PT09${state.branch}`];const results=[];let totalCorrect=0;for(let i=0;i<9;i++){let correct=0;for(let n=ranges[i][0];n<=ranges[i][1];n++)if(state.answers[n]?.ok)correct++;totalCorrect+=correct;const total=ranges[i][1]-ranges[i][0]+1;const id=ids[i],old=P.attempts[id]||{count:0,best:0};P.attempts[id]={count:(old.count||0)+1,best:Math.max(old.best||0,correct),lastCorrect:correct,lastTotal:total,lastAt:new Date().toISOString(),year:2025};if(correct===total)P.wrongTaskIds=P.wrongTaskIds.filter(x=>x!==id);else if(!P.wrongTaskIds.includes(id))P.wrongTaskIds.push(id);results.push({id,title:taskInfo[i+1].title,category:taskInfo[i+1].category,correct,total});}
      P.totalTasks=(P.totalTasks||0)+9;P.totalBlanks=(P.totalBlanks||0)+72;P.correctBlanks=(P.correctBlanks||0)+totalCorrect;P.latestRun={title:`2025年度 実技（選択${state.branch}）`,total:72,correct:totalCorrect,rate:Math.round(totalCorrect/72*100),results,completedAt:new Date().toISOString(),year:2025,branch:state.branch};localStorage.setItem(LEGACY,JSON.stringify(P));state.synced=true;save();}catch(e){console.warn('legacy sync failed',e);}}
  function resetExam(){if(!confirm('2025年度の実技回答をリセットして最初から解きますか？'))return;state=emptyState();save();current=1;render();}
  function exit(){location.href='./practical.html';}

  $('jumpUnansweredBtn').addEventListener('click',jumpToUnanswered);
  $('toggleQuestionGrid').addEventListener('click',()=>{const grid=$('questionGrid');grid.hidden=!grid.hidden;$('toggleQuestionGrid').setAttribute('aria-expanded',String(!grid.hidden));$('toggleQuestionGrid').textContent=grid.hidden?'問題一覧を表示 ▾':'問題一覧を閉じる ▴';});
  $('taskJumpBtn').addEventListener('click',()=>{$('taskJumpPanel').hidden?openTaskJump():closeTaskJump();});
  $('taskJumpClose').addEventListener('click',closeTaskJump);
  $('taskJumpBackdrop').addEventListener('click',closeTaskJump);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTaskJump();});
  $('submitBtn').addEventListener('click',submit);$('nextBtn').addEventListener('click',next);$('prevBtn').addEventListener('click',prev);$('exitBtn').addEventListener('click',exit);$('retryBtn').addEventListener('click',resetExam);document.querySelectorAll('[data-branch]').forEach(b=>b.addEventListener('click',()=>chooseBranch(b.dataset.branch)));

  // Resume at first unanswered question. If 1-63 complete and branch not chosen, show branch chooser.
  let first=1;while(first<=63&&state.answers[first])first++;if(first<=63)current=first;else if(!state.branch){current=64;}else{first=64;while(first<=72&&state.answers[first])first++;current=first<=72?first:72;}
  render();
})();