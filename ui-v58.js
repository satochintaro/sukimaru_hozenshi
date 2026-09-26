"use strict";
(() => {
  const VERSION="5.8.0";
  document.body.classList.add("v58");

  document.title=document.title
    .replace(/Ver\s*5\.\d+(?:\.\d+)?\s*TEST/gi,`Ver ${VERSION}`)
    .replace(/5\.\d+(?:\.\d+)?/g,VERSION)
    .replace(/テスト版/g,"");

  const pv=document.querySelector(".portal-game-ver");
  if(pv)pv.textContent=`VER ${VERSION} / NEXT`;

  const info=document.querySelector(".portal-tip-card p");
  if(info)info.innerHTML=`<b>Ver ${VERSION}</b> — 学科1000問・実技90課題・2019〜2025年度ベース・学習コーチ・Manager分析。`;

  if(document.body.dataset.learningMode==="academic"){
    document.querySelectorAll("#sc-home .practical-entry").forEach(el=>el.remove());
    const sub=document.querySelector("#sc-home .hd-sub");
    if(sub)sub.textContent=`PLAYER / Ver ${VERSION} / 学科`;
  }

  if(document.body.dataset.learningMode==="practical"){
    const ttl=document.querySelector("#pt-home .hd-ttl");
    const sub=document.querySelector("#pt-home .hd-sub");
    const badge=document.querySelector("#pt-home .pt-test-badge");
    if(ttl)ttl.textContent="実技演習";
    if(sub)sub.textContent=`PLAYER / Ver ${VERSION} / 実技`;
    if(badge)badge.remove();

    const hero=document.querySelector("#pt-home .pt-hero");
    if(hero){
      const span=hero.querySelector(":scope > span");
      const h1=hero.querySelector("h1");
      const p=hero.querySelector("p");
      const small=hero.querySelector("small");
      if(span)span.textContent="PRACTICAL TRAINING";
      if(h1)h1.textContent="実技演習";
      if(p)p.textContent="課題文・図・設備要素を読み、空欄ごとに適切な語句を選択して理解を定着させます。";
      if(small)small.textContent="全90課題・ランダム10課題・2019〜2025年度ベース";
    }
    const primary=document.querySelector("#pt-home .pt-primary");
    if(primary)primary.textContent="ランダム10課題";
    const reset=document.querySelector("#pt-home .pt-reset");
    if(reset)reset.textContent="実技成績をリセット";
  }

  const managerSub=document.querySelector(".manager-header .hd-sub");
  if(managerSub)managerSub.textContent=document.body.classList.contains("viewer-page")
    ?`MANAGER / Ver ${VERSION} / 閲覧専用`
    :`MANAGER / Ver ${VERSION} / 全体・個人分析`;

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").then(r=>r.update()).catch(()=>{});
  }
})();
