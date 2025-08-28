# GitHub Wiki への公開手順 / Publishing Guide

日本語 | English

日本語: このディレクトリ（`wiki/`）の Markdown を GitHub Wiki に反映する手順です。  
English: How to publish the Markdown files in `wiki/` to GitHub Wiki.

## 1) リポジトリ URL を確認 / Check repository URL
- 例 / Example: `https://github.com/<owner>/<repo>`
- Wiki リポジトリ URL / Wiki repo: `https://github.com/<owner>/<repo>.wiki.git`

## 2) スクリプトで公開（推奨） / Publish via script (recommended)
```
# 例: オーナー=hiro-nyon, リポジトリ=cesium-heatbox の場合
bash tools/wiki/publish-wiki.sh hiro-nyon cesium-heatbox
```

## 3) 手動で公開（代替） / Publish manually (alternative)
```
# Wiki リポジトリをクローン / Clone wiki repository
git clone https://github.com/<owner>/<repo>.wiki.git
cd <repo>.wiki

# ローカルの wiki ページをコピー / Copy local wiki pages
cp -f ../wiki/*.md .

# 反映 / Commit & push
git add .
git commit -m "docs(wiki): update pages"
git push origin master
```

補足 / Note: 企業組織や 2FA 環境では HTTPS ではなく SSH を使う運用も可能です。  
You may use SSH instead of HTTPS in organizational/2FA environments.
