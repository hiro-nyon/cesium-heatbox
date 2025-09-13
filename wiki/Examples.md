# Examples（使用例） / Examples

**日本語** | [English](#english)

## 日本語

### 最小実装（ESM）
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

### 表示制御とオプション更新
```js
// 表示/非表示
heatbox.setVisible(false);
heatbox.setVisible(true);

// オプション更新（再描画）
heatbox.updateOptions({ voxelSize: 40, showEmptyVoxels: true });
```

### 統計情報の活用
```js
const s = heatbox.getStatistics();
console.log({
  voxels: s.totalVoxels,
  nonEmpty: s.nonEmptyVoxels,
  entities: s.totalEntities,
  max: s.maxCount,
});
```

### エンティティのフィルタリング
```js
// point エンティティのみ対象にする
const points = Heatbox.filterEntities(viewer.entities.values, e => !!e.point);
await heatbox.createFromEntities(points);
```

### v0.1.2 新機能の活用

#### 枠線のみ表示（視認性改善）
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

#### 高さベース密度表現
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

#### 組み合わせ使用
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

### v0.1.6 枠線制御（一律/TopN/可変）

#### 一律で太く（視認性重視）
```js
const heatbox = new Heatbox(viewer, {
  showOutline: true,
  outlineWidth: 3,        // 全て同じ太さ
  outlineOpacity: 0.7     // 重なりのノイズを抑える
});
```

#### TopNだけを太く（簡易強調）
```js
const heatbox = new Heatbox(viewer, {
  outlineWidth: 2,        // 非TopNの既定値
  highlightTopN: 10,
  highlightStyle: { outlineWidth: 6 } // TopNのみ太く
});
```

#### 密度に応じて可変（動的制御）
```js
const heatbox = new Heatbox(viewer, {
  outlineWidth: 2, // 既定（resolver未適用時）
  outlineWidthResolver: ({ normalizedDensity, isTopN }) => {
    if (isTopN) return 4;              // TopNは太く
    return normalizedDensity > 0.7 ? 1 // 高密度は細く
         : normalizedDensity > 0.3 ? 2 // 中密度は標準
         : 3;                          // 低密度は太く
  },
  voxelGap: 1.0,        // 重なり軽減（寸法縮小）
  outlineOpacity: 0.6   // 重なりノイズ低減
});
```

### v0.1.12 エミュレーション専用（太線のみ）と密度連動
```js
const heatbox = new Heatbox(viewer, {
  // エミュレーション専用モード: 標準枠線/インセットを使わずエッジで太線を表現
  outlineRenderMode: 'emulation-only',
  showOutline: false,
  opacity: 0.0,
  // 密度が高いほど “太く/濃く”
  outlineWidthResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    const minW = 1.5, maxW = 10;
    return minW + nd * (maxW - minW);
  },
  outlineOpacityResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    return Math.max(0.15, Math.min(1.0, 0.15 + nd * 0.85));
  }
});
```

優先順位:
- 1) `outlineWidthResolver` が定義されていれば最優先
- 2) なければ `highlightTopN` の TopN に `highlightStyle.outlineWidth`、以外は `outlineWidth`
- 3) いずれも未設定なら `outlineWidth` を全ボクセルに適用

### v0.1.6.1 インセット枠線（内側オフセット）
```js
const heatbox = new Heatbox(viewer, {
  outlineInset: 2.0,         // 枠線を内側に 2m オフセット
  outlineInsetMode: 'topn',  // TopN のみに適用（'all' で全体）
  highlightTopN: 20,
  outlineOpacity: 0.8,
  voxelGap: 1.0              // わずかなギャップで視認性を補助
});

await heatbox.createFromEntities(viewer.entities.values);
```
注意:
- インセットは片側最大 20%（両側合計 40%）にクランプされ、最終寸法は元の 60%以上が保証されます。
- 塗り (`opacity`) が 1.0 だと内側線は見えにくくなるため、0.6〜0.9 程度を推奨。`wireframeOnly: true` なら最も視認性が高いです。
 - 塗り (`opacity`) が 1.0 だと内側線は見えにくくなるため、0.6〜0.9 程度を推奨。`wireframeOnly: true` なら最も視認性が高いです。

### v0.1.12+ 太線エミュレーション（重なりに強い強調表示）
```js
const heatbox = new Heatbox(viewer, {
  // TopN のみ太線をポリラインで重ねる（標準モードに部分エミュを重ねる）
  outlineRenderMode: 'standard',
  emulationScope: 'topn',
  highlightTopN: 20,
  outlineWidth: 4,
  // 併用: インセットがあれば中間位置に太線を描いて隣接との重なりを軽減
  outlineInset: 2.0,
  outlineInsetMode: 'all',
  outlineOpacity: 0.8,
  voxelGap: 0.5
});
```
注:
- 太線は外縁とインセットの“中間位置”に配置され、隣接枠線と被りにくい設計です。
- `outlineInset` 未指定時は各軸5%の自動インセット、指定時は片側20%上限でクランプされます。

### リポジトリ内の実行可能サンプル
- `examples/basic/` ブラウザ UI 付きの基本例（エンティティ生成→ヒートマップ作成）
 - `examples/advanced/outline-overlap-demo-umd.html` 0.1.6 の枠線重なり対策デモ（ブラウザで直接開けます）

実行方法:
```
npm install
npm run dev
```
ブラウザが自動起動（通常は `http://localhost:8080`）。

## English

### Minimal Implementation (ESM)
```js
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer', { infoBox: true });
const heatbox = new Heatbox(viewer, { 
  voxelSize: 30, 
  opacity: 0.7,
  // v0.1.2 new features
  wireframeOnly: true,  // wireframe-only display for improved visibility
  heightBased: false    // height-based representation
});

// Add arbitrary entities (example: random points)
for (let i = 0; i < 1000; i++) {
  const lon = 139.764 + Math.random() * 0.005;
  const lat = 35.679 + Math.random() * 0.004;
  const alt = Math.random() * 150;
  viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lon, lat, alt), point: { pixelSize: 5 } });
}

await heatbox.createFromEntities(viewer.entities.values);
```

### Display Control and Option Updates
```js
// Toggle visibility
heatbox.setVisible(false);
heatbox.setVisible(true);

// Update options and re-render
heatbox.updateOptions({ voxelSize: 50, opacity: 0.9, wireframeOnly: false });

// Clear all
heatbox.clear();
```

### Utilizing Statistical Information
```js
const stats = heatbox.getStatistics();
if (stats) {
  console.log(`Total voxels: ${stats.totalVoxels}`);
  console.log(`Non-empty voxels: ${stats.nonEmptyVoxels}`);
  console.log(`Density range: ${stats.minCount} - ${stats.maxCount}`);
}
```

### Entity Filtering
```js
const filteredEntities = Heatbox.filterEntities(viewer.entities.values, entity => {
  const pos = entity.position?.getValue(Cesium.JulianDate.now());
  return pos && Cesium.Cartographic.fromCartesian(pos).height > 100;
});
await heatbox.createFromEntities(filteredEntities);
```

### v0.1.2 New Feature Usage

#### Wireframe-only Display (Improved Visibility)
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 25,
  wireframeOnly: true,    // Show only outlines
  outlineWidth: 2,        // Outline thickness
  showOutline: true
});
```

#### Height-based Density Representation
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  heightBased: true,      // Height represents density
  opacity: 0.6
});
```

#### Combined Usage
```js
const heatbox = new Heatbox(viewer, {
  voxelSize: 30,
  wireframeOnly: true,    // Wireframe-only
  heightBased: true,      // Height-based
  outlineWidth: 3,        // Thick outlines
  maxRenderVoxels: 200    // Limit display count
});
```

### Executable Examples in Repository
- `examples/basic/` Basic example with browser UI (entity generation → heatmap creation)

How to run:
```
npm install
npm run dev
```
Browser auto-launches (usually `http://localhost:8080`).
