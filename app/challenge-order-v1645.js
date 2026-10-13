"use strict";
(() => {
 function build(ids,wrongIds,target,shuffle){
  const pool=[...new Set(ids.map(String))],known=new Set(pool),wrong=[...new Set(wrongIds.map(String))].filter(id=>known.has(id)),order=[],reviewSlots=[];
  if(pool.length<2||![10,1000].includes(target))throw Error('出題データを確認できません。');
  while(order.length<target){const next=shuffle(pool);if(order.length&&next[0]===order.at(-1)){const i=next.findIndex(id=>id!==next[0]);[next[0],next[i]]=[next[i],next[0]];}order.push(...next.slice(0,target-order.length));}
  let queue=[],previous;
  for(let i=9;wrong.length&&i<target;i+=10){
   if(!queue.length)queue=shuffle(wrong);
   if(queue[0]===previous&&wrong.length>1){const other=queue.findIndex(id=>id!==previous);if(other>0)[queue[0],queue[other]]=[queue[other],queue[0]];else queue=shuffle(wrong.filter(id=>id!==previous));}
   const id=queue.shift();order[i]=id;previous=id;reviewSlots.push(i+1);
   // A reserved review question must not duplicate its immediate neighbors.
   for(const j of [i-1,i+1])if(j>=0&&j<target&&order[j]===id){const avoid=new Set([id,order[j-1],order[j+1]]),choices=pool.filter(q=>!avoid.has(q));order[j]=shuffle(choices.length?choices:pool.filter(q=>q!==id))[0];}
  }
  return {order,reviewSlots,reviewPoolCount:wrong.length,poolSize:pool.length,scheduleVersion:2};
 }
 window.SKIMARU_CHALLENGE_ORDER={build};
})();
