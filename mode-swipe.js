"use strict";

(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;
  let startX=0,startY=0,startAt=0,tracking=false;
  const homeIsActive=()=>current==="academic"
    ?document.getElementById("sc-home")?.classList.contains("active")
    :document.getElementById("pt-home")?.classList.contains("active");
  document.addEventListener("touchstart",event=>{
    if(!homeIsActive()||event.touches.length!==1)return;
    const touch=event.touches[0];startX=touch.clientX;startY=touch.clientY;startAt=Date.now();tracking=true;
  },{passive:true});
  document.addEventListener("touchend",event=>{
    if(!tracking||!homeIsActive()||!event.changedTouches.length)return;tracking=false;
    const touch=event.changedTouches[0],dx=touch.clientX-startX,dy=touch.clientY-startY;
    if(Date.now()-startAt>900||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.35)return;
    if(current==="academic"&&dx<0)location.href="./practical.html";
    if(current==="practical"&&dx>0)location.href="./player.html";
  },{passive:true});
})();
