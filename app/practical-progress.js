"use strict";
(() => {
 const read=(key,f={})=>{try{return JSON.parse(localStorage.getItem(key)||'null')||f;}catch{return f;}};
 function latest(info){
  const out={},state=read(info.key),history=read('skimaruExamHistory_v1',[]);
  function take(answers,at){for(const [number,value] of Object.entries(answers||{})){const q=info.questions.find(q=>q.number===+number);if(!q)continue;const letter=typeof value==='string'?value:q.options[typeof value==='number'?value:value?.picked]?.letter;if(!q.options.some(o=>o.letter===letter))continue;if(!out[number]||out[number].at<=at)out[number]={letter,correct:letter===info.jitugi[number],at};}}
  const sessions=[state,...Object.values(state.taskSessions||{}),...Object.values(state.reviewSessions||{})];
  sessions.filter(s=>s.completedAt||s.finished).forEach(s=>take(s.answers,s.completedAt||''));
  if(Array.isArray(history))history.filter(h=>h.kind==='jitugi'&&h.year===info.year&&h.completedAt).forEach(h=>take(h.answers,h.completedAt));
  return out;
 }
 function numbers(info,mode){const state=read(info.key);if(mode==='marked')return info.questions.filter(q=>state.bookmarks?.[q.number]).map(q=>q.number);const answers=latest(info);return info.questions.filter(q=>answers[q.number]&&!answers[q.number].correct).map(q=>q.number);}
 window.SKIMARU_PRACTICAL_PROGRESS={read,latest,numbers};
})();
