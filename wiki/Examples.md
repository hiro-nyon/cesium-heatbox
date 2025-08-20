# Examples（サンプルと使い方）

> **⚠️ 注意**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。

## 最小実装（ESM）
```js
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer', { infoBox: true });
const heatbox = new Heatbox(viewer, { 
  voxelSize: 30, 
  opacity: 0.7,
  // v0.1.2 新機能
  wireframeOnly: true,  // 枠線のみ表示で視認性向上
  heightBased: false    // 高さベース表現
});

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

## v0.1.2 新機能の活用

### 枠線のみ表示（視認性改善）
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 25,
  wireframeOnly: true,    // ボックス本体を透明に
  showOutline: true,      // 枠線を表示
  outlineWidth: 2         // 枠線の太さ
});

// 重なったボクセルでも内部構造が見やすくなります
await heatbox.createFromEntities(entities);
```

### 高さベース密度表現
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 30,
  heightBased: true,      // 密度に応じて高さを調整
  wireframeOnly: false,   // 通常の塗りつぶし表示
  opacity: 0.8
});

// 密度が高い場所ほど高いボクセルが表示されます
await heatbox.createFromEntities(entities);
```

### 組み合わせ使用
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  wireframeOnly: true,    // 枠線のみ
  heightBased: true,      // 高さベース
  outlineWidth: 3,        // 太い枠線
  showEmptyVoxels: false  // 空ボクセル非表示
});

// 最も視認性が良い設定
await heatbox.createFromEntities(entities);
```

## リポジトリ内の実行可能サンプル
- `examples/basic/` ブラウザ UI 付きの基本例（エンティティ生成→ヒートマップ作成）

実行方法:
```
npm install
npm run dev
```
ブラウザが自動起動（通常は `http://localhost:8080`）。
