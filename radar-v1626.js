"use strict";
(()=>{
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number.isFinite(Number(x))?Math.max(0,Math.min(1e9,Number(x))):0;
 function rows(cats){return Object.entries(cats||{}).slice(0,12).map(([label,v])=>{const total=num(v?.t??v?.total),correct=Math.min(total,num(v?.c??v?.correct));return {label,total,rate:total?Math.round(correct/total*100):null};});}
 function html(cats,title='科目バランス'){const rs=rows(cats);if(rs.length<3)return '<p class="radar-note">科目別の記録が3科目以上あるとレーダーチャートを表示します。</p>';
 const n=rs.length,pos=(i,r)=>{const a=-Math.PI/2+i*Math.PI*2/n;return [140+r*Math.cos(a),120+r*Math.sin(a)].map(x=>x.toFixed(2));},points=r=>rs.map((_,i)=>pos(i,r).join(',')).join(' ');
 const short={'生産の基本':'生産の基本','設備の日常保全':'日常保全','効率化とロス':'効率化','改善・解析':'改善解析','設備保全の基礎':'保全基礎','自主保全・日常保全':'日常保全','効率化・ロス':'効率化','安全・環境':'安全・環境','図面・測定':'図面測定'};
 let grid=[20,40,60,80].map(v=>`<polygon points="${points(v)}" fill="none" stroke="#D6CFBE"/>`).join('');
 grid+=rs.map((r,i)=>{const p=pos(i,80),l=pos(i,103),a=-Math.PI/2+i*Math.PI*2/n,anchor=Math.cos(a)>.3?'start':Math.cos(a)<-.3?'end':'middle';const name=short[r.label]||r.label;return `<line x1="140" y1="120" x2="${p[0]}" y2="${p[1]}" stroke="#D6CFBE"/><text x="${l[0]}" y="${Number(l[1])+4}" text-anchor="${anchor}" font-size="9.5" fill="#53675f">${(name.length>4?`<tspan x="${l[0]}" dy="-4">${esc(name.slice(0,4))}</tspan><tspan x="${l[0]}" dy="11">${esc(name.length>8?name.slice(4,7)+'…':name.slice(4))}</tspan>`:esc(name))}<title>${esc(r.label)}</title></text>`;}).join('');
 // Missing answers are gaps, not a misleading zero-percent filled polygon.
 const measured=rs.every(r=>r.rate!==null);let shape=measured?`<polygon points="${rs.map((r,i)=>pos(i,r.rate*.8).join(',')).join(' ')}" fill="#C0392B" fill-opacity=".18" stroke="#C0392B" stroke-width="2"/>`:'';
 shape+=rs.map((r,i)=>r.rate===null?'':`<circle cx="${pos(i,r.rate*.8)[0]}" cy="${pos(i,r.rate*.8)[1]}" r="3.5" fill="#C0392B"/>`).join('');
 return `<div class="radar-card" role="region" aria-label="${esc(title)}"><h3>${esc(title)}</h3><svg viewBox="0 0 280 240" role="img" aria-label="科目別正答率。外側が100パーセント。未回答は点を表示しません">${grid}${shape}</svg><details class="radar-numbers"><summary>正答率・回答数を見る</summary><ul class="radar-values">${rs.map(r=>`<li><span>${esc(r.label)}</span><b>${r.rate===null?'未回答':r.rate+'%'}<small> ${r.total.toLocaleString('ja-JP')}問</small></b></li>`).join('')}</ul></details></div>`;
 }
 window.SKIMARU_RADAR={html,rows,num};
})();
