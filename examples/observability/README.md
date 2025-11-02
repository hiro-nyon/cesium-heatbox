# Observability Examples / 観測可能性デモ

このカテゴリでは、パフォーマンスオーバーレイや適応制御メトリクスなど、モニタリング関連の機能を体験できます。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `performance-overlay-demo.html` | パフォーマンスオーバーレイの表示とベンチマーク実行。プロファイル別の比較が可能。 |
| `adaptive-phase3-demo.html` | ADR-0011 Phase 3 の適応制御デモ。密度検出・重なり検知・拡張オーバーレイを搭載。 |

## Cesium Setup / Cesium 初期化

- Cesium 1.120（CDN）を読み込み、`Cesium.Ion.defaultAccessToken = null` を明示。
- ベースマップは CartoDB Light（OSM）を既定とし、`UrlTemplateImageryProvider` で設定。
- 地形は `new Cesium.EllipsoidTerrainProvider()` を使用。Ion トークンがある場合のみ `Cesium.createWorldTerrain()` に切り替え可能。

## How to Run / 実行方法

1. `npm install` 済みのリポジトリで `npx http-server examples/observability` を実行するか、任意の静的サーバーで公開します。
2. ブラウザで `performance-overlay-demo.html` または `adaptive-phase3-demo.html` にアクセスします。
3. UI からプロファイル変更、ボクセル数調整、オーバーレイの表示切替などを行い、ログはブラウザコンソールで確認できます。

## Notes / 補足

- Ion トークンを設定していない場合、ベースマップが読み込めないと黒画面になるため、必ず既定の OSM/Carto 設定を残してください。
- オーバーレイは `performanceOverlay.enabled` を `true` にして初期化しています。不要な場合は UI から非表示にした上で `Heatbox` オプションを調整してください。
