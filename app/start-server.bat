@echo off
chcp 65001 >nul
cd /d "%~dp0"
title スキマル保全士 LANサーバー

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [エラー] Node.js が見つかりません。
  echo このPCへ Node.js をインストールしてから、もう一度実行してください。
  echo.
  pause
  exit /b 1
)

echo スキマル保全士を起動しています...
echo ブラウザは自動で開きます。黒い画面は閉じないでください。
start "" cmd /c "timeout /t 2 /nobreak >nul & start \"\" http://localhost:8787"
node server.js

echo.
echo サーバーが停止しました。
pause
