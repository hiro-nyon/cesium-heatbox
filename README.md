# Cesium Heatbox – GitHub Pages

このブランチ（`gh-pages-alpha`）は、デモ/ドキュメント公開サイトのプレビュー環境です。軽量に運用できるよう、静的ファイルのみで構成しています。

## Live
- Site: https://hiro-nyon.github.io/cesium-heatbox/
- Playground: https://hiro-nyon.github.io/cesium-heatbox/playground/
- Quick Start: https://hiro-nyon.github.io/cesium-heatbox/playground/simple.html

現在のデモは Heatbox `1.3.7-alpha.3` を CDN から読み込みます。
- Heatbox CDN: https://unpkg.com/cesium-heatbox@1.3.7-alpha.3/dist/cesium-heatbox.umd.min.js

## 構成（主要ファイル）
- `index.html` … Home（概要・リンク）
- `site.css` … Home のビジュアルシステム
- `playground/index.html` … Playground（全機能）
- `playground/simple.html` … Quick Start（最小構成）
- `playground/latest-features.js` … alpha.3 の classification / temporal / spatial ID / aggregation 設定
- `playground/styles.css` … 既存レイアウトとレスポンシブ動作
- `playground/theme-alpha.css` … alpha.3 のフラットな操作UIテーマ
- `playground/app.js` … Playground ロジック
- `playground/simple-app.js` … Quick Start ロジック
- `assets/quick-start-alpha3.png` … Home に掲載する実画面

## 主要な仕様メモ
- CesiumJS 1.120 を CDN から読込。Cesium Ion は未使用。
- Heatbox は unpkg CDN（`cesium-heatbox@1.3.7-alpha.3`）から読込。


- 背景地図は UrlTemplateImageryProvider（Carto/OSM）。地形は `EllipsoidTerrainProvider`。
- Quick Start:
  - Jenks / Viridis / Auto-fit を固定し、設定項目を増やさない
  - 既定は Wireframe。入力点とボクセルを同時表示する
  - Points / Voxels は個別に表示・非表示を切り替え可能
  - Auto-fit 完了後にボクセルを構築し、初回からカメラ依存の描画選択を安定させる
  - 統計は左 UI に内蔵（モバイルはサイドドロワー UI）
- Playground:
  - alpha.3 の classification / Legend / temporal / spatial ID / aggregation を操作可能
  - Base Map / Voxel / Colors / Outlines / Adaptive / View / Highlight / Advanced も継続提供
  - デスクトップは右統計パネル、モバイル/タブレットはナビのプルダウン内に統計を表示
  - チャコール基調のフラットUI（低彩度、角丸・透過・ブラーを抑制）

## デザイン方針
- 製品の実画面を主役にし、Home には Quick Start の実スクリーンショットを掲載。
- 絵文字、グラデーション文字、浮遊アニメーション、反復するガラスカードを使用しない。
- 熱分布に由来するオレンジを操作・状態のアクセントに限定。
- タイポグラフィ、罫線、余白で情報階層を表現し、装飾を増やさない。

## 運用フロー
- 作業ブランチ: `gh-pages-alpha`
- 公開: `gh-pages`（GitHub Pages の公開元）
- デプロイ手順:
  1. `gh-pages-alpha` に変更を入れる
  2. `gh-pages` にマージ
  3. `git push origin gh-pages`
- 反映には 1–3 分かかることがあります

## ローカルプレビュー（任意）
ローカルで確認する場合は、簡易サーバを使って HTTP 経由でアクセスしてください（file:// 直開きは不可な場合があります）。

例（任意の HTTP サーバで可）:
- Python: `python3 -m http.server 8080`
- Node (serve): `npx serve .`

その後、`http://localhost:8080/` を開きます。

## 注意点
- このリポジトリは GitHub プロジェクトページ配下（`/cesium-heatbox/`）で公開されます。相対パスで動作するよう構成済みです。
- 外部リソースは HTTPS のみ使用。
- CDN のバージョンを変更する場合は、`index.html`、`playground/index.html`、`playground/simple.html`、このREADMEの版番号を同時に更新してください。


問題・要望は Issue にてお知らせください。Thanks!
