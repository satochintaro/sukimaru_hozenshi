スキマル保全士 Ver 5.9.3 緊急レイアウト修正

スクショで発生した問題:
- 再挑戦バッジが問題文の上に重なる
- 問題カードが潰れる
- 回答後も○×ボタンが薄く残る
- 旧CSS/JSと新CSS/JSが混在する

修正:
- 問題カード内の再挑戦バッジを完全撤去
- 再挑戦は上の警告バー1本だけに統一
- 問題カードの最小高さを確保し、文章の重なりを防止
- 回答後は○×エリアを必ず非表示
- 正答・解説・次へは従来レイアウト
- 旧ゲーム演出クラスを強制無効化
- MutationObserverで古いJSがバッジを再追加しても即削除
- PWAキャッシュをr19へ更新

アップロード:
- game-effects.js
- layout-safety.css
- layout-safety.js
- quiz-static.js
- quiz-static.css
- mode-swipe.js
- ui-v58.js
- service-worker.js
- index.html（同梱時）
- manifest.webmanifest（同梱時）
