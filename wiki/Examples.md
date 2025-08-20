# Examples（サンプルと使い方）

## 最小実装（ESM）
```js
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer', { infoBox: true });
const heatbox = new Heatbox(viewer, { voxelSize: 30, opacity: 0.7 });

// 任意のエンティティを追加（例: ランダムポイント）
for (let i = 0; i < 1000; i++) {
  const lon = 139.764 + Math.random() * 0.005;
  const lat = 35.679 + Math.random() * 0.004;
  const alt = Math.random() * 150;
  viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lon, lat, alt), point: { pixelSize: 5 } });
}

await heatbox.createFromEntities(viewer.entities.values);
```

## 表示制御とオプション更新
```js
// 表示/非表示
heatbox.setVisible(false);
heatbox.setVisible(true);

// オプション更新（再描画）
heatbox.updateOptions({ voxelSize: 40, showEmptyVoxels: true });
```

## 統計情報の活用
```js
const s = heatbox.getStatistics();
console.log({
  voxels: s.totalVoxels,
  nonEmpty: s.nonEmptyVoxels,
  entities: s.totalEntities,
  max: s.maxCount,
});
```

## エンティティのフィルタリング
```js
// point エンティティのみ対象にする
const points = Heatbox.filterEntities(viewer.entities.values, e => !!e.point);
await heatbox.createFromEntities(points);
```

## リポジトリ内の実行可能サンプル
- `examples/basic/` ブラウザ UI 付きの基本例（エンティティ生成→ヒートマップ作成）

実行方法:
```
npm install
npm run dev
```
ブラウザが自動起動（通常は `http://localhost:8080`）。
