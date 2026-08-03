"use strict";

const TASKS = window.PRACTICAL_TASKS || [];
const STORAGE_KEY = "skimaruPracticalDataTestV1";
const PRACTICAL_VERSION = "0.1-test";

function basePracticalData(){
  return {version:PRACTICAL_VERSION,totalTasks:0,totalBlanks:0,correctBlanks:0,wrongTaskIds:[],attempts:{}};
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
let R={queue:[],index:0,answers:{},choiceOrders:{},judged:false,correct:0,total:0,title:"実技演習"};
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
  R={queue:[...tasks],index:0,answers:{},choiceOrders:{},judged:false,correct:0,total:0,title};
  document.getElementById("pt-quiz-title").textContent=title;renderPracticalTask();showPractical("pt-quiz");
}
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
  document.getElementById("pt-result-title").textContent=R.title;
  document.getElementById("pt-result-score").textContent=rate;
  document.getElementById("pt-result-count").textContent=`${R.correct} / ${R.total} 空欄正解`;
  document.getElementById("pt-result-message").textContent=passed?"仮合格ライン（75点）に到達しました":"75点まで、間違えた課題を復習しましょう";
  document.getElementById("pt-result-card").classList.toggle("passed",passed);showPractical("pt-result");
}
function quitPractical(){if(!R.judged&&Object.keys(R.answers).length&& !confirm("回答途中の課題があります。実技メニューへ戻りますか？"))return;renderPracticalHome();}
function resetPracticalData(){if(!confirm("実技テスト版の成績だけをリセットしますか？\n学科の成績には影響しません。"))return;P=basePracticalData();savePracticalData();renderPracticalHome();notifyPractical("実技成績をリセットしました");}

renderPracticalHome();
