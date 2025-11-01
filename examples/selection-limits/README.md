# Selection & Limits Examples / 選択戦略・描画上限デモ

描画対象の選別（density / coverage / hybrid）やレンダリング上限の調整、パフォーマンス最適化に関するサンプル群です。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `adaptive-rendering-demo.html` + `adaptive-rendering-demo.js` | v0.1.9 の適応的レンダリング制限。戦略切替・レンダリング上限・自動ボクセルサイズをUIで体験。 |
| `performance-optimization.js` | 段階的ロード・品質調整・メモリ計測などパフォーマンス最適化のユーティリティ。 |
| `selection-strategy-demo.html` *(new)* | density / coverage / hybrid を並列比較する UMD デモ。 |

## Cesium Setup / Cesium 初期化

- Ion は既定で無効 (`Cesium.Ion.defaultAccessToken = null`)。
- CartoDB Light（OSM）によるベースマップ、`EllipsoidTerrainProvider` による地形を使用。
- Ion トークンを設定した場合も、トークン未設定時には自動で OSM/エリプソイドにフォールバックするよう実装しています。

## Usage / 使い方

1. `npm install` 後に `npx http-server examples/selection-limits` を実行するか、任意の静的サーバーで公開します。
2. ブラウザで `adaptive-rendering-demo.html` などにアクセスし、UI から戦略や描画上限を変更します。
3. `performance-optimization.js` を利用する場合はアプリ側でインポートし、`new PerformanceOptimizationDemo(viewer)` を呼び出してください。

## Tips / ヒント

- `adaptive-rendering-demo.js` 内の `generateSampleData` を差し替えることで独自データでの試験が可能です。
- Auto Render Budget の挙動を確認する際はブラウザ開発者ツールでログ (`console.log`) を参照してください。
