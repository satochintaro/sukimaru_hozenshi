'use strict';
(()=>{
 const number=v=>Math.max(0,Number(v)||0),read=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
 const stats=(r,grade)=>grade===1?Object.fromEntries(Object.entries(r.questionStats||{}).filter(([id])=>id.includes('-a-'))):r.stats||{};
 function counts(v,grade){const correct=number(grade===1?v?.correct:v?.c),total=grade===1?number(v?.total):correct+number(v?.w??v?.wrong);return {correct,total,wrong:Math.max(0,total-correct)};}
 function decide(r,grade,day=today()){
  const base=grade===1?r.stats?.academic||{}:r,total=number(base.total)+number(r.suddenDeath?.totalAnswers)+number(r.finalMock?.totalAnswers),dates=Object.keys(r.daily||{}).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&number(r.daily[d])>0&&d<=day).sort();
  const last=dates.at(-1)||(r.lastDate<=day?r.lastDate:null),gap=last?Math.floor((Date.parse(day+'T00:00:00Z')-Date.parse(last+'T00:00:00Z'))/86400000):0;
  const attempted=Object.values(stats(r,grade)).map(v=>counts(v,grade)),wrong=Object.values(stats(r,grade)).filter(v=>number(v.sureStreak)<2).reduce((s,v)=>s+counts(v,grade).wrong,0),t=attempted.reduce((s,v)=>s+v.total,0),rate=t?attempted.reduce((s,v)=>s+v.correct,0)/t:0;
  let kind='daily',title='今日も、5問から。',copy='短い時間でも大丈夫。自分のペースで進めよう。',primary='おすすめの5問を始める';
  if(!total&&!t&&!last&&number(r.suddenDeath?.best)<1000){kind='first';title='まずは、5問やってみよう。';copy='5つの科目を1問ずつ。今の自分を知るところから。';}
  else if(gap>=3){kind='return';title='おかえりなさい。5問から。';copy='空いた日数は気にせず、ここから再開しよう。';}
  else if(number(r.suddenDeath?.best)>=1000){kind='complete';title='完全制覇。その先の5問へ。';copy='次は、まだ解いていない問題を優先して実力確認。';primary='実力確認の5問を始める';}
  else if(t>=100&&rate>=.85){kind='ready';title='次は、理解を確かめる5問。';copy='まだ解いていない問題を優先。仕上げは100問模試へ。';primary='実力確認の5問を始める';}
  else if(wrong>=3){kind='review';title='迷ったところを、5問で。';copy='誤答の多い科目を優先。少しずつ確かめていこう。';primary='復習の5問を始める';}
  const history=(Array.isArray(r.finalMock?.history)?r.finalMock.history:[]).filter(h=>['A','B'].includes(h.pattern)&&number(h.total)===100&&Number.isFinite(Number(h.correct))).sort((a,b)=>String(a.completedAt).localeCompare(String(b.completedAt)));
  const latest=history.at(-1),previous=latest?history.slice(0,-1).reverse().find(h=>h.pattern===latest.pattern):null;
  const growth=previous&&latest.correct>previous.correct?'同じパターンの模試で、前回より＋'+(latest.correct-previous.correct)+'点':latest?'直近の模試は '+number(latest.correct)+' / 100点':'これまでの誤答を含め、学習履歴から出題を選びます。';
  return {kind,title,copy,primary,growth,total,wrong};
 }
 function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function pick(questions,r,grade,mode='recommended',random=Math.random){
  const bank=[...new Map(questions.filter(q=>q&&q.id!=null&&q.category&&(!q.type||q.type==='academic')&&(typeof q.answer==='boolean'||['○','×'].includes(q.answer))).map(q=>[String(q.id),q])).values()];
  const map=stats(r,grade),n=mode==='review'?3:5,d=decide(r,grade),categories=[...new Set(bank.map(q=>q.category))],weak={};
  for(const q of bank){const c=counts(map[q.id],grade);if(c.wrong&&number(map[q.id]?.sureStreak)<2){const v=weak[q.category]||={total:0,wrong:0};v.total+=c.total;v.wrong+=c.wrong;}}
  const target=Object.keys(weak).sort((a,b)=>weak[b].wrong/Math.max(1,weak[b].total)-weak[a].wrong/Math.max(1,weak[a].total)||weak[b].wrong-weak[a].wrong)[0];
  let pool=shuffle(bank,random),selected=[];
  const add=q=>{if(q&&!selected.some(x=>String(x.id)===String(q.id)))selected.push(q);};
  const unseen=q=>counts(map[q.id],grade).total===0;
  if((mode==='review'||d.kind==='review')&&target){
   const candidates=pool.filter(q=>q.category===target).sort((a,b)=>{const x=counts(map[a.id],grade),y=counts(map[b.id],grade);return y.wrong/Math.max(1,y.total)-x.wrong/Math.max(1,x.total)||y.wrong-x.wrong;});for(const q of candidates.slice(0,n))add(q);
  }else{
   // One question per subject where possible; prefer unanswered items for the next challenge.
   for(const cat of shuffle(categories,random)){if(selected.length===n)break;const part=pool.filter(q=>q.category===cat);add(part.find(unseen)||part[0]);}
  }
  for(const q of pool.sort((a,b)=>+unseen(b)-+unseen(a))){if(selected.length===n)break;add(q);}
  return {questions:selected,category:target||null,personal:!!target};
 }
 function enhance(card,{grade,practical,profile}){
  if(practical)return;
  card.id='today-learning-entry';
  const d=decide(profile,grade),signature=JSON.stringify([grade,d,number(profile.daily?.[today()])]);
  if(card.dataset.todaySignature===signature)return;
  card.dataset.todaySignature=signature;card.classList.add('today-entry');card.querySelector('button')?.removeAttribute('onclick');
  const headings={first:'最初の5問から。',return:'おかえりなさい。',complete:'次の挑戦へ。',ready:'仕上がりを、5問で。',review:'苦手を、少しずつ。',daily:'今日も、ひとつ前へ。'};
  const descriptions={first:'5つの科目を1問ずつ。気軽に始めよう。',return:'久しぶりでも大丈夫。短い学習から再開。',complete:'未回答の問題を優先して、実力を確認。',ready:'未回答の問題を優先して、最後の確認。',review:'前に迷った問題を中心に、5問だけ。',daily:'無理なく続ける、今日の小さな一歩。'};
  const growth=d.growth.startsWith('これまで')?'':'<div class="today-growth"><span aria-hidden="true">↗</span><span>'+esc(d.growth)+'</span></div>';
  card.innerHTML='<div class="quick-eyebrow">今日のおすすめ <span>5問</span></div><h2>'+esc(headings[d.kind])+'</h2><p class="today-description">'+esc(descriptions[d.kind])+'</p><button type="button" class="today-primary" data-today-action="recommended" data-usage-action="today_recommend_start"><span>5問を始める</span><span class="today-arrow" aria-hidden="true">→</span></button><div class="today-choices"><button type="button" data-today-action="review" data-usage-action="today_review_start">'+(d.wrong?'苦手を3問':'3問だけ試す')+'</button><a href="./final-mock.html?grade='+grade+'" data-usage-action="today_mock_open">100問模試</a></div>'+growth+'<p class="today-message" role="status" aria-live="polite"></p>';
  card.onclick=null;
  if(!card.dataset.todayBound){card.dataset.todayBound='true';card.addEventListener('click',async e=>{
   const button=e.target.closest('[data-today-action]');if(!button||!card.contains(button)||card.dataset.todayBusy==='true')return;
   const grade=Number(card.dataset.todayGrade),key=grade===1?'skimaru-grade1-v16':'skimaruData',message=card.querySelector('.today-message');
   if(window.SKIMARU_ENROLLMENT&&!window.SKIMARU_ENROLLMENT.ensure())return;
   card.dataset.todayBusy='true';card.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{const engine=window.SKIMARU_LAB_ENGINE;if(!engine)throw Error('学習画面の準備中です。少し待って、もう一度押してください。');const qs=await engine.questions(),r=read(key),result=pick(Array.isArray(qs)?qs:[],r,grade,button.dataset.todayAction);if(!result.questions.length)throw Error('問題を用意できませんでした。学習ホームを開き直してください。');const title=button.dataset.todayAction==='review'?(result.personal?'苦手を確認 · '+result.questions.length+'問':'気軽に確認 · '+result.questions.length+'問'):'今日のおすすめ · '+result.questions.length+'問';engine.start(result.questions,title);}catch(error){if(message)message.textContent=error.message||'開始できませんでした。もう一度お試しください。';}finally{card.dataset.todayBusy='false';card.querySelectorAll('button').forEach(b=>b.disabled=false);}
  });}
  card.dataset.todayGrade=String(grade);
 }
 window.SKIMARU_TODAY={decide,pick,enhance};
})();

