"use strict";
((root)=>{
 const num=x=>Math.max(0,Number(x)||0),names={'sc-home':'学科ホーム','pt-home':'実技ホーム','sc-quiz':'問題回答','exam':'年度別問題','sc-stats':'学習分析','tool:analysis':'学習分析','sc-send':'成績提出','tool:submit':'成績提出','results':'採点結果','tool:review':'復習'};
 function analyze(data={}){
  const s=data.summary||{},pages=data.pages||[],buttons=data.buttons||[],days=data.daily||[],errors=data.errors||[];
  const players=num(s.players),views=num(s.views),recordedDays=new Set(days.map(x=>x.day)).size,enough=players>=5&&views>=100&&recordedDays>=7;
  const evidence={players,views,recordedDays,provisional:!enough};let cards=[];
  const card=(id,priority,title,basis,action,measure,caution)=>({id,priority,title,basis,action,measure,caution,provisional:!enough});
  if(!players)return {evidence,cards:[card('start',1,'まず計測と配布を確認する','利用者の記録がまだありません。','更新した端末で学習し、閲覧・操作の記録が届くか確認します。','テスト利用後に閲覧数とタップ数が増えること。','未記録は、利用者がいないことの証明ではありません。')],nextMetrics:needed()};
  const errorCount=errors.reduce((a,x)=>a+num(x.occurrences),0);
  if(errorCount)cards.push(card('errors',1,'エラーのある画面を先に確認する',`選択期間に ${errorCount}件のエラーを計測。最多は ${errors[0].page} / ${names[errors[0].screen]||errors[0].screen}。`,'該当する端末・画面で再現し、画像表示と読み込みを確認します。必要なら利用者へ状況を聞きます。','修正後の同じ画面・同じ端末条件で、エラー回数を閲覧数と併せて比較。','エラー件数は、学習が停止した人数や回数とは一致しません。'));
  const hot=[...pages].filter(x=>num(x.views)>0).sort((a,b)=>num(b.seconds)-num(a.seconds)||num(b.views)-num(a.views))[0];
  if(hot)cards.push(card('hot',2,`${names[hot.screen]||hot.screen}を改善候補にする`,`${hot.page}：${num(hot.views)}閲覧、${num(hot.players)}人、アクティブ表示 ${Math.floor(num(hot.seconds)/60)}分。`,'よく使う方に、文字・原本画像の見やすさと次の操作の分かりやすさを聞きます。改善は1項目ずつ試します。','変更した操作にかかるタップ数と、利用者の確認結果を更新前後で比較。','滞在が長いだけでは、分かりにくい画面とは判断できません。'));
  const submits=pages.filter(x=>/sc-send|tool:submit/.test(x.screen)).reduce((a,x)=>a+num(x.views),0),quiz=pages.filter(x=>/sc-quiz|exam/.test(x.screen)).reduce((a,x)=>a+num(x.views),0);
  if(quiz>=20&&submits===0)cards.push(card('submit',2,'成績提出までの導線を確認する',`問題画面は ${quiz}閲覧、提出画面は0閲覧。`,'採点結果やホームの提出ボタンを実機で確認し、迷う場所があれば導線を見直します。','提出画面の閲覧に加え、提出成功・失敗を次の計測項目に追加。','画面を見ずに提出できる経路もあるため、未提出とは断定できません。'));
  const top=[...buttons].sort((a,b)=>num(b.taps)-num(a.taps))[0];
  if(top&&num(top.taps)>=20)cards.push(card('operation',3,'多用される操作を実機で確認する',`${top.page} / ${top.screen} の ${top.action} が ${num(top.taps)}タップ、${num(top.players)}人。`,'同じ目的を達成するまでの操作を確認します。必要な回答操作と、戻る・開き直す操作を分けて調べます。','1回の学習開始・完了に必要な操作数を、手順をそろえて比較。','よく押される操作は正常な学習操作かもしれません。回数だけで削除しないでください。'));
  const analysisViews=pages.filter(x=>/sc-stats|tool:analysis/.test(x.screen)).reduce((a,x)=>a+num(x.views),0);
  if(views>=100&&analysisViews/views<0.03)cards.push(card('analysis',3,'学習分析を見てもらえる導線を試す',`${views}閲覧のうち学習分析は ${analysisViews}閲覧。`,'結果画面から、自分の苦手科目を確認できる案内を小さく追加して試します。','学習分析の閲覧割合と、そこから復習を始めた件数を確認。','利用が少ない機能が不要とは限りません。目的に合った導線かを確認します。'));
  cards=cards.sort((a,b)=>a.priority-b.priority).slice(0,3);
  return {evidence,cards,nextMetrics:needed()};
 }
 function needed(){return [{name:'学習開始・完了',why:'開始した学習が最後まで進んだかを確認する。'},{name:'提出成功・失敗',why:'画面閲覧と、実際に成績が届いたことを区別する。'},{name:'問題・画像の表示時間',why:'表示が遅い画面や端末を優先して直す。'},{name:'フォロー後の再利用',why:'送信・既読・次回利用を見て、フォローの仕方を調整する。'}];}
 function followReason(p){const days=num(p.active_days),sessions=num(p.sessions),seconds=num(p.seconds);if(p.due)return {key:'due',label:'次回フォロー日を過ぎています',priority:0};if(days>=2&&sessions>=3)return {key:'regular',label:`継続利用：${days}日 / ${sessions}セッション`,priority:1};if(seconds>=1800)return {key:'active',label:`活発な利用：${Math.floor(seconds/60)}分`,priority:2};if(p.follow_state==='watching')return {key:'watching',label:'フォロー対象に登録済み',priority:3};return {key:'manual',label:'必要に応じてフォロー',priority:4};}
 root.SKIMARU_DEV_INSIGHTS={analyze,followReason};if(typeof module!=='undefined')module.exports=root.SKIMARU_DEV_INSIGHTS;
})(typeof window!=='undefined'?window:globalThis);
