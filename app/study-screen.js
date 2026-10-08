"use strict";
(() => {
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function subjects(container,rows,onSelect){
  container.classList.add('study-subjects');container.replaceChildren();
  rows.forEach(row=>{const b=document.createElement('button');b.type='button';b.className='study-subject pn row';b.innerHTML=`<span class="row-b"><span class="row-t">${escape(row.title)}</span><span class="row-d">${escape(row.detail)}</span><span class="bar"><i style="width:${row.rate||0}%"></i></span></span><span class="row-v">${row.rate==null?'—':row.rate+'%'}</span><span class="row-go">›</span>`;b.onclick=()=>onSelect(row);container.append(b);});
 }
 function years(container,rows,academic,onSelect){
  container.className=academic?'study-years':'study-practical-years';container.replaceChildren();
  rows.forEach(row=>{const card=document.createElement('div');card.className='study-year';card.innerHTML=`<div class="row"><span class="row-i">${String(row.year).slice(2)}</span><span class="row-b"><span class="row-t">${row.year}年度</span><span class="row-d">${escape(row.detail)}</span></span>${academic?`<span class="row-v">${row.rate==null?'—':row.rate+'%'}</span>`:''}</div>`;
   const actions=document.createElement('div');actions.className='study-year-actions';
   (academic?[['full',`本番 ${row.count}問`],['quick','ランダム10問']]:[['full','全課題・課題別 →']]).forEach(([mode,label])=>{const b=document.createElement('button');b.type='button';b.className='btn-g';b.textContent=label;b.disabled=row.count===0;b.onclick=()=>onSelect(row,mode);actions.append(b);});card.append(actions);container.append(card);});
 }
 function tasks(container,rows,onSelect){container.className='study-tasks';container.replaceChildren();rows.forEach(row=>{const b=document.createElement('button');b.type='button';b.className='study-task';b.innerHTML=`<b>${escape(row.title)}</b><span>${escape(row.detail)}</span><span class="study-task-go" aria-hidden="true">›</span>`;b.onclick=()=>onSelect(row);container.append(b);});}
 window.SKIMARU_STUDY_SCREEN={subjects,years,tasks};
})();
