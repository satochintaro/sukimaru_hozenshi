'use strict';
(()=>{
 const D=window.SKIMARU_FINAL_MOCK_DATA;
 const pool=grade=>D.questions.filter(q=>q.scope==='all'||Number(q.scope)===grade);
 const number=v=>Math.max(0,Number(v)||0);
 function weights(grade,record){
  const byTopic={},byCategory={},stats=grade===1?record.questionStats:record.stats;
  for(const [id,s] of Object.entries(stats||{})){
   const wrong=grade===1?Math.max(0,number(s.total)-number(s.correct)):number(s.w??s.wrong);
   if(!wrong)continue;
   const total=grade===1?number(s.total):wrong+number(s.c),weight=Math.min(5,wrong)+wrong/Math.max(1,total)*3;
   for(const topic of D.legacyTopics[grade][id]||[])byTopic[topic]=(byTopic[topic]||0)+weight;
   const cat=D.legacyCategories[grade][id];if(cat)byCategory[cat]=(byCategory[cat]||0)+weight;
  }
  for(const [id,s] of Object.entries(record.finalMock?.questionStats||{})){
   const q=D.questions.find(x=>x.id===id);if(q&&s.wrong)byTopic[q.topicId]=(byTopic[q.topicId]||0)+Math.min(8,s.wrong*2);
  }
  return {byTopic,byCategory,hasPersonal:Object.keys(byTopic).length+Object.keys(byCategory).length>0};
 }
 function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function build(grade,pattern,record={},random=Math.random){
  const bank=pool(grade),w=weights(grade,record);let selected=[];
  if(pattern==='A'||pattern==='B'){
   for(const cat of D.categories){const topics=[...new Set(bank.filter(q=>q.category===cat).map(q=>q.topicId))];for(const [i,id]of topics.entries()){const wanted=(i+(pattern==='B'?1:0))%2===0;selected.push(bank.find(q=>q.topicId===id&&q.answer===wanted));}}
  }else if(pattern==='weak'){
   const available=[...bank];
   function take(list,n){for(let j=0;j<n;j++){const values=list.map(q=>1+(D.priority[grade][q.topicId]||0)*2+(w.byTopic[q.topicId]||0)*4+Math.min(6,w.byCategory[q.category]||0)),sum=values.reduce((a,b)=>a+b,0);let ticket=random()*sum,i=0;for(;i<list.length-1&&ticket>=values[i];i++)ticket-=values[i];const q=list.splice(i,1)[0];selected.push(q);available.splice(available.findIndex(x=>x.id===q.id),1);}}
   for(const cat of D.categories)take(available.filter(q=>q.category===cat),10);
   // A separate list prevents removing twice when taking from the remaining pool.
   take([...available],50);
  }else throw Error('出題パターンを確認してください。');
  if(selected.length!==100||new Set(selected.map(q=>q.id)).size!==100)throw Error('100問の出題を準備できませんでした。');
  return {ids:shuffle(selected.map(q=>q.id),random),personal:pattern==='weak'&&w.hasPersonal};
 }
 const valid=(s,grade,owner)=>!!s&&s.grade===grade&&s.owner===owner&&Array.isArray(s.ids)&&s.ids.length===100&&new Set(s.ids).size===100&&s.ids.every(id=>pool(grade).some(q=>q.id===id))&&['A','B','weak'].includes(s.pattern)&&['answering','finished'].includes(s.phase)&&Array.isArray(s.flags)&&s.flags.every(id=>s.ids.includes(id))&&s.answers&&typeof s.answers==='object'&&Object.keys(s.answers).every(id=>s.ids.includes(id)&&typeof s.answers[id]==='boolean')&&Number.isInteger(s.index)&&s.index>=0&&s.index<100;
 function score(s){const map=new Map(pool(s.grade).map(q=>[q.id,q])),cats={};let correct=0,answered=0;for(const id of s.ids){const q=map.get(id),has=typeof s.answers[id]==='boolean',ok=has&&s.answers[id]===q.answer;correct+=+ok;answered+=+has;const cat=cats[q.category]||={total:0,correct:0};cat.total++;cat.correct+=+ok;}return {correct,total:s.ids.length,answered,cats};}
 window.SKIMARU_FINAL_MOCK_CORE={pool,weights,shuffle,build,valid,score};
})();
