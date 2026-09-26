"use strict";
(() => {
  const VERSION="5.8.1";
  document.body.classList.add("v58");

  document.title=document.title
    .replace(/Ver\s*5\.\d+(?:\.\d+)?\s*TEST/gi,`Ver ${VERSION}`)
    .replace(/5\.\d+(?:\.\d+)?/g,VERSION)
    .replace(/\bTEST\b/gi,"");

  const mode=document.body.dataset.learningMode;
  if(mode==="academic"){
    document.querySelectorAll("#sc-home .practical-entry").forEach(el=>el.remove());
    const sub=document.querySelector("#sc-home .hd-sub");
    if(sub)sub.textContent=`自主保全士2級 / 学科 / Ver ${VERSION}`;
  }

  if(mode==="practical"){
    const title=document.querySelector("#pt-home .hd-ttl");
    const sub=document.querySelector("#pt-home .hd-sub");
    if(title)title.textContent="実技演習";
    if(sub)sub.textContent=`自主保全士2級 / 実技 / Ver ${VERSION}`;
    document.querySelector("#pt-home .pt-test-badge")?.remove();

    const hero=document.querySelector("#pt-home .pt-hero");
    if(hero){
      const label=hero.querySelector(":scope > span");
      const h1=hero.querySelector("h1");
      const p=hero.querySelector("p");
      const small=hero.querySelector("small");
      if(label)label.textContent="実技演習";
      if(h1)h1.textContent="実技演習";
      if(p)p.textContent="課題文や図を見ながら、空欄に入る語句を選んで理解を定着させます。";
      if(small)small.textContent="全90課題 / ランダム10課題 / 2019〜2025年度ベース";
    }
    const primary=document.querySelector("#pt-home .pt-primary");
    if(primary)primary.textContent="ランダム10課題";
  }

  const managerSub=document.querySelector(".manager-header .hd-sub");
  if(managerSub){
    managerSub.textContent=document.body.classList.contains("viewer-page")
      ?`閲覧専用 / Ver ${VERSION}`
      :`全体・個人分析 / Ver ${VERSION}`;
  }

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").then(r=>r.update()).catch(()=>{});
  }
})();
