"use strict";
((root)=>{
 function parse(text){const out={};for(const line of text.split(/\r?\n/)){if(!line.trim())continue;const m=line.trim().match(/^(\S+)\s+([○〇◯×OXoxア-ンA-Za-z0-9?？]+)$/);if(!m)throw Error('「問題番号 回答」の形で1行ずつ入力してください。');if(out[m[1]])throw Error('問題番号が重複しています：'+m[1]);out[m[1]]=norm(m[2]);}return out;}
 function norm(v){return String(v).normalize('NFKC').toUpperCase().replace(/[〇◯O]/g,'○').replace(/X/g,'×');}
 function score(questions,answers){if(!Array.isArray(questions)||!questions.length)throw Error('正解データが未登録です。');const ids=new Set();let correct=0,answered=0,points=0,max=0;const details=[];for(const q of questions){if(!q.id||ids.has(String(q.id))||!q.answer)throw Error('正解データを確認してください。');ids.add(String(q.id));const w=q.points??1;if(!Number.isFinite(w)||w<=0)throw Error('配点を確認してください。');const a=answers[q.id],ok=a!==undefined&&norm(a)===norm(q.answer);if(a&&a!=='?'&&a!=='？')answered++;if(ok){correct++;points+=w;}max+=w;details.push({id:q.id,answer:a||'未回答',correct:q.answer,ok});}return{total:questions.length,answered,correct,rate:100*correct/questions.length,score:100*points/max,details};}
 function judge(a,p,official=false){if(a.answered<a.total||p.answered<p.total)return '未回答・不明の問題があります。判定は保留です。';return (official?'公開配点による参考判定：':'均等配点を仮定した参考判定：')+(a.score>=75&&p.score>=75?'学科・実技とも75点相当以上':'75点相当未満の科目があります');}
 const api={parse,score,judge};root.SKIMARU_SELF_CHECK=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
