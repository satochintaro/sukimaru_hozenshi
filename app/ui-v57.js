"use strict";
(() => {
  const VERSION="5.7.0";
  const NAME="QUEST UI";
  document.body.classList.add("quest-v57");

  document.title=document.title
    .replace(/Ver\s*5\.\d+(?:\.\d+)?\s*TEST/gi,`Ver ${VERSION} ${NAME}`)
    .replace(/5\.\d+(?:\.\d+)?/g,VERSION);

  const portalVer=document.querySelector(".portal-game-ver");
  if(portalVer)portalVer.textContent=`VER ${VERSION} / ${NAME}`;

  const info=document.querySelector(".portal-tip-card p");
  if(info)info.innerHTML=`<b>Ver ${VERSION}</b> — 過去問ベース学習・年度表示・学習コーチ・REVENGE演出・全体/個人分析を統合。`;

  const mode=document.body.dataset.learningMode;
  if(mode==="academic"){
    const sub=document.querySelector("#sc-home .hd-sub");
    if(sub)sub.textContent=`PLAYER / ${NAME} / 学科`;
  }else if(mode==="practical"){
    const sub=document.querySelector("#pt-home .hd-sub");
    if(sub)sub.textContent=`PLAYER / ${NAME} / 実技`;
  }

  const managerSub=document.querySelector(".manager-header .hd-sub");
  if(managerSub){
    managerSub.textContent=document.body.classList.contains("viewer-page")
      ?`MANAGER / ${NAME} / 閲覧専用`
      :`MANAGER / ${NAME} / 全体・個人分析`;
  }

  const hd=document.querySelector("body[data-learning-mode] section.active .hd");
  if(hd&&!hd.querySelector(".v57-build-badge")){
    const badge=document.createElement("span");
    badge.className="v57-build-badge";
    badge.textContent=`V${VERSION}`;
    const gear=hd.querySelector(".hd-ico");
    if(gear)hd.insertBefore(badge,gear); else hd.appendChild(badge);
  }

  // Installed PWA also checks the service worker immediately.
  if("serviceWorker" in navigator){
    let reloading=false;
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(reloading)return;
      if(sessionStorage.getItem("skimaru-v57-reloaded")==="1")return;
      reloading=true;
      sessionStorage.setItem("skimaru-v57-reloaded","1");
      location.reload();
    });
    navigator.serviceWorker.register("./service-worker.js")
      .then(reg=>reg.update())
      .catch(()=>{});
  }
})();
