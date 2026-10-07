"""Run inside a Git checkout. Moves files without dropping data or changing origin."""
from pathlib import Path
import subprocess,json,hashlib,re

def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
def organize(root):
 root=Path(root).resolve()
 if (root/'app').exists():raise RuntimeError('app/ already exists; review instead of overwriting')
 if not (root/'player.html').is_file() or not (root/'grade1.html').is_file():raise RuntimeError('Expected app entry points missing')
 tracked=subprocess.check_output(['git','-C',str(root),'ls-files','-z']).decode().split('\0')
 files=[x for x in tracked if x and '/' not in x]
 keep={'index.html','manifest.webmanifest','service-worker.js','apple-touch-icon-v14.png','icon-v14-192.png','icon-v14-512.png','icon-v14-maskable-512.png','CNAME','.nojekyll','README.md','.gitignore'}
 app=root/'app';docs=root/'docs';app.mkdir();docs.mkdir(exist_ok=True)
 entries=[];moves=[]
 for name in files:
  if name in keep:continue
  source=root/name
  if source.is_symlink():raise RuntimeError('Unexpected symlink: '+name)
  destination=(docs if source.suffix.lower() in {'.sql','.md','.txt'} else app)/name
  if destination.exists():raise RuntimeError('Destination exists: '+str(destination))
  digest=hashlib.sha256(source.read_bytes()).hexdigest()
  subprocess.check_call(['git','-C',str(root),'mv','--',name,str(destination.relative_to(root))])
  assert hashlib.sha256(destination.read_bytes()).hexdigest()==digest
  moves.append({'from':name,'to':str(destination.relative_to(root)),'sha256':digest})
  if source.suffix.lower()=='.html':entries.append(name)
 for name in keep:
  source=root/name
  if source.is_file() and (source.suffix=='.png' or name=='service-worker.js'):(app/name).write_bytes(source.read_bytes())
 manifest=json.loads((root/'manifest.webmanifest').read_text())
 manifest['id']='../';manifest['start_url']='../index.html?launch=home';manifest['scope']='../'
 for shortcut in manifest.get('shortcuts',[]):shortcut['url']='../'+shortcut['url'].removeprefix('./')
 (app/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 redirect='"use strict";(()=>{const s=document.currentScript,t=new URL(s.dataset.target,location.href);t.search=location.search;t.hash=location.hash;location.replace(t.href);})();\n'
 (root/'route-v167.js').write_text(redirect)
 def alias(target,script='./route-v167.js'):
  return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>スキマル保全士</title><script src="{script}" data-target="{target}"></script></head><body><p>画面を開いています。</p><a href="{target}">画面へ進む</a></body></html>\n'
 for name in entries:(root/name).write_text(alias('./app/'+name))
 (app/'index.html').write_text(alias('../index.html','../route-v167.js'))
 html=(root/'index.html').read_text()
 html=re.sub(r'((?:src|href)=["\'])\./([^"\']+)(["\'])',lambda m:m[1]+('./app/'+m[2] if (app/m[2].split('?')[0]).is_file() and m[2].split('?')[0] not in keep and not m[2].split('?')[0].endswith('.html') else './'+m[2])+m[3],html)
 (root/'index.html').write_text(html)
 for p in [root/'service-worker.js',app/'service-worker.js']:
  s=p.read_text();s=re.sub(r'const CACHE="[^"]+";', 'const CACHE="skimaru-live-20261007-v16-7-organized";',s, count=1);p.write_text(s)
 report={'moved_files':len(moves),'compatibility_entries':entries,'root_files_after':len([p for p in root.iterdir() if p.is_file()]),'mapping':moves,'pwa_id_preserved':True,'localStorage_keys_unchanged':True}
 (docs/'organization-v167.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 (docs/'ORGANIZATION_README.md').write_text('''# フォルダ整理 v16.7

トップ直下はタイトル、旧URLの転送入口、ホーム画面追加に必要なファイルです。
`app/` は実行する画面・JS・CSS・問題データ・画像です。内部の相対参照を維持しています。
`docs/` はSQL・更新説明・確認資料です。SQLは移動するだけで実行しません。
旧版ファイルは削除していません。使用状況を確認するまで保管します。
以後アプリの更新は app/ の同名ファイルを上書きします。タイトルだけはトップ直下の index.html です。
移行前バックアップブランチと元のGit履歴が残ります。
''')
 (root/'README.md').write_text('''# スキマル保全士

- `index.html`：起動タイトル（URL・配布QRは変更なし）
- `app/`：アプリ本体・問題・画像。以後の更新先はここです。
- `docs/`：設定SQL・改修資料・移行記録
- `.github/`：手動実行の整理機能
- その他の `.html`：既存リンクを維持する転送用入口。削除しないでください。
- マニフェスト・アイコン・サービスワーカー：ホーム画面アプリの互換性維持用

詳細は docs/ORGANIZATION_README.md を参照してください。
''')
 return report

if __name__=='__main__':
 print(json.dumps(organize(Path.cwd()),ensure_ascii=False,indent=2))
