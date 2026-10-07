スキマル保全士 Manager整理 + ゲーム演出 更新

アップロードする7ファイル
【上書き】
- admin.html
- mode-swipe.js
- service-worker.js

【新規】
- manager-organizer.js
- manager-ui-v55.css
- game-effects.js
- game-effects.css

Manager変更
- 1段目：全体分析 / 個人別分析
- 2段目：学科 / 実技 / 総合
- 全体の苦手分野と全体向けAI教育を分離
- 個人の苦手分野と個人向けAI教育を分離
- 詳細情報は折りたたみ
- 学習コーチ設定を独立ボタン化
- 長い文字の画面割れ・横はみ出し対策

Player変更
- 過去に誤答歴がある学科問題に REVENGE CHANCE 演出
- 正解時：RETRY CLEAR! + スパーク
- 再度誤答時：RETRY CONTINUES
- 模擬試験では演出を出さない
- 「誤答アラート表示」がOFFの場合も演出は出さない
- prefers-reduced-motion に対応

データ構造・学習履歴・問題データ・Supabaseテーブルは変更しません。
