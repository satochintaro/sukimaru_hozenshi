'use strict';
// Shared image viewer: only the image transforms; controls stay inside the visible viewport.
window.SKIMARU_IMAGE_VIEWER={create({year,imagePath}){
 const viewer=document.getElementById('originalViewer'),stage=document.getElementById('originalStage'),image=document.getElementById('originalImage'),close=document.getElementById('viewerClose');
 const reset=document.createElement('button');reset.type='button';reset.textContent='全体表示';reset.className='image-fit';close.before(reset);
 viewer.querySelector('small').textContent='ピンチ・ダブルタップで拡大／指で移動';
 let open=false,previousFocus,bodyStyle,scroll={x:0,y:0},frozen=[],scale=1,x=0,y=0,w=0,h=0,gesture=null,moved=false,multi=false,tap=null,downAt=0;
 const pointers=new Map();
 function focus(el){try{el?.focus({preventScroll:true});}catch{}}
 function bounds(){return {width:stage.clientWidth,height:stage.clientHeight};}
 function constrain(){const b=bounds(),sw=w*scale,sh=h*scale;x=sw<=b.width?(b.width-sw)/2:Math.max(b.width-sw,Math.min(0,x));y=sh<=b.height?(b.height-sh)/2:Math.max(b.height-sh,Math.min(0,y));}
 function draw(){constrain();image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;stage.dataset.scale=String(scale);}
 function fit(resetScale=true){if(!open||!image.naturalWidth)return;const b=bounds(),r=Math.min(b.width/image.naturalWidth,b.height/image.naturalHeight);if(!r)return;w=image.naturalWidth*r;h=image.naturalHeight*r;image.style.width=w+'px';image.style.height=h+'px';if(resetScale){scale=1;x=0;y=0;}draw();}
 function viewport(){if(!open)return;const v=window.visualViewport;viewer.style.top=(v?.offsetTop||0)+'px';viewer.style.left=(v?.offsetLeft||0)+'px';viewer.style.width=(v?.width||window.innerWidth)+'px';viewer.style.height=(v?.height||window.innerHeight)+'px';fit(false);}
 function cancelPointers(){for(const id of pointers.keys()){try{stage.releasePointerCapture(id);}catch{}}pointers.clear();gesture=null;moved=false;multi=false;tap=null;}
 function openOriginal(page,trigger){
  if(open)return;open=true;previousFocus=trigger||document.activeElement;scroll={x:window.scrollX,y:window.scrollY};bodyStyle=document.body.getAttribute('style');
  frozen=[...document.body.children].filter(el=>el!==viewer&&el.tagName!=='SCRIPT'&&el.tagName!=='STYLE').map(el=>[el,el.inert]);frozen.forEach(([el])=>el.inert=true);
  Object.assign(document.body.style,{position:'fixed',top:-scroll.y+'px',left:-scroll.x+'px',width:'100%',overflow:'hidden'});
  scale=1;x=y=0;cancelPointers();image.style.visibility='hidden';viewer.hidden=false;viewport();
  document.getElementById('originalPageLabel').textContent=`${year}年度 原本 ${page}ページ`;image.alt=`${year}年度 実技 原本PDF ${page}ページ`;
  image.onload=()=>{if(!open)return;fit();image.style.visibility='visible';};image.src=imagePath(page);
  if(image.complete&&image.naturalWidth){fit();image.style.visibility='visible';}focus(close);
 }
 function closeOriginal(){
  if(!open)return;open=false;cancelPointers();viewer.hidden=true;image.onload=null;
  frozen.forEach(([el,inert])=>el.inert=inert);frozen=[];
  if(bodyStyle===null)document.body.removeAttribute('style');else document.body.setAttribute('style',bodyStyle);
  window.scrollTo(scroll.x,scroll.y);focus(previousFocus);previousFocus=null;
 }
 function point(e){const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
 function points(){return [...pointers.values()];}
 function pair(){const p=points();return {mid:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2},distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
 function rebase(){const p=points();gesture=p.length>=2?{...pair(),scale,x,y}:p.length?{point:p[0],x,y}:null;}
 function zoom(next,anchor,base={scale,x,y},mid=anchor){scale=Math.min(6,Math.max(1,next));const ratio=scale/base.scale;x=mid.x-(anchor.x-base.x)*ratio;y=mid.y-(anchor.y-base.y)*ratio;draw();}
 stage.addEventListener('pointerdown',e=>{
  if(!open||e.button!==0)return;e.preventDefault();
  if(!pointers.size){moved=false;multi=false;downAt=performance.now();}pointers.set(e.pointerId,point(e));
  try{stage.setPointerCapture(e.pointerId);}catch{}
  if(pointers.size>1){multi=true;tap=null;}rebase();
 });
 stage.addEventListener('pointermove',e=>{
  if(!open||!pointers.has(e.pointerId)||!gesture)return;e.preventDefault();const p=point(e);pointers.set(e.pointerId,p);
  if(pointers.size>=2&&gesture.distance){const pairNow=pair();moved=true;zoom(gesture.scale*pairNow.distance/Math.max(1,gesture.distance),gesture.mid,gesture,pairNow.mid);}
  else if(pointers.size===1){const dx=p.x-gesture.point.x,dy=p.y-gesture.point.y;if(Math.hypot(dx,dy)>8)moved=true;x=gesture.x+dx;y=gesture.y+dy;draw();}
 });
 function end(e){
  if(!pointers.has(e.pointerId))return;const p=point(e);pointers.delete(e.pointerId);try{stage.releasePointerCapture(e.pointerId);}catch{}
  if(e.type!=='pointerup'){tap=null;multi=true;}
  if(!pointers.size&&!moved&&!multi&&e.type==='pointerup'&&performance.now()-downAt<280){
   const now=performance.now();if(tap&&now-tap.time<330&&Math.hypot(p.x-tap.x,p.y-tap.y)<28){zoom(scale>1.05?1:2.5,p);tap=null;}else tap={...p,time:now};
  }else if(moved||multi)tap=null;rebase();
 }
 stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
 stage.addEventListener('dblclick',e=>e.preventDefault());stage.addEventListener('click',e=>e.stopPropagation());
 stage.addEventListener('wheel',e=>{if(!open)return;e.preventDefault();tap=null;zoom(scale*Math.exp(-e.deltaY*.002),point(e));},{passive:false});
 // Handle touch controls directly: some browsers suppress the synthetic click after a pinch.
 function control(button,action){let start=null,lastTouch=0;
  button.addEventListener('touchstart',e=>{const t=e.touches.length===1?e.touches[0]:null;start=t?{id:t.identifier,x:t.clientX,y:t.clientY,moved:false}:null;},{passive:true});
  button.addEventListener('touchmove',e=>{const t=[...e.touches].find(t=>t.identifier===start?.id);if(t&&Math.hypot(t.clientX-start.x,t.clientY-start.y)>12)start.moved=true;},{passive:true});
  button.addEventListener('touchcancel',()=>start=null,{passive:true});
  button.addEventListener('touchend',e=>{const t=[...e.changedTouches].find(t=>t.identifier===start?.id);const tapped=t&&start&&!start.moved&&Math.hypot(t.clientX-start.x,t.clientY-start.y)<=12;start=null;if(!tapped)return;e.preventDefault();e.stopPropagation();lastTouch=performance.now();action();},{passive:false});
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.detail!==0&&performance.now()-lastTouch<500)return;action();});
 }
 control(close,closeOriginal);control(reset,()=>{cancelPointers();fit();});
 document.addEventListener('keydown',e=>{if(!open)return;if(e.key==='Escape'){e.preventDefault();closeOriginal();}if(e.key==='Tab'){e.preventDefault();focus(document.activeElement===close?reset:close);}});
 window.addEventListener('resize',viewport);window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
 return {open:openOriginal,close:closeOriginal};
}};
