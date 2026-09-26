スキマル保全士 Ver 5.9.4 問題画面バランス修正

変更:
- 問題エリアの flex:1 を廃止
- 短文/長文/再挑戦でカード高さが極端に変わらないよう統一
- 問題カード 基本205〜240px
- 長文のみカード内スクロール
- 自信選択・○×エリアを一定の高さに整理
- 回答後は○×エリアを消して、正答・解説・次への元レイアウト
- 解説カードも高さと余白を統一
- game-effects.js を問題画面で読み込まない
- 再挑戦は上部の警告バーだけ
- 古い再挑戦バッジ/演出は強制削除
- 画面揺れ・自動スクロールなし

アップロード:
quiz-balance-v594.css
quiz-balance-v594.js
quiz-static.js
quiz-static.css
mode-swipe.js
ui-v58.js
service-worker.js
index.html（同梱時）
manifest.webmanifest（同梱時）
