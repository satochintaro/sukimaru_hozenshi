"use strict";
(() => {
  const KEY="skimaru-study-time-v12", IDLE=120000;
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}};
  let scope=null,attempt=null,enabled=false,last=Date.now(),activity=last;
  const active=()=>enabled&&!document.hidden&&!document.querySelector('.member-gate')&&(scope!=="core"||!!document.querySelector('#sc-quiz.active'));
  function flush(){const now=Date.now(),end=Math.min(now,activity+IDLE),ms=Math.max(0,end-last);last=now;if(!active()||!scope||!attempt||!ms)return;const d=read();d[scope]||={totalMs:0,attempts:{},startedAt:new Date().toISOString()};d[scope].totalMs+=ms;d[scope].attempts[attempt]=(d[scope].attempts[attempt]||0)+ms;try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}}
  function start(s,id,on=true){flush();scope=s;attempt=id;enabled=on;last=activity=Date.now();const d=read();d[s]||={totalMs:0,attempts:{},startedAt:new Date().toISOString()};try{localStorage.setItem(KEY,JSON.stringify(d));}catch{}}
  function seconds(s,id){flush();const d=read()[s];return Math.round((id?d?.attempts?.[id]:d?.totalMs||0)/1000)||0;}
  function snapshot(){flush();let p={},hist=[];try{p=JSON.parse(localStorage.getItem('skimaruData')||'{}');hist=JSON.parse(localStorage.getItem('skimaruExamHistory_v1')||'[]');}catch{}const d=read(),out={version:12};for(const type of ['academic','practical']){const hs=[...new Map(hist.filter(h=>h.completedAt&&h.kind===(type==='academic'?'gakka':'jitugi')).map(h=>[h.id,h])).values()];const count=hs.reduce((s,h)=>s+(Number(h.total)||0),0)+(type==='academic'?(Number(p.total)||0):0),correct=hs.reduce((s,h)=>s+(Number(h.correct)||0),0)+(type==='academic'?(Number(p.correct)||0):0);const clocks=Object.entries(d).filter(([s])=>type==='academic'?s==='core'||s.includes('_gakka_'):s.includes('_jitugi_')||s.startsWith('skimaruPractical'));out[type]={total:count,correct,seconds:Math.round(clocks.reduce((s,[,v])=>s+(v.totalMs||0),0)/1000),timeMeasured:clocks.length>0,measuredSince:clocks.map(([,v])=>v.startedAt).sort()[0]||null};}return out;}
  window.SKIMARU_TIME={start,seconds,snapshot,exportData:()=>{flush();return read();},importData:d=>{enabled=false;localStorage.setItem(KEY,JSON.stringify(d||{}));last=activity=Date.now();},stop:()=>{flush();enabled=false;},resetCore:()=>{flush();const d=read();delete d.core;localStorage.setItem(KEY,JSON.stringify(d));last=activity=Date.now();}};
  for(const event of ['pointerdown','keydown','touchstart','scroll'])document.addEventListener(event,()=>{flush();activity=Date.now();},{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{flush();last=Date.now();if(!document.hidden)activity=last;});window.addEventListener('pagehide',flush);setInterval(flush,1000);
})();
