"use strict";
(()=>{
 let view='directory',part=0;
 const pad=document.querySelector('.manager-pad');if(!pad)return;
 const tabs=document.createElement('nav');tabs.className='developer-tabs';tabs.setAttribute('aria-label','開発者メニュー');tabs.innerHTML=[['directory','登録者'],['analysis','学習分析'],['contact','連絡'],['settings','設定']].map(([id,name])=>`<button type="button" data-dev-view="${id}" aria-selected="false">${name}</button>`).join('');pad.prepend(tabs);
 const contact=document.createElement('div');contact.className='developer-contact';contact.innerHTML='<h2>連絡・不具合</h2><p>報告への返信と対応状況の更新、お知らせの公開を行えます。</p>';pad.append(contact);
 const sectionTabs=document.createElement('nav');sectionTabs.className='developer-section-tabs';sectionTabs.setAttribute('aria-label','分析の項目');
 const report=document.getElementById('ad-rep');report.before(sectionTabs);
 function compact(){report.querySelectorAll('.player-table-wrap').forEach((table,i)=>{if(table.parentElement.tagName==='DETAILS')return;const d=document.createElement('details'),summary=document.createElement('summary');summary.textContent=i?'拠点別の数値を見る':'個人別の数値を見る';table.before(d);d.append(summary,table);});}
 function sections(){compact();report.querySelectorAll(':scope > .mgr-page-head').forEach(e=>e.classList.add('developer-analysis-hidden'));const children=[...report.children].filter(e=>!e.classList.contains('mgr-page-head'));if(!children.length)return;sectionTabs.replaceChildren();children.forEach((el,i)=>{const label=(el.querySelector('h2,summary')?.textContent||(el.classList.contains('manager-stat-grid')?'概要':'その他')).trim();const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.part=i;sectionTabs.append(button);button.onclick=()=>{part=i;sections();};el.classList.toggle('developer-analysis-hidden',i!==part);});if(part>=children.length){part=0;sections();return;}sectionTabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',+b.dataset.part===part));}
 function sync(){tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.devView===view)));
  document.getElementById('registered-players')?.classList.toggle('dev-hidden',view!=='directory');
  report.classList.toggle('dev-hidden',view!=='analysis');sectionTabs.classList.toggle('dev-hidden',view!=='analysis');
  pad.querySelectorAll('.manager-scope-tabs,.manager-mode-tabs').forEach(el=>el.classList.toggle('dev-hidden',view!=='analysis'));
  const filters=pad.querySelector('.site-filters');filters?.classList.toggle('dev-hidden',!['directory','analysis'].includes(view));filters?.querySelectorAll('small').forEach(e=>e.hidden=true);document.getElementById('manager-grade')?.closest('label')?.classList.toggle('dev-hidden',view!=='analysis');
  pad.querySelector('.manager-actions')?.classList.toggle('dev-hidden',view!=='settings');
  contact.classList.toggle('dev-hidden',view!=='contact');const support=pad.querySelector('.support-launchers')||contact.querySelector('.support-launchers');if(support&&support.parentElement!==contact)contact.append(support);
 }
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{view=b.dataset.devView;sync();});
 new MutationObserver(()=>{sections();sync();}).observe(report,{childList:true});
 let queued=false;new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;sync();});}}).observe(pad,{childList:true,subtree:true});
 sections();sync();
})();
