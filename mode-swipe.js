"use strict";
(() => {
  const current=document.body.dataset.learningMode;
  if(current!=="academic"&&current!=="practical")return;
  const loaded=new Set();

  // 初期化途中の「古いUI→新しいUI→カード追加」を利用者に見せない。
  const bootStyle=document.createElement("style");
  bootStyle.id="skimaru-boot-style";
  bootStyle.textContent=`
    body.skimaru-booting{min-height:100dvh;background:#f5f7f8!important}
    body.skimaru-booting>section,
    body.skimaru-booting>.toast,
    body.skimaru-booting>.player-detail{visibility:hidden!important}
    body.skimaru-booting::before{
      content:"スキマル保全士";
      position:fixed;inset:0;z-index:999999;
      display:flex;align-items:center;justify-content:center;
      background:#f5f7f8;color:#172431;
      font:800 24px/1.2 -apple-system,BlinkMacSystemFont,"Helvetica Neue","Noto Sans JP",sans-serif;
      letter-spacing:-.03em
    }`;
  document.head.appendChild(bootStyle);
  document.body.classList.add("skimaru-booting");

  function loadScript(src){
    if(loaded.has(src)||document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;s.async=false;
      s.onload=()=>{loaded.add(src);resolve();};
      s.onerror=()=>reject(new Error(`load failed: ${src}`));
      document.body.appendChild(s);
    });
  }

  function loadStyle(src){
    const existing=document.querySelector(`link[href="${src}"]`);
    if(existing){
      if(existing.sheet)return Promise.resolve();
      return new Promise(resolve=>{
        existing.addEventListener("load",resolve,{once:true});
        setTimeout(resolve,1200);
      });
    }
    return new Promise(resolve=>{
      const l=document.createElement("link");
      l.rel="stylesheet";l.href=src;
      l.onload=resolve;l.onerror=resolve;
      document.head.appendChild(l);
    });
  }

  function updateVersion(){
    document.title=document.title.replace(/5\.\d+(?:\.\d+)?/g,"5.8.3").replace(/TEST/gi,"");
    if(current==="academic"){
      const st=document.querySelector("#sc-set .sts span:last-child");
      if(st)st.innerHTML='Ver 5.8.3 ／ 全 <span id="st-qn">1000</span> 問';
    }
  }

  async function loadEnhancements(){
    try{
      // まず見た目を全部読み切る。
      const commonStyles=[
        "./theme-v58.css",
        "./coach.css"
      ];
      if(current==="academic"){
        commonStyles.push("./academic-ui-v56.css","./answer-animation-off.css","./quiz-static.css?v=15");
      }
      await Promise.all(commonStyles.map(loadStyle));

      await loadScript("./ui-v58.js");
      await loadScript("./year-mode-core.js");

      if(current==="academic"){
        await loadScript("./academic-remove-practical.js");
        await loadScript("./year-question-data.js");
        await loadScript("./year-mode.js");
        await loadScript("./academic-ui-v56.js");

        // 元の判定UIを静的表示に変更してから、誤答表示だけを追加。
        await loadScript("./quiz-static.js?v=15");
        await loadScript("./coach-shared.js");
        await loadScript("./coach-player.js");
        await loadScript("./game-effects.js?v=14");

        if(typeof APP!=="undefined"&&APP)APP.version="5.8.3";
      }else{
        await loadScript("./practical-year-data.js");
        await loadScript("./practical-year-data-v58.js");
        await loadScript("./practical-year-mode.js");
        await loadScript("./practical-v58.js");
        await loadScript("./coach-shared.js");
        await loadScript("./coach-player.js");
      }

      // DOM挿入とCSS適用を2フレーム待ってから、完成画面を一度だけ表示。
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    }catch(error){
      console.error("画面初期化エラー",error);
    }finally{
      document.body.classList.remove("skimaru-booting");
      document.getElementById("skimaru-boot-style")?.remove();
    }
  }

  updateVersion();
  loadEnhancements();

  let startX=0,startY=0,startAt=0,tracking=false;
  const homeIsActive=()=>current==="academic"
    ?document.getElementById("sc-home")?.classList.contains("active")
    :document.getElementById("pt-home")?.classList.contains("active");

  document.addEventListener("touchstart",e=>{
    if(!homeIsActive()||e.touches.length!==1)return;
    const t=e.touches[0];startX=t.clientX;startY=t.clientY;startAt=Date.now();tracking=true;
  },{passive:true});

  document.addEventListener("touchend",e=>{
    if(!tracking||!homeIsActive()||!e.changedTouches.length)return;
    tracking=false;
    const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;
    if(Date.now()-startAt>900||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.35)return;
    if(current==="academic"&&dx<0)location.href="./practical.html";
    if(current==="practical"&&dx>0)location.href="./player.html";
  },{passive:true});
})();
