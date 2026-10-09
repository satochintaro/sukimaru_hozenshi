"use strict";
(()=>{
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=x=>Number.isFinite(Number(x))?Math.max(0,Math.min(1e9,Number(x))):0;
 function rows(cats){return Object.entries(cats||{}).slice(0,12).map(([label,v])=>{const total=num(v?.t??v?.total),correct=Math.min(total,num(v?.c??v?.correct));return {label,total,rate:total?Math.round(correct/total*100):null};});}
 function html(cats,title='科目バランス'){const rs=rows(cats);if(rs.length<3)return '<p class="radar-note">科目別の記録が3科目以上あるとレーダーチャートを表示します。</p>';
 const n=rs.length,pos=(i,r)=>{const a=-Math.PI/2+i*Math.PI*2/n;return [180+r*Math.cos(a),155+r*Math.sin(a)].map(x=>x.toFixed(2));},points=r=>rs.map((_,i)=>pos(i,r).join(',')).join(' ');
 let grid=[25,50,75,100].map(v=>`<polygon points="${points(v)}" fill="none" stroke="#d0dcd7"/>`).join('');
 grid+=rs.map((r,i)=>{const p=pos(i,100),l=pos(i,123);return `<line x1="180" y1="155" x2="${p[0]}" y2="${p[1]}" stroke="#d0dcd7"/><text x="${l[0]}" y="${l[1]}" text-anchor="middle" font-size="13" fill="currentColor">${i+1}</text>`;}).join('');
 // Missing answers are gaps, not a misleading zero-percent filled polygon.
 const measured=rs.every(r=>r.rate!==null);let shape=measured?`<polygon points="${rs.map((r,i)=>pos(i,r.rate).join(',')).join(' ')}" fill="#1b765d" fill-opacity=".15" stroke="#1b765d" stroke-width="2"/>`:'';
 shape+=rs.map((r,i)=>r.rate===null?'':`<circle cx="${pos(i,r.rate)[0]}" cy="${pos(i,r.rate)[1]}" r="4" fill="#1b765d"/>`).join('');
 return `<div class="radar-card" role="region" aria-label="${esc(title)}"><h3>${esc(title)}</h3><svg viewBox="0 0 360 310" role="img" aria-label="科目別正答率。外側が100パーセント。番号と数値は下の一覧に表示">${grid}${shape}</svg><p class="radar-note">外側が100%。未回答の科目は点を表示しません。</p><ol class="radar-values">${rs.map(r=>`<li><span>${esc(r.label)}</span><b>${r.rate===null?'未回答':r.rate+'%'}<small> ${r.total.toLocaleString('ja-JP')}問</small></b></li>`).join('')}</ol></div>`;
 }
 window.SKIMARU_RADAR={html,rows,num};
})();
