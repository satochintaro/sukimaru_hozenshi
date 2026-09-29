スキマル保全士 Ver 5.9.7 緊急軽量化

原因:
- 5.9.6の実技スクロール監視が is-scrollable のclass変更を自分で監視し、更新ループになる構造でした。
- 全画面 backdrop-filter blur もiPhoneで描画負荷が高い状態でした。

修正:
- MutationObserverを完全撤去
- 問題を表示した時だけスクロール位置を1回リセット
- 長文スクロールはCSSの max-height + overflow:auto のみで処理
- 短い設問は自然な高さのまま
- 実技の画像・資料は長い時だけ自動スクロール
- 選択肢が多い時も回答欄だけ自動スクロール
- ローディングの全画面ぼかしを廃止
- 軽い半透明ベール＋単純なリングだけに変更
- Service Workerをr23へ更新

アップロード:
question-scroll-v597.js（新規）
question-scroll-v597.css（新規）
performance-v597.css（新規）
mode-swipe.js
ui-v58.js
service-worker.js
index.html
manifest.webmanifest

5.9.6の question-scroll-v596.js/css は残っていても読み込みません。
