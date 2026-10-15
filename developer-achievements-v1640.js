"use strict";
(() => {
 if(document.body.classList.contains('viewer-page'))return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const catalog=window.SKIMARU_ACHIEVEMENTS.catalog({}),ranks=window.SKIMARU_ACHIEVEMENTS.rankNames;
 const knownIds=new Set(catalog.map((_,i)=>'learning-v165-'+i));
 const ids=r=>Array.isArray(r.unlocked)?r.unlocked.filter(x=>knownIds.has(x)):[];
 let revision=0;
 async function mount(host,filters){const rev=++revision;host.innerHTML='<p role="status">実績の解放状況を読み込み中…</p>';
 try{
  if(!(await ensureSession()))throw Error('login');const c=window.SKIMARU_SUPABASE;
  const res=await fetch(c.url+'/rest/v1/rpc/skimaru_developer_achievements',{method:'POST',headers:authHeaders(session.access_token),body:'{}',cache:'no-store'});
  if(!res.ok)throw Error('fetch');const all=await res.json();if(!Array.isArray(all))throw Error('format');
  if(rev!==revision||!host.isConnected)return;
  const rows=all.filter(r=>(!filters.p_site||r.site===filters.p_site)&&(!filters.p_grade||r.grade===filters.p_grade));let query='',sort='unlocked',page=0;
  const confirmed=rows.filter(r=>r.status==='synced'),people=new Set(rows.map(r=>r.player_no)).size;
  host.innerHTML='<h3>みんなの実績</h3><p>登録者 '+people+'人 ／ 実績情報あり '+confirmed.length+'人・級 ／ 未取得 '+(rows.length-confirmed.length)+'人・級</p><p class="usage-note">1級と2級の実績は別々です。最新の同期・バックアップに保存された解放記録を表示します。未同期・実績情報なしは未解放ゼロと区別します。複数端末の記録は合算しません。</p><div class="usage-controls"><label>名前・No.で検索<input type="search" data-achievement-query maxlength="80" placeholder="名前・プレイヤーNo."></label><label>並べ替え<select data-achievement-sort><option value="unlocked">解放数が多い順</option><option value="rank">ランクが高い順</option><option value="name">名前順</option><option value="sync">同期が新しい順</option></select></label></div><p data-achievement-count role="status"></p><div class="achievement-players"></div><div class="achievement-pages"><button type="button" data-achievement-prev>前へ</button><span data-achievement-page></span><button type="button" data-achievement-next>次へ</button></div><details class="achievement-summary"><summary>実績ごとの解放状況</summary><p>分母は実績情報を取得できた人・級です。未取得の記録は除きます。</p><div>'+catalog.map((a,i)=>'<p><strong>'+esc(a.name)+'</strong><span>'+confirmed.filter(r=>ids(r).includes('learning-v165-'+i)).length+' / '+confirmed.length+' 人・級</span></p>').join('')+'</div></details>';
  function draw(){const list=rows.filter(r=>(r.name+' '+r.player_no+' '+r.site).toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>{
   if(sort==='name')return String(a.name).localeCompare(String(b.name),'ja');
   if(sort==='sync')return (Date.parse(b.saved_at)||0)-(Date.parse(a.saved_at)||0);
   const known=(b.status==='synced')-(a.status==='synced');return known||(sort==='rank'?Number(b.rank??-1)-Number(a.rank??-1):ids(b).length-ids(a).length)||String(a.name).localeCompare(String(b.name),'ja')||a.grade-b.grade;
  }),pages=Math.max(1,Math.ceil(list.length/8));page=Math.min(page,pages-1);
  host.querySelector('[data-achievement-count]').textContent=list.length+'人・級';
  host.querySelector('.achievement-players').innerHTML=list.slice(page*8,page*8+8).map(r=>{const unlocked=ids(r),isKnown=r.status==='synced',rank=Number.isInteger(r.rank)&&ranks[r.rank]?ranks[r.rank]:'ランク未取得';return '<details class="achievement-person"><summary><div><strong>'+esc(r.name)+'</strong><small>'+esc(r.site+' ／ '+r.player_no+' ／ '+r.grade+'級')+'</small></div><div><b>'+esc(isKnown?unlocked.length+' / '+catalog.length:'未取得')+'</b><small>'+esc(isKnown?rank:r.status==='not_synced'?'この級の記録なし':'実績情報なし')+'</small></div></summary><p>最終同期：'+esc(r.saved_at?new Date(r.saved_at).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'}):'未同期')+'</p>'+(isKnown?'<ul>'+catalog.map((a,i)=>'<li><span>'+esc(unlocked.includes('learning-v165-'+i)?'✓ 解放':'◇ 未解放')+'</span><div><b>'+esc(a.name)+'</b><small>'+esc(a.condition)+'</small></div></li>').join('')+'</ul>':'<p>この級のホーム画面をオンラインで開き、同期できると実績情報が反映されます。</p>')+'</details>';}).join('')||'<p>該当するプレイヤーはいません。</p>';
  host.querySelector('[data-achievement-page]').textContent=(page+1)+' / '+pages;host.querySelector('[data-achievement-prev]').disabled=page===0;host.querySelector('[data-achievement-next]').disabled=page===pages-1;
  }
  host.querySelector('[data-achievement-query]').oninput=e=>{query=e.target.value;page=0;draw();};host.querySelector('[data-achievement-sort]').onchange=e=>{sort=e.target.value;page=0;draw();};host.querySelector('[data-achievement-prev]').onclick=()=>{page--;draw();};host.querySelector('[data-achievement-next]').onclick=()=>{page++;draw();};draw();
 }catch{if(rev===revision&&host.isConnected)host.innerHTML='<p role="alert">実績情報を取得できませんでした。開発者のログインと通信を確認して「更新」を押してください。</p>';}
 }
 window.SKIMARU_DEV_ACHIEVEMENTS={mount};
})();
