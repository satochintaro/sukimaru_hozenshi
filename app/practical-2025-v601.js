"use strict";
(() => {
  const VERSION="6.0.1";
  const STORE="skimaruPractical2025V600";
  const LEGACY="skimaruPracticalDataTestV1";
  const tasks=(window.SKIMARU_2025_OFFICIAL_TASKS||[]).slice().sort((a,b)=>(a.officialOrder||0)-(b.officialOrder||0));
  if(!tasks.length){document.body.innerHTML='<p style="padding:30px">2025年度データを読み込めませんでした。</p>';return;}

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

  function showScreen(id){for(const el of document.querySelectorAll('.screen')){const on=el.id===id;el.classList.toggle('active',on);el.setAttribute('aria-hidden',String(!on));}window.scrollTo({top:0,behavior:'auto'});}
  function imageFor(n){const g=groupFor(n);if(taskNoFor(n)===9)return state.branch==='B'?g.imageB:g.imageA;return g.image;}
  function render(){
    if(current===64&&!state.branch){showBranch();return;}
    if(current>72){showResult();return;}
    showScreen('examScreen');
    const tno=taskNoFor(current), info=taskInfo[tno], group=groupFor(current), blank=blankFor(current);
    if(!blank){toast('問題データを読み込めませんでした');return;}
    $('topMeta').textContent=`課題${tno} / 9`;
    $('topCount').textContent=`${current} / 72`;
    $('progressBar').style.width=`${(current-1)/72*100}%`;
    $('category').textContent=info.category;
    $('groupLabel').textContent=group.label;
    $('taskTitle').textContent=info.title+(tno===9?`（選択${state.branch}）`:"");
    $('groupPrompt').textContent=group.prompt;
    $('blankLabel').textContent=blank.label;
    $('focusNo').textContent=blank.label;
    $('focusText').innerHTML=contextHtmlFor(current,taskFor(current));
    $('referenceBlank').textContent=blank.label;
    $('questionCaption').textContent=`上の回答箇所【${blank.label}】に当てはまるものを選んでください。`;
    const src=imageFor(current);$('referenceImage').src=src;$('referenceImage').alt=`${info.title} ${group.label}の参照図・現在の回答箇所 ${blank.label}`;
    $('imageButton').onclick=()=>openZoom(src);
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
  function blankNumberFromId(id){
    const m=String(id||"").match(/(\d+)/);
    return m?Number(m[1]):null;
  }
  function contextHtmlFor(n,task){
    const token=`{{q${n}}}`;
    const material=String(task?.material||"");
    const lines=material.split(/\n/);
    let line=lines.find(x=>x.includes(token))||material;
    if(!line) return `回答箇所：【${escapeHtml(blankFor(n)?.label||n)}】`;

    const escaped=escapeHtml(line);
    return escaped.replace(/\{\{q(\d+)\}\}/g,(_,numText)=>{
      const num=Number(numText);
      const b=task?.blanks?.find(x=>blankNumberFromId(x.id)===num);
      const label=b?.label||String(num);
      if(num===n){
        return `<mark class="focus-hole">【${escapeHtml(label)}】</mark>`;
      }
      return `<span class="near-hole">【${escapeHtml(label)}】</span>`;
    });
  }
  function pick(idx){if(state.answers[current])return;selected=idx;for(const b of $('choiceList').children)b.classList.toggle('selected',Number(b.dataset.index)===idx);$('submitBtn').disabled=false;}
  function submit(){const blank=blankFor(current);if(selected===null)return;const ok=selected===blank.answer;state.answers[current]={picked:selected,ok,at:new Date().toISOString()};state.completedAt=null;state.synced=false;save();applyAnswered(state.answers[current],blank);}
  function applyAnswered(answer,blank){for(const b of $('choiceList').children){const idx=Number(b.dataset.index);b.disabled=true;b.classList.remove('selected','correct','wrong');if(idx===blank.answer)b.classList.add('correct');if(idx===answer.picked&&idx!==blank.answer)b.classList.add('wrong');}
    const fb=$('feedback');fb.className=`feedback show ${answer.ok?'ok':'ng'}`;fb.innerHTML=`<b>${answer.ok?'正解':'不正解'}　正答：${escapeHtml(blank.choices[blank.answer])}</b><span>${escapeHtml(blank.explanation||'')}</span>`;
    $('submitBtn').classList.add('hide');$('nextBtn').classList.remove('hide');$('nextBtn').textContent=current===63&&!state.branch?'課題9を選ぶ':current===72?'結果を見る':'次へ';
  }
  function next(){if(!state.answers[current])return;if(current===63&&!state.branch){showBranch();return;}current++;render();}
  function prev(){if(current>1){current--;render();}}
  function showBranch(){showScreen('branchScreen');$('topMeta').textContent='課題9 / 選択式';$('topCount').textContent='64 / 72';$('progressBar').style.width=`${63/72*100}%`;}
  function chooseBranch(branch){state.branch=branch;state.completedAt=null;state.synced=false;save();current=64;render();}
  function correctCount(){let c=0;for(let n=1;n<=72;n++)if(state.answers[n]?.ok)c++;return c;}
  function showResult(){state.completedAt=state.completedAt||new Date().toISOString();save();syncLegacy();showScreen('resultScreen');$('topMeta').textContent='結果';$('topCount').textContent='72 / 72';$('progressBar').style.width='100%';const c=correctCount(),rate=Math.round(c/72*100);$('resultScore').textContent=c;$('resultRate').textContent=`正答率 ${rate}%・選択${state.branch}`;const list=$('resultTaskList');list.innerHTML='';for(let t=1;t<=9;t++){const total=[6,8,7,9,11,8,8,6,9][t-1];let ok=0;const ranges=[[1,6],[7,14],[15,21],[22,30],[31,41],[42,49],[50,57],[58,63],[64,72]][t-1];for(let n=ranges[0];n<=ranges[1];n++)if(state.answers[n]?.ok)ok++;const row=document.createElement('div');row.className='result-row';row.innerHTML=`<span>${escapeHtml(taskInfo[t].title)}</span><b>${ok} / ${total}</b>`;list.appendChild(row);}}
  function syncLegacy(){if(state.synced)return;try{const raw=JSON.parse(localStorage.getItem(LEGACY)||'{}')||{};const P=Object.assign({version:'0.2-test',totalTasks:0,totalBlanks:0,correctBlanks:0,wrongTaskIds:[],attempts:{},latestRun:null},raw);if(!P.attempts||typeof P.attempts!=='object')P.attempts={};if(!Array.isArray(P.wrongTaskIds))P.wrongTaskIds=[];const ranges=[[1,6],[7,14],[15,21],[22,30],[31,41],[42,49],[50,57],[58,63],[64,72]];const ids=['Y2025-OFFICIAL-PT01','Y2025-OFFICIAL-PT02','Y2025-OFFICIAL-PT03','Y2025-OFFICIAL-PT04','Y2025-OFFICIAL-PT05','Y2025-OFFICIAL-PT06','Y2025-OFFICIAL-PT07','Y2025-OFFICIAL-PT08',`Y2025-OFFICIAL-PT09${state.branch}`];const results=[];let totalCorrect=0;for(let i=0;i<9;i++){let correct=0;for(let n=ranges[i][0];n<=ranges[i][1];n++)if(state.answers[n]?.ok)correct++;totalCorrect+=correct;const total=ranges[i][1]-ranges[i][0]+1;const id=ids[i],old=P.attempts[id]||{count:0,best:0};P.attempts[id]={count:(old.count||0)+1,best:Math.max(old.best||0,correct),lastCorrect:correct,lastTotal:total,lastAt:new Date().toISOString(),year:2025};if(correct===total)P.wrongTaskIds=P.wrongTaskIds.filter(x=>x!==id);else if(!P.wrongTaskIds.includes(id))P.wrongTaskIds.push(id);results.push({id,title:taskInfo[i+1].title,category:taskInfo[i+1].category,correct,total});}
      P.totalTasks=(P.totalTasks||0)+9;P.totalBlanks=(P.totalBlanks||0)+72;P.correctBlanks=(P.correctBlanks||0)+totalCorrect;P.latestRun={title:`2025年度 実技（選択${state.branch}）`,total:72,correct:totalCorrect,rate:Math.round(totalCorrect/72*100),results,completedAt:new Date().toISOString(),year:2025,branch:state.branch};localStorage.setItem(LEGACY,JSON.stringify(P));state.synced=true;save();}catch(e){console.warn('legacy sync failed',e);}}
  function openZoom(src){$('zoomImage').src=src;$('zoom').classList.add('show');$('zoom').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeZoom(){$('zoom').classList.remove('show');$('zoom').setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function resetExam(){if(!confirm('2025年度の実技回答をリセットして最初から解きますか？'))return;state=emptyState();save();current=1;render();}
  function exit(){location.href='./practical.html';}

  $('submitBtn').addEventListener('click',submit);$('nextBtn').addEventListener('click',next);$('prevBtn').addEventListener('click',prev);$('exitBtn').addEventListener('click',exit);$('zoomClose').addEventListener('click',closeZoom);$('zoom').addEventListener('click',e=>{if(e.target===$('zoom'))closeZoom();});$('retryBtn').addEventListener('click',resetExam);document.querySelectorAll('[data-branch]').forEach(b=>b.addEventListener('click',()=>chooseBranch(b.dataset.branch)));

  // Resume at first unanswered question. If 1-63 complete and branch not chosen, show branch chooser.
  let first=1;while(first<=63&&state.answers[first])first++;if(first<=63)current=first;else if(!state.branch){current=64;}else{first=64;while(first<=72&&state.answers[first])first++;current=first<=72?first:73;}
  render();
})();