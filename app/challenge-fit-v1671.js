'use strict';
(()=>{
 const root=document.getElementById('sd-root');if(!root)return;
 const originals=new WeakMap();let frame=null;
 function queue(){if(frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;fit();});}
 function fits(p){return p.clientHeight>0&&p.scrollHeight<=p.clientHeight+1&&p.scrollWidth<=p.clientWidth+1;}
 function copy(p){
  let state=originals.get(p);
  if(!state){const text=p.textContent,wrap=document.createElement('div'),nav=document.createElement('nav');wrap.className='sd-copy';p.before(wrap);wrap.append(p);p.classList.add('sd-copy-text');nav.className='sd-copy-pages';nav.setAttribute('aria-label','本文のページ');nav.innerHTML='<button type="button" aria-label="本文の前のページ">前へ</button><span aria-live="polite"></span><button type="button" aria-label="本文の次のページ">続き</button>';wrap.append(nav);state={text,nav,page:0};originals.set(p,state);}
  const {text,nav}=state;nav.hidden=true;p.textContent=text;
  for(let size=20;size>=16;size--){p.style.setProperty('font-size',size+'px','important');if(fits(p))return;}
  nav.hidden=false;const chars=Array.from(text),pages=[];let offset=0;
  while(offset<chars.length){let low=1,high=chars.length-offset,best=1;while(low<=high){const mid=Math.floor((low+high)/2);p.textContent=chars.slice(offset,offset+mid).join('');if(fits(p)){best=mid;low=mid+1;}else high=mid-1;}pages.push(chars.slice(offset,offset+best).join(''));offset+=best;}
  state.page=Math.min(state.page,pages.length-1);
  const buttons=nav.querySelectorAll('button');function render(){p.textContent=pages[state.page]||'';buttons[0].disabled=state.page===0;buttons[1].disabled=state.page===pages.length-1;nav.querySelector('span').textContent=(state.page+1)+' / '+pages.length;}
  buttons[0].onclick=()=>{state.page--;render();};buttons[1].onclick=()=>{state.page++;render();};render();
 }
 function fit(){
  const game=root.querySelector('#sd-play');document.body.classList.toggle('sd-playing',!!game);if(!game)return;
  if(game.classList.contains('sd-explained')&&!game.querySelector('.sd-review-tabs')){
   const question=game.querySelector('.sd-question'),note=game.querySelector('.sd-answer-note'),tabs=document.createElement('div');tabs.className='sd-review-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','解答の確認');tabs.innerHTML='<button type="button" role="tab" aria-selected="true" aria-controls="sd-review-explanation">解説</button><button type="button" role="tab" aria-selected="false" aria-controls="sd-review-problem">問題文・図</button>';question.before(tabs);question.id='sd-review-problem';note.id='sd-review-explanation';question.setAttribute('role','tabpanel');note.setAttribute('role','tabpanel');question.hidden=true;
   tabs.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{question.hidden=i===0;note.hidden=i===1;tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',String(x===b)));queue();});
  }
  for(const p of game.querySelectorAll('.sd-question>p,.sd-question>.sd-copy>p,.sd-answer-note>p,.sd-answer-note>.sd-copy>p'))if(!p.closest('[hidden]'))copy(p);
 }
 new MutationObserver(()=>{document.body.classList.toggle('sd-playing',!!root.querySelector('#sd-play'));queue();}).observe(root,{childList:true});
 root.addEventListener('load',e=>{if(e.target.tagName==='IMG')queue();},true);root.addEventListener('error',e=>{if(e.target.tagName==='IMG')queue();},true);
 window.addEventListener('resize',queue);window.visualViewport?.addEventListener('resize',queue);document.fonts?.addEventListener('loadingdone',queue);document.fonts?.ready.then(queue);queue();
})();
