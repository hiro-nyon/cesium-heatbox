# Rendering Examples / 描画モードデモ

高さ表現・ワイヤーフレーム・v0.1.12 で追加された描画オプションなど、見た目に関する機能をまとめています。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `wireframe-height-demo-umd.html` | UMD 版。`wireframeOnly` / `heightBased` を組み合わせた視覚比較。 |
| `wireframe-height-demo.js` | モジュール版。複数モードを切り替えるユーティリティクラス。 |
| `v0.1.12-features-demo.html` | v0.1.12 で追加された `outlineRenderMode` / `emulationScope` / `profile` 等をまとめて確認。 |

## Cesium Setup / Cesium 初期化

- すべての HTML ファイルで Ion を無効化 (`Cesium.Ion.defaultAccessToken = null`)。
- ベースマップ: `UrlTemplateImageryProvider`（CartoDB Light など）。
- 地形: `EllipsoidTerrainProvider` を既定で設定。

## Usage / 使い方

- `wireframe-height-demo-umd.html` はダブルクリックでブラウザにドラッグ＆ドロップするだけで動作します。
- モジュール版 (`wireframe-height-demo.js`) を試す場合は簡易サーバーを立て、`<script type="module">` からクラスをインポートしてください。
- `v0.1.12-features-demo.html` では UI から `outlineRenderMode`／`emulationScope`／`profile` を変更し、描画差分を確認できます。

## Tips / ヒント

- エミュレーションモードを試す場合は `enableThickFrames` や `emulationScope` の組み合わせにも注目してください。
- ベースマップを差し替えたい場合は `createImageryProvider` 内の URL を変更し、必ずクレジット表記を保ちます。
