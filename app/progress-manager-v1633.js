"use strict";
(() => {
 let items=[],message='',generation=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>v?new Date(v).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'未報告';
 async function load(rpc,developer){const id=++generation,before=JSON.stringify([items,message]);try{const data=await rpc(developer?'skimaru_developer_progress_status':'skimaru_manager_progress_status');if(!Array.isArray(data))throw Error('invalid_status');if(id!==generation)return false;items=data;message='';}catch{if(id!==generation)return false;message=items.length?'自動同期の状況を更新できませんでした。前回取得分を表示しています。':'自動同期の状況を取得できませんでした。更新して再試行してください。';}return before!==JSON.stringify([items,message]);}
 function html(){
  const grade=Number(document.getElementById('manager-grade')?.value||2),site=document.getElementById('site-filter')?.value||'';
  const rows=items.filter(x=>x.grade===grade&&(!site||x.site===site));
  return '<section class="manager-section progress-status-panel"><h2>自動同期・完了報告の状況</h2><p>成績は提出操作なしで更新します。途中の回答は採点済みの成績と分けて表示します。完了報告は任意です。</p>'+(message?'<p role="status">'+esc(message)+'</p>':'')+(rows.length?'<div class="player-table-wrap"><table class="player-table"><thead><tr><th>拠点・名前</th><th>科目</th><th>採点済み</th><th>途中の回答</th><th>報告後の進捗</th><th>最終同期</th><th>最終完了報告</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.site+' ／ '+x.name)+'<small>'+esc(x.player_no)+'</small></td><td>'+(x.type==='practical'?'実技':'学科')+'</td><td>'+x.total+'問'+(x.total?' ／ '+Math.round(100*x.correct/x.total)+'%':'')+'</td><td>'+x.pending_answers+'問</td><td>'+(x.reported_at?'＋'+x.unreported_answers+'問':'まだ完了報告なし')+'</td><td>'+fmt(x.saved_at)+'</td><td>'+fmt(x.reported_at)+'</td></tr>').join('')+'</tbody></table></div>':message?'':'<p>まだ自動同期された学習データはありません。</p>')+'<p class="note">ここに表示されるのは最後に通信できた時点の記録です。オフライン中・アプリを閉じた後の未同期分は、次にオンラインで開くと反映します。複数端末の記録は合算せず、科目ごとに最新の記録を表示します。</p></section>';
 }
 window.SKIMARU_PROGRESS_VIEW={load,html,clear:()=>{generation++;items=[];message='';}};
})();

