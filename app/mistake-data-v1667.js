'use strict';
(()=>{
 const parse=(v,f={})=>{try{return typeof v==='string'?JSON.parse(v):v??f;}catch{return f;}};
 const count=v=>Math.min(1000000,Math.max(0,Math.floor(Number(v)||0)));
 const label=(id,grade,type,meta)=>{const q=grade===1?meta.grade1?.[id]:type==='academic'?{text:meta.academicText?.[id],category:meta.academic?.[id]}:meta.practical?.[id.split(':')[0]]?.questions?.[id.split(':')[1]];return {text:q?.text||'問題 '+id,category:q?.category||'',reference:grade===1&&q?q.year+'年度 問'+q.number:type==='practical'?id.split(':')[0]+'年度 問'+id.split(':')[1]:'問題 '+id};};
 function extract(entries,grade,type,meta={}){
  const out=[];
  if(grade===1||type==='academic'){
   const state=parse(entries[grade===1?'skimaru-grade1-v16':'skimaruData']),stats=grade===1?state.questionStats:state.stats;
   for(const [id,s]of Object.entries(stats||{})){if(grade===1&&(meta.grade1?.[id]?.type||(id.includes('-a-')?'academic':'practical'))!==type)continue;const wrong=grade===1?Math.max(0,count(s.total)-count(s.correct)):count(s.w??s.wrong);if(!wrong)continue;const streak=count(grade===1&&type==='practical'?s.mistakeCorrectStreak:s.sureStreak);out.push({id,...label(id,grade,type,meta),wrong,mastered:streak>=2,partial:false});}
   return out;
  }
  const history=parse(entries.skimaruExamHistory_v1,[]);
  for(const [year,info]of Object.entries(meta.practical||{})){
   const state=parse(entries[info.key]),events=new Map();
   function take(s,source){if(!s.completedAt&&!s.finished)return;const at=s.completedAt||'',event=String(s.id||s.attemptId||'legacy:'+at);for(const [n,v]of Object.entries(s.answers||{})){const q=info.questions[n];if(!q)continue;const letter=typeof v==='string'?v:q.options?.[typeof v==='number'?v:v?.picked];if(!q.options?.includes(letter))continue;let map=events.get(n);if(!map)events.set(n,map=new Map());if(source==='state'&&[...map.values()].some(e=>e.at===at))continue;map.set(event,{at,correct:letter===q.answer});}}
   if(Array.isArray(history))for(const h of history)if(h.kind==='jitugi'&&Number(h.year)===Number(year))take(h,'history');
   for(const s of [state,...Object.values(state.taskSessions||{}),...Object.values(state.reviewSessions||{})])take(s,'state');
   for(const n of new Set([...events.keys(),...Object.keys(state.everWrong||{}).filter(n=>state.everWrong[n])])){const es=[...(events.get(n)?.values()||[])].sort((a,b)=>a.at.localeCompare(b.at)),wrong=es.filter(e=>!e.correct).length;if(!wrong&&!state.everWrong?.[n])continue;const id=year+':'+n;let streak=0;for(let i=es.length-1;i>=0&&es[i].correct;i--)streak++;out.push({id,...label(id,grade,type,meta),wrong:wrong||null,mastered:streak>=2,partial:true});}
  }
  return out;
 }
 window.SKIMARU_MISTAKE_DATA={extract,label,parse};
})();
