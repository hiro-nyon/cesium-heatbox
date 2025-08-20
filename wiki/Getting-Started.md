# Getting Started

> **⚠️ 重要**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。

このページでは、ライブラリ利用者向けに最短で使い始めるための手順を説明します。

## インストール

現在npm未登録のため、以下の方法で取得してください：

### GitHubから直接取得
```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

### CDN経由
```html
<script src="https://raw.githubusercontent.com/hiro-nyon/cesium-heatbox/main/dist/cesium-heatbox.umd.min.js"></script>
```

Peer Dependency として Cesium を別途インストールしてください。

## 使い方（基本）
```javascript
import Heatbox from 'cesium-heatbox';

// 1) Cesium Viewer の用意
const viewer = new Cesium.Viewer('cesiumContainer');

// 2) Heatbox を初期化（v0.1.2）
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,         // ボクセル一辺（m）
  opacity: 0.8,          // データボクセル不透明度
  emptyOpacity: 0.03,    // 空ボクセル不透明度
  showOutline: true,     // 枠線表示
  showEmptyVoxels: false,// 空ボクセル描画
  wireframeOnly: false,  // 枠線のみ表示（新機能）
  heightBased: false,    // 高さベース表現（新機能）
  outlineWidth: 1        // 枠線の太さ（新機能）
});

// 3) エンティティからヒートマップ生成（非同期）
const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log('統計', stats);

// 4) 表示切替・クリアなど
heatbox.setVisible(true);
// heatbox.clear();
// heatbox.destroy();
```

## オプション一覧（v0.1.2対応）
- `voxelSize` number（既定: 20）
- `opacity` number 0–1（既定: 0.8）
- `emptyOpacity` number 0–1（既定: 0.03）
- `showOutline` boolean（既定: true）
- `showEmptyVoxels` boolean（既定: false）
- `minColor` [r,g,b]（既定: [0,32,255]）
- `maxColor` [r,g,b]（既定: [255,64,0]）
- `maxRenderVoxels` number（描画上限）
- **`wireframeOnly` boolean（v0.1.2新機能）** - 枠線のみ表示
- **`heightBased` boolean（v0.1.2新機能）** - 密度を高さで表現
- **`outlineWidth` number（v0.1.2新機能）** - 枠線の太さ

更新は `heatbox.updateOptions({ ... })` で反映できます。

## 統計情報
`getStatistics()` で取得できる主な項目:
- `totalVoxels` 総ボクセル数
- `nonEmptyVoxels` データ有りボクセル数
- `emptyVoxels` 空ボクセル数
- `totalEntities` 総エンティティ数
- `minCount` / `maxCount` / `averageCount`

## TypeScript
型定義（`types/index.d.ts`）を同梱しています。ESM 環境でそのまま利用可能です。

## 対応バンドル形式
- ES Modules: `import Heatbox from 'cesium-heatbox'`
- UMD: `<script src=".../cesium-heatbox.umd.min.js"></script>` → `window.CesiumHeatbox`

## 次のステップ
- 基本コードと UI 操作例: [[Examples]]
- 詳細 API: [[API-Reference]]
