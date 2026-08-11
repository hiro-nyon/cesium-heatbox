# Cesium Heatbox Playground 1.3.7

`gh-pages-alpha` 用の安定版ブラウザーデモです。CesiumJS 1.120 と `cesium-heatbox@1.3.7` を CDN から読み込み、Cesium ion token なしで動作します。

## 画面

- `simple.html` — Quick Start。Jenks / Viridis / Auto-fit 固定、Solid が既定です。Jenks を色と透明度へ適用し、入力点とボクセルの表示を個別に切り替えられます。
- `index.html` — Full Playground。1.3.7 の主要機能を比較・検証するための画面です。

## 1.3.7 対応

Full Playground では次の機能を操作できます。

- Classification: linear / log / equal interval / quantize / threshold / quantile / Jenks
- Legend と classification target（color / opacity / width）
- Temporal demo と global / per-time classification
- Spatial ID（auto / zoom level）
- Layer aggregation（clusterId / category / type）
- Adaptive rendering、render budget、profile、performance overlay

`latest-features.js` が 1.3.7 のオプション生成、Temporal demo、Legend、統計表示を担当します。

## Quick Start の方針

Quick Start は初見で結果と入力データの関係が分かることを優先します。

- ページ読み込み時にサンプルを自動生成
- 入力点へのAuto-fit完了後にボクセルを構築
- Jenks 5クラス + Viridis を固定
- Solid を既定にして、Jenks を色と透明度へ適用
- 入力点も同時表示し、Wireframeへ切り替え可能
- 操作はファイル読込、Solid / Wireframe、Points / Voxels に限定

## ローカル確認

プロジェクトルートで静的サーバーを起動してください。

```bash
python3 -m http.server 4173
```

- Quick Start: `http://localhost:4173/playground/simple.html`
- Full Playground: `http://localhost:4173/playground/`

`file://` 直開きは使用しません。背景地図は Carto Light / OpenStreetMap を利用します。
