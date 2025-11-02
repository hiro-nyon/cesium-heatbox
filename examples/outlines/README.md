# Outline Examples / 枠線デモ

標準枠線・インセット枠線・エミュレーション（擬似太線）など、枠線表現に特化したサンプルです。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `outline-overlap-demo-umd.html` | `voxelGap` / `outlineOpacity` / 適応枠線プリセットの比較デモ。ブラウザで直接実行可能。 |
| `emulation-scope-demo.html` *(new)* | `outlineRenderMode` と `emulationScope` の組み合わせ比較（TopN/Non-TopN/All）。 |

## Cesium Setup / Cesium 初期化

- Ion を使わず、`Cesium.Ion.defaultAccessToken = null` を宣言。
- CartoDB Light（OSM）を `UrlTemplateImageryProvider` で設定。
- `EllipsoidTerrainProvider` を既定の地形プロバイダーとします。

## Usage / 使い方

- `outline-overlap-demo-umd.html` はブラウザで直接実行できます。
- `emulation-scope-demo.html` も UMD 版として実装されているため、同様にローカルで開くだけで比較が可能です。
- UI から `outlineRenderMode` や `emulationScope` を切り替え、密度や TopN ハイライトとの相互作用を観察してください。

## Notes / 補足

- エミュレーションスコープを `non-topn` や `topn` にすると、`highlightTopN` の設定値が重要になります。必要に応じて `.js` 内の初期値を調整してください。
- Ion トークンがある場合でも既定では Ellipsoid 地形を使用しているため、`createWorldTerrain()` を利用する場合はトークン設定とフォールバック処理を忘れずに実装してください。
