"use strict";
(() => {
 function rank(s){const total=s.careerTotal??s.academicTotal+s.practicalTotal,coverage=s.academicPool?Math.min(1,(s.academicSeen||0)/s.academicPool):0;if(total>=3000&&coverage>=.9&&(s.careerRate||0)>=85&&(s.studySeconds||0)>=36000)return ['到達者','科目別学科の9割以上を経験し、学習量・精度・時間を積み重ねた到達者'];if(total>=1000)return ['超越者','数多くの問題を経験し、保全力を磨き続けるプレイヤー'];if(total>=100)return ['探究者','学習の習慣が育ち、知識の幅を広げているプレイヤー'];if(total>0)return ['覚醒者','保全の世界で、最初の一歩を踏み出したプレイヤー'];return ['未覚醒','まだ学習を始めていないプレイヤー'];}
 function catalog(s){return [
  ['◉','保全、始動。','学科または実技を1問解く',s.academicTotal+s.practicalTotal>=1],
  ['◇','すきまの積み重ね','学科を100問解く',s.academicTotal>=100],
  ['⌁','コツコツ整備士','学科を500問解く',s.academicTotal>=500],
  ['∞','千問の向こう側','学科を1,000問解く',s.academicTotal>=1000],
  ['☀','七日目の習慣','7日連続で学習する',s.streak>=7],
  ['◎','合格圏へ、点検完了','年度別の学科過去問で80%以上',s.bestPast!=null&&s.bestPast>=80],
  ['↗','昨日の自分を超える','同じ年度の学科過去問で前回比10ポイント以上向上',s.improvement!=null&&s.improvement>=10],
  ['⚒','現場の頼れる一手','実技を20問以上解いて累計正答率80%以上',s.practicalTotal>=20&&s.practicalRate>=80],
  ['✦','叡智の眼','累計1,500問に回答し、記録された実学習時間5時間を達成',s.careerTotal>=1500&&s.studySeconds>=18000],
  ['⌛','無限書庫','累計3,000問に回答し、記録された実学習時間15時間を達成',s.careerTotal>=3000&&s.studySeconds>=54000],
  ['✧','万象解読','科目別学科の90%以上に回答し、累計正答率85%以上・累計3,000問・実学習時間10時間を達成',s.academicPool>0&&s.academicSeen/s.academicPool>=.9&&s.careerRate>=85&&s.careerTotal>=3000&&s.studySeconds>=36000],
  ['♜','不屈の魂','累計5,000問に回答し、記録された実学習時間20時間を達成',s.careerTotal>=5000&&s.studySeconds>=72000],
  ['✵','真理掌握','累計10,000問・実学習時間30時間・累計正答率90%以上・科目別学科の95%以上に回答を達成',s.careerTotal>=10000&&s.studySeconds>=108000&&s.careerRate>=90&&s.academicPool>0&&s.academicSeen/s.academicPool>=.95]
 ].map(([icon,name,condition,unlocked])=>({icon,name,condition,unlocked}));}
 window.SKIMARU_ACHIEVEMENTS={rank,catalog,rankNames:['未覚醒','覚醒者','探究者','超越者','到達者']};
})();
