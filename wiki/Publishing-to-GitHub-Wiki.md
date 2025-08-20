# GitHub Wiki への公開手順

このディレクトリ（`wiki/`）の Markdown を GitHub Wiki に反映する手順です。

## 1) リポジトリ URL を確認
- 例: `https://github.com/<owner>/<repo>`
- Wiki リポジトリ URL は `https://github.com/<owner>/<repo>.wiki.git`

## 2) スクリプトで公開（推奨）
```
# 例: オーナー=hiro-nyon, リポジトリ=cesium-heatbox の場合
bash tools/wiki/publish-wiki.sh hiro-nyon cesium-heatbox
```

## 3) 手動で公開（代替）
```
# Wiki リポジトリをクローン
git clone https://github.com/<owner>/<repo>.wiki.git
cd <repo>.wiki

# ローカルの wiki ページをコピー
cp -f ../wiki/*.md .

# 反映
git add .
git commit -m "docs(wiki): update pages"
git push origin master
```

> 補足: 企業組織や 2FA 環境では HTTPS ではなく SSH を使う運用も可能です。
