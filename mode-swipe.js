"use strict";

(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;
  const loaded=new Set();

  function loadScript(src){
    if(loaded.has(src)||document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.src=src;s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }
  function loadStyle(src){
    if(document.querySelector(`link[href="${src}"]`))return;
    const l=document.createElement("link");l.rel="stylesheet";l.href=src;document.head.appendChild(l);
  }
  function updateVersionDisplay(){
    document.title=document.title.replace(/5\.[23]\.0/g,"5.4.0");
    if(current==="academic"){
      const practicalInfo=document.querySelector(".practical-entry-body em");if(practicalInfo)practicalInfo.textContent="60課題からランダム10課題を出題";
      const status=document.querySelector("#sc-set .sts span:last-child");if(status)status.innerHTML='Ver 5.4 ／ 全 <span id="st-qn">1000</span> 問';
    }else{
      const heroInfo=document.querySelector(".pt-hero small");if(heroInfo)heroInfo.textContent="問題バンク60課題・毎回ランダム10課題／公式問題の転載ではありません";
      const sub=document.querySelector("#pt-home .hd-sub");if(sub)sub.textContent="PRACTICAL ／ Ver 5.4 TEST";
    }
  }

  async function loadEnhancements(){
    try{
      loadStyle("./coach.css");
      await loadScript("./year-mode-core.js");
      if(current==="academic"){
        await loadScript("./year-question-data.js");await loadScript("./year-mode.js");
        if(typeof APP!=="undefined"&&APP)APP.version="5.4.0-test";
      }else{
        await loadScript("./practical-year-data.js");await loadScript("./practical-year-mode.js");
      }
      await loadScript("./coach-shared.js");
      await loadScript("./coach-player.js");
    }catch(error){console.error("Ver 5.4.0 拡張読込エラー",error);}
  }
  updateVersionDisplay();loadEnhancements();

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
