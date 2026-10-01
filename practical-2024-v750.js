"use strict";
(() => {
  const VERSION="7.5.0";
  const STORE="skimaruPractical2024V750";
  const LEGACY="skimaruPracticalDataTestV1";
  const tasks=(window.SKIMARU_2024_OFFICIAL_TASKS||[]).slice().sort((a,b)=>(a.officialOrder||0)-(b.officialOrder||0));
  if(!tasks.length){document.body.innerHTML='<p style="padding:30px">2024年度データを読み込めませんでした。</p>';return;}

  const originalPrompts=[];
  const groupDefs={
    1:[{range:[1,8],label:"設問 / 課題1",prompt:"原本を確認して、空欄①〜⑧を解答してください。"}],
    2:[{range:[9,13],label:"設問 / 課題2",prompt:"原本を確認して、空欄⑨〜⑬を解答してください。"}],
    3:[{range:[14,20],label:"設問 / 課題3",prompt:"原本を確認して、空欄⑭〜⑳を解答してください。"}],
    4:[{range:[21,29],label:"設問 / 課題4",prompt:"原本を確認して、空欄㉑〜㉙を解答してください。"}],
    5:[{range:[30,33],label:"設問 / 課題5",prompt:"原本を確認して、空欄㉚〜㉝を解答してください。"}],
    6:[{range:[34,41],label:"設問 / 課題6",prompt:"原本を確認して、空欄㉞〜㊶を解答してください。"}],
    7:[{range:[42,51],label:"設問 / 課題7",prompt:"原本を確認して、空欄㊷〜51を解答してください。"}],
    8:[{range:[52,55],label:"設問 / 課題8",prompt:"原本を確認して、空欄52〜55を解答してください。"}],
    9:[{range:[56,59],label:"設問 / 課題9",prompt:"原本を確認して、空欄56〜59を解答してください。"}],
    10:[{range:[60,66],label:"設問 / 課題10",prompt:"原本を確認して、空欄60〜66を解答してください。"}],
    11:[{range:[67,74],label:"設問 / 課題11",prompt:"原本を確認して、空欄67〜74を解答してください。"}],
  };
  const taskInfo={1:{category:"安全・環境",title:"課題1：作業の安全"},2:{category:"5S",title:"課題2：5Sに関する知識"},3:{category:"効率化とロス",title:"課題3：設備効率を阻害するロス"},4:{category:"設備保全",title:"課題4：故障ゼロの考え方"},5:{category:"自主保全",title:"課題5：自主保全活動支援ツール"},6:{category:"自主保全",title:"課題6：発生源・困難個所対策"},7:{category:"改善・解析",title:"課題7：QCストーリー"},8:{category:"改善・解析",title:"課題8：なぜなぜ分析"},9:{category:"改善・解析",title:"課題9：改善の4原則（ECRS）"},10:{category:"設備保全",title:"課題10：検出機器（センサー）"},11:{category:"図面・測定",title:"課題11：図面の見方"}};

  function emptyState(){return {version:VERSION,branch:null,answers:{},startedAt:new Date().toISOString(),completedAt:null,synced:false};}
  function loadState(){try{return Object.assign(emptyState(),JSON.parse(localStorage.getItem(STORE)||"null")||{});}catch(e){return emptyState();}}
  let state=loadState();
  let selected=null;
  let current=1;
  let toastTimer=null;

  const $=id=>document.getElementById(id);
  function save(){localStorage.setItem(STORE,JSON.stringify(state));}
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1800);}
  function taskFor(n,branch=state.branch){const t=taskNoFor(n);return tasks.find(x=>x.officialOrder===t&&(!x.choiceBranch||x.choiceBranch===branch));}
  function blankFor(n){const t=taskFor(n);return t?.blanks.find(b=>Number(String(b.id).replace("q",""))===n);}
  function taskNoFor(n){if(n<=8)return 1;if(n<=13)return 2;if(n<=20)return 3;if(n<=29)return 4;if(n<=33)return 5;if(n<=41)return 6;if(n<=51)return 7;if(n<=55)return 8;if(n<=59)return 9;if(n<=66)return 10;return 11;}
  function groupFor(n){const t=taskNoFor(n);return groupDefs[t].find(g=>n>=g.range[0]&&n<=g.range[1]);}
  function taskAnsweredCount(taskNo){const [a,b]=taskRanges[taskNo-1];let c=0;for(let n=a;n<=b;n++)if(state.answers[n])c++;return c;}

  function showScreen(id){document.body.style.overflow='';for(const el of document.querySelectorAll('.screen')){const on=el.id===id;el.classList.toggle('active',on);el.setAttribute('aria-hidden',String(!on));}window.scrollTo({top:0,behavior:'auto'});}
  function imageFor(n){const g=groupFor(n);if(taskNoFor(n)===9)return state.branch==='B'?g.imageB:g.imageA;return g.image;}
  const taskRanges=[[1,8],[9,13],[14,20],[21,29],[30,33],[34,41],[42,51],[52,55],[56,59],[60,66],[67,74]];
  function closeTaskJump(){
    $('taskJumpPanel').hidden=true;
    $('taskJumpBackdrop').hidden=true;
    $('taskJumpBtn').setAttribute('aria-expanded','false');
  }
  function updateTaskJump(){
    const t=taskNoFor(Math.min(current,74));
    $('taskJumpBtn').innerHTML=`課題${t} / 11 <span aria-hidden="true">⌄</span>`;
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
        if(num===3&&!state.branch){current=14;showBranch();return;}
        let target=start;
        while(target<=end&&state.answers[target])target++;
        current=target<=end?target:start;
        render();
      });
      host.appendChild(btn);
    });
  }
  function openTaskJump(){
    updateTaskJump();
    $('taskJumpPanel').hidden=false;
    $('taskJumpBackdrop').hidden=false;
    $('taskJumpBtn').setAttribute('aria-expanded','true');
  }
  function render(){
    if(current>=14&&current<=20&&!state.branch){showBranch();return;}
    if(current>74){current=74;}
    showScreen('examScreen');
    const tno=taskNoFor(current), info=taskInfo[tno], group=groupFor(current), blank=blankFor(current);
    if(!blank){toast('問題データを読み込めませんでした');return;}
    $('topMeta').textContent=`課題${tno} / 11`;
    $('topCount').textContent=`${current} / 74`;
    updateTaskJump();
    $('progressBar').style.width=`${(current-1)/74*100}%`;
    $('category').textContent=info.category;
    $('groupLabel').textContent=group.label;
    $('taskTitle').textContent=info.title+(tno===3?`（選択${state.branch}）`:"");
    $('groupPrompt').textContent=group.prompt;
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
  function focusDescription(n,group,blank){return `${taskInfo[taskNoFor(n)].title}の【${blank.label}】を選択`;
  }

  function blankNumberFromId(id){
    const m=String(id||"").match(/(\d+)/);
    return m?Number(m[1]):null;
  }
  // 2024 official source pages. Printed page number = PDF page - 3. Blank pages 22 and 24 are omitted.
  const officialPages={
    1:[11,12],2:[11,12],3:[11,12],4:[11,12],5:[13],6:[13],7:[13],8:[13],
    9:[14],10:[14],11:[14],12:[14],13:[14],
    21:[19],22:[19],23:[19],24:[19],25:[19],26:[20],27:[20],28:[20],29:[20],
    30:[21],31:[21],32:[21],33:[21],34:[23],35:[23],36:[23],37:[23],38:[23],39:[23],40:[23],41:[23],
    42:[25],43:[25],44:[25],45:[25],46:[25],47:[25],48:[25],49:[26],50:[26],51:[26],
    52:[27],53:[27],54:[27],55:[27],56:[28],57:[28],58:[28],59:[28],
    60:[29],61:[29],62:[30],63:[30],64:[30],65:[30],66:[30],67:[31],68:[31],69:[31],70:[32],71:[32],72:[32],73:[32],74:[32]
  };
  function renderOfficialPages(n){
    let pageList;if(n>=14&&n<=20)pageList=state.branch==='B'?[17,18]:[15,16];else pageList=officialPages[n]||[];
    const host=$('originalPages');host.replaceChildren();
    pageList.forEach((page,index)=>{const section=document.createElement('section');section.className='official-page';const heading=document.createElement('div');heading.className='official-page-label';heading.textContent=`原本 ${page-3}ページ`;const img=document.createElement('img');img.loading=index?'lazy':'eager';img.decoding='async';img.src=`./official_2024_p${page}.png`;img.alt=`2024年度 実技 原本 ${page-3}ページ`;img.className='original-inline-image';section.append(heading,img);host.appendChild(section);});
  }
  function pick(idx){if(state.completedAt)return;selected=idx;if(state.answers[current]){state.answers[current]={picked:idx,at:new Date().toISOString()};save();applyAnswered(state.answers[current],blankFor(current));}else{for(const b of $('choiceList').children)b.classList.toggle('selected',Number(b.dataset.index)===idx);$('submitBtn').disabled=false;}}
  function submit(){if(selected===null||state.completedAt)return;state.answers[current]={picked:selected,at:new Date().toISOString()};state.synced=false;save();applyAnswered(state.answers[current],blankFor(current));}
  function firstUnanswered(){for(let i=1;i<=74;i++)if(!state.answers[i])return i;return null;}
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
    $('nextBtn').textContent=current===13&&!state.branch?'選択課題へ':current===74?'採点へ':'次へ';
  }
  function next(){
    if(!state.answers[current])return;
    if(current===13&&!state.branch){showBranch();return;}
    if(current===74){
      const missing=firstUnanswered();
      if(missing!==null){toast('未回答があります。未回答の問題へ移動します。');current=missing;render();return;}
      if(!state.branch){showBranch();return;}
      if(!state.completedAt&&!confirm('全74問の回答を確定して、まとめて採点しますか？'))return;
      showResult();return;
    }
    current++;render();
  }
  function prev(){if(current>1){current--;render();}}
  function showBranch(){closeTaskJump();updateTaskJump();showScreen('branchScreen');$('topMeta').textContent='課題3 / 選択式';$('topCount').textContent='14 / 74';$('progressBar').style.width=`${13/74*100}%`;}
  function chooseBranch(branch){if(state.branch&&state.branch!==branch){for(let n=14;n<=20;n++)delete state.answers[n];}state.branch=branch;state.completedAt=null;state.synced=false;save();current=14;render();}
  function correctCount(){let c=0;for(let n=1;n<=74;n++)if(state.answers[n]?.picked===blankFor(n)?.answer)c++;return c;}
  function showResult(){const missing=[];for(let n=1;n<=74;n++)if(!state.answers[n])missing.push(n);if(missing.length){current=missing[0];toast('未回答が'+missing.length+'問あります。全問解答後に採点します。');render();return;}closeTaskJump();if(!state.completedAt){state.completedAt=new Date().toISOString();for(let n=1;n<=74;n++)state.answers[n].ok=state.answers[n].picked===blankFor(n)?.answer;save();}showScreen('resultScreen');$('topMeta').textContent='結果';$('topCount').textContent='74 / 74';$('progressBar').style.width='100%';const c=correctCount(),rate=Math.round(c/74*100);$('resultScore').textContent=c;$('resultRate').textContent=`正答率 ${rate}%・課題3 選択${state.branch}`;const list=$('resultTaskList');list.innerHTML='';taskRanges.forEach((r,i)=>{let ok=0;for(let n=r[0];n<=r[1];n++)if(state.answers[n]?.ok)ok++;const row=document.createElement('div');row.className='result-row';row.innerHTML=`<span>${escapeHtml(taskInfo[i+1].title)}</span><b>${ok} / ${r[1]-r[0]+1}</b>`;list.appendChild(row);});const review=document.createElement('div');review.className='answer-review';review.innerHTML='<h2>全74問の正解・解答</h2>';for(let n=1;n<=74;n++){const b=blankFor(n);if(!b)continue;const a=state.answers[n];const line=document.createElement('div');line.className='result-row';line.textContent=`問題${n}　解答：${b.choices[a.picked]}　正解：${b.choices[b.answer]}　${a.ok?'○':'×'}`;review.appendChild(line);}list.appendChild(review);}
  function resetExam(){if(!confirm('2024年度の実技回答をリセットして最初から解きますか？'))return;state=emptyState();save();current=1;render();}
  function exit(){location.href='./practical.html';}

  $('taskJumpBtn').addEventListener('click',()=>{$('taskJumpPanel').hidden?openTaskJump():closeTaskJump();});
  $('taskJumpClose').addEventListener('click',closeTaskJump);
  $('taskJumpBackdrop').addEventListener('click',closeTaskJump);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTaskJump();});
  $('submitBtn').addEventListener('click',submit);$('nextBtn').addEventListener('click',next);$('prevBtn').addEventListener('click',prev);$('exitBtn').addEventListener('click',exit);$('retryBtn').addEventListener('click',resetExam);document.querySelectorAll('[data-branch]').forEach(b=>b.addEventListener('click',()=>chooseBranch(b.dataset.branch)));

  // Resume at the first unanswered question across all 74 questions.
  let first=1;while(first<=74&&state.answers[first])first++;
  current=first<=74?first:74;
  render();
})();