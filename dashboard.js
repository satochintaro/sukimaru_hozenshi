"use strict";
(()=>{
const $=id=>document.getElementById(id);
const practical={
  2022:{total:76,ranges:[[1,7,"作業の安全"],[8,12,"5S"],[13,19,"自主保全活動支援ツール"],[20,24,"自主保全仮基準書"],[25,31,"設備効率を阻害するロス"],[32,40,"故障ゼロ"],[41,51,"QCストーリー"],[52,61,"IE"],[62,70,"潤滑"],[71,76,"図面"]]},
  2023:{total:78,ranges:[[1,12,"作業の安全・5S"],[13,20,"TPM"],[21,28,"設備効率を阻害するロス"],[29,36,"自主保全の基礎"],[37,44,"自主保全活動支援ツール"],[45,53,"QCストーリー"],[54,61,"IE"],[62,69,"工具・測定機器"],[70,78,"図面"]]},
  2024:{total:74,ranges:[[1,8,"作業の安全"],[9,13,"5S"],[14,20,"設備効率を阻害するロス"],[21,29,"故障ゼロ"],[30,33,"自主保全活動支援ツール"],[34,41,"発生源・困難箇所対策"],[42,51,"QCストーリー"],[52,55,"なぜなぜ分析"],[56,59,"ECRS"],[60,66,"センサー"],[67,74,"図面"]]},
  2025:{total:72,ranges:[[1,6,"危険予知訓練"],[7,14,"TPM"],[15,21,"目で見る管理"],[22,30,"自主保全ステップ"],[31,41,"QCストーリー"],[42,49,"IE"],[50,57,"設備保全"],[58,63,"図面"],[64,72,"設備効率を阻害するロス"]]}
};
const earlyKeys=[2022,2023].flatMap(y=>[{year:y,kind:"gakka",total:100,key:`skimaruEarly_${y}_gakka_v1`},{year:y,kind:"jitugi",total:practical[y].total,key:`skimaruEarly_${y}_jitugi_v1`}]);
const newer=[{year:2024,kind:"jitugi",total:74,key:"skimaruPractical2024V750"},{year:2025,kind:"jitugi",total:72,key:"skimaruPractical2025V600"}];
const specs=[...earlyKeys,...newer];
function load(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function result(spec){
 const s=load(spec.key),a=s?.answers||{};
 const count=Array.from({length:spec.total},(_,i)=>i+1).filter(n=>a[n]!==undefined&&a[n]!==null).length;
 const finished=spec.year<2024?Boolean(s?.finished):Boolean(s?.completedAt);
 const complete=finished&&count===spec.total;
 const good=complete?Array.from({length:spec.total},(_,i)=>i+1).filter(n=>spec.year<2024?null:a[n]?.ok).length:null;
 // Early years keep correct answers in their own data file. It is loaded by dashboard.html.
 let correct=good;
 if(complete&&spec.year<2024){
   const keys=window.SKIMARU_EARLY_OFFICIAL?.[spec.year]?.[spec.kind];
   correct=keys?Array.from({length:spec.total},(_,i)=>i+1).filter(n=>a[n]===keys[n]).length:null;
 }
 return {...spec,answers:a,count,complete,correct,branch:s?.branch,completedAt:s?.completedAt||null};
}
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e}
function pct(a,b){return Math.round(a/b*100)}
function bar(rate){const track=el("div","track"),fill=el("div","fill");fill.style.width=rate+"%";track.append(fill);return track}
const results=specs.map(result),done=results.filter(r=>r.complete&&r.correct!==null);
$("completed").textContent=done.length+" / "+specs.length;
const latest=[...done].sort((a,b)=>String(b.completedAt||"").localeCompare(String(a.completedAt||"")))[0];
$("latest").textContent=latest?pct(latest.correct,latest.total)+"%":"—";
const years=$("years");
for(const r of results){
 const box=el("div","year"),title=el("h3","",`${r.year}年度 ${r.kind==="gakka"?"学科":"実技"}`);box.append(title);
 if(r.complete&&r.correct!==null){
  const rate=pct(r.correct,r.total);
  box.append(el("strong","",`${r.correct} / ${r.total}問（${rate}%）`),bar(rate));
 }else box.append(el("p","muted",r.complete?"正解データを読み込めませんでした":`未採点・回答済み ${r.count} / ${r.total}問`));
 const link=el("a","primary",r.complete?"問題を見直す":"問題を解く");
 link.href=`./${r.year<2024?(r.kind==="gakka"?"gakka":"jitugi"):"practical"}-${r.year}.html`;
 box.append(link);years.append(box);
}
const topics=[];
for(const r of done.filter(r=>r.kind==="jitugi")){
 for(const [start,end,title] of practical[r.year].ranges){
  let good=0;
  for(let n=start;n<=end;n++){
   if(r.year<2024){const k=window.SKIMARU_EARLY_OFFICIAL?.[r.year]?.jitugi;if(k&&r.answers[n]===k[n])good++}
   else if(r.answers[n]?.ok)good++;
  }
  topics.push({year:r.year,title,good,total:end-start+1,rate:pct(good,end-start+1)});
 }
}
topics.sort((a,b)=>a.rate-b.rate||a.year-b.year);
const weakness=$("weakness");
if(!topics.length)weakness.append(el("div","empty","実技を最後まで解いて採点すると、ここに苦手課題が表示されます。"));
else{
 for(const t of topics.slice(0,8)){
  const box=el("div","topic");
  box.append(el("strong","",`${t.year}年度・${t.title}`),el("div","muted",`${t.good} / ${t.total}問（${t.rate}%）`),bar(t.rate));
  weakness.append(box);
 }
}
const next=$("nextStudy");
const first=results.find(r=>!r.complete);
if(first){
 next.append(el("p","",`${first.year}年度の${first.kind==="gakka"?"学科":"実技"}から取り組めます。`));
 const a=el("a","primary","問題を開く");a.href=`./${first.year<2024?(first.kind==="gakka"?"gakka":"jitugi"):"practical"}-${first.year}.html`;next.append(a);
}else if(topics.length){
 const t=topics[0];next.append(el("p","",`${t.year}年度の「${t.title}」を復習しましょう。`));
 const a=el("a","primary","実技を開く");a.href=`./${t.year<2024?"jitugi":"practical"}-${t.year}.html`;next.append(a);
}else next.append(el("p","muted","採点済みのデータがありません。"));
})();