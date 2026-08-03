"use strict";

const TASKS = window.PRACTICAL_TASKS || [];
const STORAGE_KEY = "skimaruPracticalDataTestV1";
const PRACTICAL_VERSION = "0.2-test";
const ACADEMIC_STORAGE_KEY = "skimaruData";
const CLOUD = window.SKIMARU_SUPABASE || {};

function basePracticalData(){
  return {version:PRACTICAL_VERSION,totalTasks:0,totalBlanks:0,correctBlanks:0,wrongTaskIds:[],attempts:{},latestRun:null};
}
function loadPracticalData(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!raw||typeof raw!=="object")return basePracticalData();
    return Object.assign(basePracticalData(),raw,{attempts:raw.attempts&&typeof raw.attempts==="object"?raw.attempts:{},wrongTaskIds:Array.isArray(raw.wrongTaskIds)?raw.wrongTaskIds:[]});
  }catch(e){return basePracticalData();}
}
function savePracticalData(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(P));}catch(e){notifyPractical("成績を保存できませんでした");}
}
function escPractical(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function shufflePractical(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

let P=loadPracticalData();
let R={queue:[],index:0,answers:{},choiceOrders:{},judged:false,correct:0,total:0,title:"実技演習",results:[]};
let toastTimer=null;

function notifyPractical(message){
  const el=document.getElementById("pt-toast");if(!el)return;
  el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
}
function showPractical(id){
  document.querySelectorAll("body > section").forEach(section=>{
    const active=section.id===id;section.classList.toggle("active",active);section.setAttribute("aria-hidden",String(!active));
  });
  window.scrollTo({top:0,behavior:"auto"});
}
function practicalAccuracy(){return P.totalBlanks?Math.round(P.correctBlanks/P.totalBlanks*100):0;}
function renderPracticalHome(){
  document.getElementById("pt-total").textContent=P.totalTasks;
  document.getElementById("pt-accuracy").textContent=P.totalBlanks?practicalAccuracy()+"%":"—";
  document.getElementById("pt-wrong").textContent=P.wrongTaskIds.length;
  const retry=document.getElementById("pt-retry");retry.disabled=P.wrongTaskIds.length===0;
  const categories=[...new Set(TASKS.map(task=>task.category))];
  const list=document.getElementById("pt-categories");list.innerHTML="";
  categories.forEach(category=>{
    const tasks=TASKS.filter(task=>task.category===category),answered=tasks.filter(task=>P.attempts[task.id]).length;
    const button=document.createElement("button");button.className="pt-category";
    button.innerHTML=`<span><b>${escPractical(category)}</b><small>${tasks.length}課題</small></span><span>${answered}/${tasks.length}<i>›</i></span>`;
    button.addEventListener("click",()=>startPractical(tasks,category));list.appendChild(button);
  });
  showPractical("pt-home");
}
function startPractical(tasks=TASKS,title="実技10課題テスト"){
  if(!tasks.length){notifyPractical("対象の課題がありません");return;}
  R={queue:[...tasks],index:0,answers:{},choiceOrders:{},judged:false,correct:0,total:0,title,results:[]};
  document.getElementById("pt-quiz-title").textContent=title;renderPracticalTask();showPractical("pt-quiz");
}
function startPracticalTest(){startPractical(shufflePractical(TASKS).slice(0,10),"ランダム10課題模試");}
function startWrongPractical(){
  const tasks=TASKS.filter(task=>P.wrongTaskIds.includes(task.id));startPractical(tasks,"間違えた課題の復習");
}
function materialHtml(task){
  return escPractical(task.material).replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g,(_,id)=>{
    const blank=task.blanks.find(item=>item.id===id),answer=R.answers[id];
    return `<span class="pt-inline-blank${answer===undefined?"":" filled"}" id="pt-inline-${escPractical(id)}">${escPractical(blank?.label||id)} ${answer===undefined?"未回答":escPractical(blank.choices[answer])}</span>`;
  });
}
function renderPracticalTask(){
  const task=R.queue[R.index];R.answers={};R.choiceOrders={};R.judged=false;
  document.getElementById("pt-task-category").textContent=task.category;
  document.getElementById("pt-task-no").textContent=`課題 ${R.index+1} / ${R.queue.length}`;
  document.getElementById("pt-task-title").textContent=task.title;
  document.getElementById("pt-task-instruction").textContent=task.instruction;
  document.getElementById("pt-task-material").innerHTML=materialHtml(task);
  const figure=document.getElementById("pt-task-figure");
  if(task.figure){figure.innerHTML=`<img src="${escPractical(task.figure)}" alt="${escPractical(task.figureAlt||"")}">`;figure.classList.remove("hide");}
  else{figure.innerHTML="";figure.classList.add("hide");}
  const answerArea=document.getElementById("pt-answer-area");answerArea.innerHTML="";
  task.blanks.forEach(blank=>{
    const field=document.createElement("fieldset");field.className="pt-blank-card";field.id=`pt-blank-${blank.id}`;
    const legend=document.createElement("legend");legend.innerHTML=`<span>${escPractical(blank.label)}</span> 空欄に入る語句`;field.appendChild(legend);
    const choices=document.createElement("div");choices.className="pt-choice-grid";
    const order=shufflePractical(blank.choices.map((_,index)=>index));R.choiceOrders[blank.id]=order;
    order.forEach(choiceIndex=>{
      const button=document.createElement("button");button.type="button";button.className="pt-choice";button.textContent=blank.choices[choiceIndex];button.dataset.choiceIndex=String(choiceIndex);
      button.addEventListener("click",()=>selectPracticalChoice(blank.id,choiceIndex));choices.appendChild(button);
    });
    field.appendChild(choices);answerArea.appendChild(field);
  });
  document.getElementById("pt-feedback").innerHTML="";document.getElementById("pt-feedback").classList.remove("show");
  const submit=document.getElementById("pt-submit");submit.classList.remove("hide");submit.disabled=false;
  document.getElementById("pt-next").classList.add("hide");
  const progress=(R.index/R.queue.length)*100;document.getElementById("pt-progress").style.width=progress+"%";
}
function selectPracticalChoice(blankId,index){
  if(R.judged)return;R.answers[blankId]=index;
  const task=R.queue[R.index],blank=task.blanks.find(item=>item.id===blankId),field=document.getElementById(`pt-blank-${blankId}`);
  [...field.querySelectorAll(".pt-choice")].forEach(button=>{const selected=Number(button.dataset.choiceIndex)===index;button.classList.toggle("selected",selected);button.setAttribute("aria-pressed",String(selected));});
  const inline=document.getElementById(`pt-inline-${blankId}`);inline.textContent=`${blank.label} ${blank.choices[index]}`;inline.classList.add("filled");
}
function judgePracticalTask(){
  const task=R.queue[R.index],missing=task.blanks.some(blank=>R.answers[blank.id]===undefined);
  if(missing){notifyPractical("すべての空欄を選んでください");return;}
  R.judged=true;let correct=0;const details=[];
  task.blanks.forEach(blank=>{
    const picked=R.answers[blank.id],ok=picked===blank.answer;if(ok)correct++;
    const field=document.getElementById(`pt-blank-${blank.id}`);field.classList.add(ok?"correct":"wrong");
    [...field.querySelectorAll(".pt-choice")].forEach(button=>{button.disabled=true;if(Number(button.dataset.choiceIndex)===blank.answer)button.classList.add("answer");});
    details.push(`<div class="pt-feedback-item ${ok?"ok":"ng"}"><b>${escPractical(blank.label)} ${ok?"正解":"不正解"}</b><span>正答：${escPractical(blank.choices[blank.answer])}</span><p>${escPractical(blank.explanation)}</p></div>`);
  });
  R.correct+=correct;R.total+=task.blanks.length;
  R.results.push({id:task.id,title:task.title,category:task.category,correct,total:task.blanks.length,wrongBlanks:task.blanks.filter(blank=>R.answers[blank.id]!==blank.answer).map(blank=>({id:blank.id,label:blank.label,prompt:task.material.replace(/\{\{[^}]+\}\}/g,"［空欄］")}))});
  P.totalTasks++;P.totalBlanks+=task.blanks.length;P.correctBlanks+=correct;
  const attempt=P.attempts[task.id]||{count:0,best:0};attempt.count++;attempt.lastCorrect=correct;attempt.lastTotal=task.blanks.length;attempt.best=Math.max(attempt.best||0,correct);attempt.lastAt=new Date().toISOString();P.attempts[task.id]=attempt;
  if(correct===task.blanks.length)P.wrongTaskIds=P.wrongTaskIds.filter(id=>id!==task.id);else if(!P.wrongTaskIds.includes(task.id))P.wrongTaskIds.push(task.id);
  savePracticalData();
  const feedback=document.getElementById("pt-feedback");feedback.innerHTML=`<div class="pt-task-score">${correct}<small> / ${task.blanks.length}</small></div>${details.join("")}`;feedback.classList.add("show");
  document.getElementById("pt-submit").classList.add("hide");const next=document.getElementById("pt-next");next.textContent=R.index===R.queue.length-1?"結果を見る":"次の課題へ";next.classList.remove("hide");document.getElementById("pt-progress").style.width=((R.index+1)/R.queue.length*100)+"%";
  requestAnimationFrame(()=>feedback.scrollIntoView({behavior:"smooth",block:"start"}));
}
function nextPracticalTask(){R.index++;if(R.index>=R.queue.length)renderPracticalResult();else{renderPracticalTask();window.scrollTo({top:0,behavior:"smooth"});}}
function renderPracticalResult(){
  const rate=R.total?Math.round(R.correct/R.total*100):0,passed=rate>=75;
  const cats={};R.results.forEach(result=>{if(!cats[result.category])cats[result.category]={c:0,t:0};cats[result.category].c+=result.correct;cats[result.category].t+=result.total;});
  P.latestRun={title:R.title,total:R.total,correct:R.correct,rate,cats,results:R.results,completedAt:new Date().toISOString()};savePracticalData();
  document.getElementById("pt-result-title").textContent=R.title;
  document.getElementById("pt-result-score").textContent=rate;
  document.getElementById("pt-result-count").textContent=`${R.correct} / ${R.total} 空欄正解`;
  document.getElementById("pt-result-message").textContent=passed?"仮合格ライン（75点）に到達しました":"75点まで、間違えた課題を復習しましょう";
  document.getElementById("pt-result-card").classList.toggle("passed",passed);renderPracticalSubmitSummary();showPractical("pt-result");
}
function quitPractical(){if(!R.judged&&Object.keys(R.answers).length&& !confirm("回答途中の課題があります。実技メニューへ戻りますか？"))return;renderPracticalHome();}
function resetPracticalData(){if(!confirm("実技テスト版の成績だけをリセットしますか？\n学科の成績には影響しません。"))return;P=basePracticalData();savePracticalData();renderPracticalHome();notifyPractical("実技成績をリセットしました");}

function generatePracticalPlayerNo(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",bytes=new Uint8Array(8);if(globalThis.crypto&&crypto.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);return "P-"+Array.from(bytes,b=>chars[b%chars.length]).join("");}
function academicProfile(){try{const data=JSON.parse(localStorage.getItem(ACADEMIC_STORAGE_KEY)||"{}");return data&&typeof data==="object"?data:{};}catch(e){return {};}}
function ensurePracticalProfile(){const data=academicProfile();if(!data.playerNo)data.playerNo=generatePracticalPlayerNo();if(!String(data.name||"").trim()){const name=prompt("成績提出に使う表示名を入力してください。","");if(!String(name||"").trim())return null;data.name=String(name).trim().slice(0,20);}try{localStorage.setItem(ACADEMIC_STORAGE_KEY,JSON.stringify(data));}catch(e){}return {playerNo:data.playerNo,name:data.name};}
function renderPracticalSubmitSummary(){const profile=academicProfile(),run=P.latestRun;document.getElementById("pt-submit-no").textContent=profile.playerNo||"未発行";document.getElementById("pt-submit-name").textContent=profile.name||"未設定";document.getElementById("pt-submit-summary").textContent=run?`${run.correct}/${run.total}空欄・${run.rate}点`:"—";document.getElementById("pt-submit-result").disabled=!run;document.getElementById("pt-submit-status").textContent="実技成績として学科とは分けて集計されます。";}
function practicalSubmissionId(){if(globalThis.crypto&&crypto.randomUUID)return crypto.randomUUID();return "pt-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);}
function practicalCloudConfigured(){return /^https:\/\//.test(CLOUD.url||"")&&String(CLOUD.publishableKey||"").startsWith("sb_publishable_");}
async function submitPracticalResult(){
  const run=P.latestRun,profile=ensurePracticalProfile();if(!run||!profile)return;renderPracticalSubmitSummary();
  if(!practicalCloudConfigured()){notifyPractical("Supabase接続設定がありません");return;}
  const alerts=run.results.filter(result=>result.correct<result.total).map(result=>({id:result.id,cat:result.category,text:result.title,rate:Math.round(result.correct/result.total*100),guess:0,relapse:0}));
  const sentAt=new Date().toISOString(),record={v:8,examType:"practical",source:"practical",practicalVersion:PRACTICAL_VERSION,playerNo:profile.playerNo,name:profile.name,date:sentAt.slice(0,10),total:run.total,correct:run.correct,cats:run.cats,wrongCount:alerts.length,mastered:run.results.filter(result=>result.correct===result.total).length,alerts,tasks:run.results,sentAt};
  const row={submission_id:practicalSubmissionId(),player_no:profile.playerNo,user_name:profile.name,score:run.correct,total_questions:run.total,correct_count:run.correct,correct_rate:run.rate,elapsed_seconds:0,exam_version:"5.2.0-test",submitted_at:sentAt,streak:0,mastered_count:record.mastered,wrong_count:alerts.length,category_results:run.cats,weak_questions:alerts,raw_result:record};
  const button=document.getElementById("pt-submit-result"),status=document.getElementById("pt-submit-status");button.disabled=true;button.textContent="送信中…";
  try{const endpoint=`${CLOUD.url}/rest/v1/${encodeURIComponent(CLOUD.table||"exam_results")}`;const response=await fetch(endpoint,{method:"POST",headers:{apikey:CLOUD.publishableKey,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row),cache:"no-store"});if(!response.ok)throw new Error(await response.text().catch(()=>`HTTP ${response.status}`));status.textContent=`実技成績 ${run.rate}点を提出しました。`;notifyPractical("実技成績を提出しました");button.textContent="もう一度提出";}catch(error){status.textContent="送信できませんでした。通信状態を確認してください。";notifyPractical("実技成績を送信できませんでした");button.textContent="実技成績を提出";}finally{button.disabled=false;}
}

renderPracticalHome();
window.addEventListener("load",()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});});
