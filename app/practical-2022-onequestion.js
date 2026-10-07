'use strict';
(()=>{
 if(document.body.dataset.year!=='2022'||document.body.dataset.kind!=='jitugi')return;
 const KEY='skimaruEarly_2022_jitugi_v1';
 const SETS={
  a:{ア:'設備に設置されている電源・油空圧・蒸気・ガスのスイッチを切る',イ:'惰力で動き続けている機械を、工具や棒を使って停止する',ウ:'設備が空運転していないか、残圧除去はされているかを確認する',エ:'点検・修理を始める直前に電源を入れて、作業完了までそのままにする',オ:'停止責任者がブレーカー・バルブの表示を撤去する',カ:'試運転を行い、回転体に手で触れて、異常振動がないことを確認する'},
  b:{ア:'設備を停止せずに作業を開始した',イ:'安全靴を着用していた',ウ:'設備の運転速度が遅すぎた',エ:'保護メガネを着用していなかった',オ:'足下がよく見えていなかった',カ:'立ち入り禁止の表示をしていなかった',キ:'ヘルメットを着用していなかった',ク:'作業前に環境測定を行っていなかった'}
 };
 const CTX={
  1:'【設備の点検・修理時の一般的な安全手順】空欄①に当てはまる注意のポイントとして、もっとも適切なものを選びなさい。',
  2:'【設備の点検・修理時の一般的な安全手順】空欄②に当てはまる注意のポイントとして、もっとも適切なものを選びなさい。',
  3:'【設備の点検・修理時の一般的な安全手順】空欄③に当てはまる注意のポイントとして、もっとも適切なものを選びなさい。',
  4:'【作業中に発生した事故事例】ローラー清掃中に手が巻き込まれた事故の主な事故要因④として、もっとも適切なものを選びなさい。',
  5:'【作業中に発生した事故事例】段ボールを運搬中に階段を踏み外して転落した事故の主な事故要因⑤として、もっとも適切なものを選びなさい。',
  6:'【作業中に発生した事故事例】フォークリフトと歩行者が激突した事故の主な事故要因⑥として、もっとも適切なものを選びなさい。',
  7:'【作業中に発生した事故事例】汚泥槽の処理中に酸素欠乏症になった事故の主な事故要因⑦として、もっとも適切なものを選びなさい。'
 };
 const NUM=['①','②','③','④','⑤','⑥','⑦'];
 function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')||{answers:{}}}catch{return{answers:{}}}}
 function save(n,l){const s=read();s.answers=s.answers||{};s.answers[n]=l;localStorage.setItem(KEY,JSON.stringify(s))}
 function init(){
  const host=document.getElementById('questions'),source=document.getElementById('source'); if(!host||!source)return;
  let cur=1; const card=host.closest('.card');
  const panel=document.createElement('div');panel.className='pv-panel';panel.innerHTML='<div class="pv-head"><b id="q22no"></b><span id="q22prog"></span></div><div class="pv-context" id="q22ctx"></div><div class="pv-figure"><div class="pv-label">原本の該当箇所 <span>タップで原本全体</span></div><div id="q22vp" class="pv-window" role="button" tabindex="0"><img id="q22img" alt=""></div></div><button id="q22src" class="pv-source" type="button">原本を見る</button>';card.insertBefore(panel,host);
  const nav=document.createElement('div');nav.className='pv-nav';nav.innerHTML='<button id="q22prev">← 前へ</button><span id="q22dots" class="pv-pos"></span><button id="q22next">次へ →</button>';card.insertBefore(nav,document.getElementById('nav'));
  card.querySelector('h3').style.display='none'; const muted=card.querySelector('.muted');if(muted)muted.style.display='none';
  function isTask1(){return(document.getElementById('taskTitle')?.textContent||'').includes('課題1')}
  function sourceOpen(){const p=cur<=3?2:3;const img=[...source.querySelectorAll('img')].find(x=>x.src.includes(`_p${p}.jpg`))||source.querySelector('img');if(img)img.click()}
  function decorate(block,n){
   const words=n<=3?SETS.a:SETS.b;
   for(const b of [...block.querySelectorAll('.options button')]){
    const letter=b.dataset.letter||b.textContent.trim().charAt(0); b.dataset.letter=letter;
    if(!words[letter]){b.remove();continue}
    if(!b.querySelector('.oneq22-word')){b.textContent=letter;const s=document.createElement('span');s.className='oneq22-word';s.textContent=words[letter];b.appendChild(s)}
   }
  }
  function sync(block,n){const saved=read().answers?.[n];for(const b of block.querySelectorAll('.options button')){const l=b.dataset.letter;b.classList.toggle('chosen',l===saved);b.setAttribute('aria-pressed',String(l===saved))}}
  function render(){
   const on=isTask1();panel.hidden=!on;nav.hidden=!on;source.classList.toggle('pv-hidden',on);host.classList.toggle('oneq22-mode',on);document.getElementById('nav').classList.toggle('pv-hidden',on);if(!on)return;
   const blocks=[...host.querySelectorAll('.q')];blocks.forEach((b,i)=>{const n=i+1;b.hidden=n!==cur;if(n<=7){decorate(b,n);sync(b,n)}});
   document.getElementById('q22no').textContent='問題 '+NUM[cur-1];document.getElementById('q22prog').textContent=cur+' / 7';document.getElementById('q22ctx').textContent=CTX[cur];
   const img=document.getElementById('q22img');img.src=`./original_2022_jitugi_p${cur<=3?2:3}.jpg`;
   if(cur<=3){img.style.width='150%';img.style.left='-25%';img.style.top='-8%'}else{img.style.width='155%';img.style.left='-28%';img.style.top='-10%'}
   document.getElementById('q22dots').textContent=cur+' / 7';document.getElementById('q22prev').disabled=cur===1;document.getElementById('q22next').textContent=cur===7?'課題1を確認':'次へ →';
  }
  document.getElementById('q22src').onclick=sourceOpen;document.getElementById('q22vp').onclick=sourceOpen;
  document.getElementById('q22prev').onclick=()=>{if(cur>1){cur--;render();card.scrollIntoView({behavior:'smooth',block:'start'})}};
  document.getElementById('q22next').onclick=()=>{if(cur<7){cur++;render();card.scrollIntoView({behavior:'smooth',block:'start'})}};
  host.addEventListener('click',e=>{const b=e.target.closest('.options button');if(!b||!isTask1())return;const block=b.closest('.q'),n=[...host.querySelectorAll('.q')].indexOf(block)+1;if(n<1||n>7)return;save(n,b.dataset.letter);sync(block,n)});
  new MutationObserver(()=>setTimeout(render,0)).observe(host,{childList:true});render();
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init()
})();