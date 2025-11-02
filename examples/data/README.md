# Data Examples / データ処理デモ

エンティティフィルタリングやデータセット前処理に関するサンプルをまとめています。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `entity-filtering.js` | 属性／高度／範囲フィルタなどを備えたユーティリティ。Heatbox の前処理で利用可能。 |

## Cesium Setup / Cesium 初期化

- このカテゴリには HTML デモは含まれていませんが、各自で Cesium Viewer を初期化する際は Ion 無効化＋OSM/Carto＋EllipsoidTerrain を推奨します。

## Usage / 使い方

```javascript
import { EntityFilters } from '../data/entity-filtering.js';

// 点要素のみ抽出
const points = EntityFilters.pointsOnly(viewer.entities.values);

// 高度レンジでフィルタ
const highAltitude = EntityFilters.byAltitudeRange(100, 1000)(viewer.entities.values);
```

## Notes / 補足

- `EntityFilters` は関数型スタイルで構成されており、複数のフィルタを合成することができます。
- Cesium の座標取得 (`position.getValue`) のフォールバック処理を含んでいるため、モック環境でも利用しやすい設計です。
