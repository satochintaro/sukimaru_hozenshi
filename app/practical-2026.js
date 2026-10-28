"use strict";
(()=>{
 const host=document.getElementById('practical-taps');if(!host)return;
 const practice=host.dataset.practice==='true';let data,taskIndex=0,practiceAnswers={},currentGroups={};
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const button=text=>{const n=el('button',text);n.type='button';return n;};
 let owner='guest';try{owner=JSON.parse(localStorage.getItem('skimaru-registration-v13')||'{}').playerNo||'guest';}catch{}
 const storageKey='skimaru-practical-practice-2026:'+owner;
 try{const a=JSON.parse(localStorage.getItem(storageKey)||'{}');if(a&&typeof a==='object'&&!Array.isArray(a))practiceAnswers=a;}catch{}
 function answers(){if(practice)return practiceAnswers;try{return window.SKIMARU_SELF_CHECK.parse(document.getElementById('practical').value);}catch{return {};}}
 const answered=v=>!!v&&v!=='?'&&v!=='？';
 function choose(id,value){const a=answers();a[id]=value;if(practice){practiceAnswers=a;try{localStorage.setItem(storageKey,JSON.stringify(a));}catch{host.prepend(el('p','保存できません。端末の空き容量を確認してください。'));}}else{const input=document.getElementById('practical');input.value=Object.entries(a).map(([k,v])=>k+' '+v).join('\n');input.dispatchEvent(new Event('input',{bubbles:true}));}}
 function photoPanel(task){
  const details=el('details'),summary=el('summary','問題写真を確認（図・事例・選択肢）');details.append(summary);let loaded=false;
  const loadPhotos=()=>{if(loaded)return;loaded=true;for(const n of task.photos){const wrap=el('div');wrap.className='practical-photo'+(n>=1829?' side':'');const img=el('img');img.src='./practical-2026-source-'+n+'.jpeg';img.alt='課題'+task.number+' 問題写真 '+(n>=1837?n-1811:n-1813)+'ページ';img.loading='lazy';img.onerror=()=>{wrap.hidden=true;details.append(el('p','写真を読み込めませんでした。画像ファイルの追加をご確認ください。'));};wrap.append(img);const link=el('a','写真を拡大して開く');link.href=img.src;link.target='_blank';link.rel='noopener';details.append(wrap,link);}};
  details.addEventListener('toggle',()=>{if(details.open)loadPhotos();});return details;
 }
 function makeTabs(items,active,prefix,className,label,onChange){
  const bar=el('div');bar.className=className;bar.setAttribute('role','tablist');bar.setAttribute('aria-label',label);
  for(const [i,item] of items.entries()){
   const b=button(item.label);b.id=prefix+'-'+i;b.className=prefix==='practical-task'?'practical-task':'';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(i===active));b.setAttribute('aria-controls',prefix==='practical-task'?'practical-content':'practical-questions');b.tabIndex=i===active?0:-1;
   if(item.ids){const small=el('small');b.append(small);b._counter={node:small,ids:item.ids};}
   b.onclick=()=>onChange(i,false);b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%items.length;else if(e.key==='ArrowLeft')next=(i+items.length-1)%items.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();onChange(next,true);};bar.append(b);
  }return bar;
 }
 function focusTab(id){document.getElementById(id)?.focus({preventScroll:true});}
 function render(){
  if(!data)return;host.replaceChildren();
  if(!practice){const g=document.getElementById('grade').value,select=document.querySelector('#choices select');if(g!=='2'||select?.value!=='A'){host.append(el('p',g==='2'?'実技は選択Aの問題に対応しています。':'1級実技は準備中です。'));return;}}
  const all=data.tasks.flatMap(t=>t.questions),progress=el('p');progress.className='practical-progress';progress.setAttribute('aria-live','polite');host.append(progress);
  const taskTabs=makeTabs(data.tasks.map(t=>({label:'課題'+t.number,ids:t.questions.map(q=>q.id)})),taskIndex,'practical-task','practical-tasks','実技の課題',i=>{taskIndex=i;render();focusTab('practical-task-'+i);});host.append(taskTabs);
  const task=data.tasks[taskIndex],panel=el('div');panel.id='practical-content';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','practical-task-'+taskIndex);panel.append(el('h2',task.title));
  const context=el('p',task.context);context.className='practical-context';panel.append(context,photoPanel(task));
  const groups=task.groups||[{number:1,ids:task.questions.map(q=>q.id)}],groupIndex=Math.min(currentGroups[taskIndex]||0,groups.length-1),group=groups[groupIndex];
  const groupTabs=makeTabs(groups.map(g=>({label:'設問'+g.number,ids:g.ids})),groupIndex,'practical-group','practical-groups','課題'+task.number+'の設問',i=>{currentGroups[taskIndex]=i;render();focusTab('practical-group-'+i);});panel.append(groupTabs);
  const questions=el('div');questions.id='practical-questions';questions.setAttribute('role','tabpanel');questions.setAttribute('aria-labelledby','practical-group-'+groupIndex);
  function updateProgress(){const a=answers();progress.textContent='回答済み '+all.filter(q=>answered(a[q.id])).length+' / '+all.length+'問'+(practice?'（学習用）':'（選択A）');for(const bar of [taskTabs,groupTabs])for(const b of bar.children){const c=b._counter;if(c)c.node.textContent=c.ids.filter(id=>answered(a[id])).length+' / '+c.ids.length+'問';}}
  const a=answers();
  for(const q of task.questions.filter(q=>group.ids.includes(q.id))){
   const card=el('div');card.className='practical-card';card.append(el('h3','空欄'+q.number+'　'+q.prompt));const options=el('div');options.className='practical-options';options.setAttribute('role','group');options.setAttribute('aria-label','課題'+task.number+' 空欄'+q.number+'の回答');const buttons=[];
   const feedback=el('p');feedback.className='practical-feedback';feedback.hidden=true;
   for(const o of [...q.options,{letter:'?',text:'不明・覚えていない'}]){const b=button(o.letter+'　'+o.text);b.setAttribute('aria-pressed',String(a[q.id]===o.letter));b.onclick=()=>{choose(q.id,o.letter);for(const [btn,letter]of buttons)btn.setAttribute('aria-pressed',String(letter===o.letter));feedback.hidden=true;updateProgress();};buttons.push([b,o.letter]);options.append(b);}
   card.append(options);const show=button(practice?'暫定解答・解説を見る':'この空欄の暫定解答を確認');show.style.marginTop='12px';show.setAttribute('aria-expanded','false');show.onclick=()=>{feedback.textContent='暫定解答：'+q.answer+'。'+q.explanation;feedback.hidden=!feedback.hidden;show.setAttribute('aria-expanded',String(!feedback.hidden));};card.append(show,feedback);questions.append(card);
  }
  panel.append(questions);const nav=el('nav');nav.className='practical-nav';nav.setAttribute('aria-label','前後の設問へ');for(const [text,delta]of [['前へ',-1],['次へ',1]]){const b=button(text);b.disabled=(delta===-1&&taskIndex===0&&groupIndex===0)||(delta===1&&taskIndex===data.tasks.length-1&&groupIndex===groups.length-1);b.onclick=()=>{let next=groupIndex+delta;if(next<0){taskIndex--;currentGroups[taskIndex]=(data.tasks[taskIndex].groups?.length||1)-1;}else if(next>=groups.length){taskIndex++;currentGroups[taskIndex]=0;}else currentGroups[taskIndex]=next;render();host.scrollIntoView({block:'start'});};nav.append(b);}panel.append(nav);host.append(panel);if(practice){const hint=el('p','学習用の回答は、自己採点に入力した回答とは別に保存します。暫定解答は公式正解に合わせて更新します。');hint.className='practical-hint';host.append(hint);}updateProgress();
 }
 let lastState='';document.addEventListener('practical-state',()=>{const state=document.getElementById('grade').value+':'+(document.querySelector('#choices select')?.value||'');if(state!==lastState){lastState=state;render();}});
 fetch('./practical-2026.json?v=1692').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(d.schema!==1||!Array.isArray(d.tasks))throw Error();data=d;render();}).catch(()=>{host.replaceChildren(el('p','実技データを読み込めませんでした。通信が戻ったら画面を開き直してください。'));});
})();
