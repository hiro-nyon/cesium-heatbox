# Cesium Heatbox – GitHub Pages

このブランチ（`gh-pages`）はデモ/ドキュメント用の公開サイトです。軽量に運用できるよう、静的ファイルのみで構成しています。

## Live
- Site: https://hiro-nyon.github.io/cesium-heatbox/
- Playground: https://hiro-nyon.github.io/cesium-heatbox/playground/
- Quick Start: https://hiro-nyon.github.io/cesium-heatbox/playground/simple.html

現在のデモは Heatbox を CDN から読み込みます。
- Heatbox CDN: https://unpkg.com/cesium-heatbox@0.1.11-alpha.1/dist/cesium-heatbox.umd.min.js

## 構成（主要ファイル）
- `index.html` … Home（概要・リンク）
- `playground/index.html` … Playground（全機能）
- `playground/simple.html` … Quick Start（最小構成）
- `playground/styles.css` … Liquid Glass UI / レイアウト
- `playground/app.js` … Playground ロジック
- `playground/simple-app.js` … Quick Start ロジック
- Heatbox ライブラリは CDN（unpkg）から読込（`0.1.11-alpha.1`）

## 主要な仕様メモ
- CesiumJS 1.120 を CDN から読込。Cesium Ion は未使用。
- Heatbox は unpkg CDN（`cesium-heatbox@0.1.11-alpha.1`）から読込。
- 背景地図は UrlTemplateImageryProvider（Carto/OSM）。地形は `EllipsoidTerrainProvider`。
- Quick Start:
  - 極力シンプル（CartoDB Light 固定、Auto voxel sizing）
  - 既定: 密度ベースのボックス不透明度で“読みやすさ”を示す
  - ワイヤーフレーム: ボックス非表示 + 太めの枠線（密度による透明度は使わない）
  - 統計は左 UI に内蔵（モバイルはボトムシート UI）
- Playground:
  - セクション整理（Base Map / Voxel / Colors / Outlines / Adaptive / View / Highlight / Advanced）
  - デスクトップは右統計パネル、モバイル/タブレットはナビのプルダウン内に統計を表示
  - Liquid Glass UI（薄いガラス感、モバイル最適化、スクロールバー非表示）

## 運用フロー
- 作業ブランチ: `gh-pages-alpha`
- 公開: `gh-pages`（GitHub Pages の公開元）
- デプロイ手順:
  1. `gh-pages-alpha` に変更を入れる
  2. `gh-pages` にマージ（この README は `gh-pages` に pull される前提で記述）
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
- CDN のバージョンを変更する場合は、`playground/index.html` と `playground/simple.html` の Heatbox `<script>` を更新してください。

問題・要望は Issue にてお知らせください。Thanks!
