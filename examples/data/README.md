# Data Examples / データ処理デモ

エンティティフィルタリングやデータセット前処理に関するサンプルをまとめています。

## Included Samples / 含まれるサンプル

| File | 概要 |
| --- | --- |
| `entity-filtering.js` | 属性／高度／範囲フィルタなどを備えたユーティリティ。Heatbox の前処理で利用可能。 |

## Cesium Setup / Cesium 初期化

- このカテゴリには HTML デモは含まれていませんが、各自で Cesium Viewer を初期化する際は Ion 無効化＋OSM/Carto＋EllipsoidTerrain を推奨します。
- `examples/advanced/classification-demo.html` などの上級例にデータユーティリティを組み込む場合も、同じ初期化手順を使えば OK です（`common/camera.js` を読み込めば一貫したビュー制御が得られます）。

## Usage / 使い方

```javascript
import { EntityFilters } from '../data/entity-filtering.js';

// 点要素のみ抽出
const points = EntityFilters.pointsOnly(viewer.entities.values);

// 高度レンジでフィルタ
const highAltitude = EntityFilters.byAltitudeRange(100, 1000)(viewer.entities.values);
```

### Feeding the Classification Demo / 分類デモへの流し込み例

```javascript
import { EntityFilters } from '../data/entity-filtering.js';
import Heatbox from '../../src/index.js';

// Shinjuku bounds でデータを整形し、分類エンジンに投入
const shinjukuEntities = Heatbox.filterEntities(
  viewer.entities.values,
  EntityFilters.byGeographicBounds(139.68, 139.705, 35.68, 35.70)
);

await heatbox.createFromEntities(shinjukuEntities);
heatbox.updateOptions({
  classification: {
    enabled: true,
    scheme: 'quantize',
    classes: 5,
    colorMap: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
  }
});
```

`classification` オプションを組み合わせれば、Heatbox 本体と同じ統計 (`HeatboxStatistics.classification`) をデータ前処理フェーズから確認できます。

## Notes / 補足

- `EntityFilters` は関数型スタイルで構成されており、複数のフィルタを合成することができます。
- Cesium の座標取得 (`position.getValue`) のフォールバック処理を含んでいるため、モック環境でも利用しやすい設計です。
- 将来的に `data/` 配下へ JSON/GeoJSON などの軽量データセットを追加し、`npm run dev` でホストした API からダウンロードして分類デモに直接読み込めるよう拡張予定です（ADR-0016 Phase 5 参照）。
