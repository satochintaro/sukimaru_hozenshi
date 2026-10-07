"use strict";
(() => {
  if(document.body.dataset.learningMode!=="academic")return;
  function remove(){
    document.querySelectorAll("#sc-home .practical-entry").forEach(el=>el.remove());
  }
  remove();
  const home=document.getElementById("sc-home");
  if(home)new MutationObserver(remove).observe(home,{childList:true,subtree:true});
})();
