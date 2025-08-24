# API リファレンス（概要） / API Reference (Overview) - v0.1.4

> **⚠️ 注意 / Important**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。  
> This library is currently not registered on npm. Please refer to [Quick-Start](Quick-Start.md) to get it from GitHub.

**日本語** | [English](#english)

詳細な JSDoc は `docs/api/` を参照してください（リポジトリ同梱）。ここでは主な公開 API を概説します。

## English

For detailed JSDoc, see `docs/api/` (bundled with repository). This section outlines the main public APIs.

## クラス: `Heatbox` / Class: `Heatbox`

### 日本語

#### コンストラクタ
```js
new Heatbox(viewer, options?)
```
- `viewer`: `Cesium.Viewer`
- `options`: `HeatboxOptions`

### English

#### Constructor
```js
new Heatbox(viewer, options?)
```
- `viewer`: `Cesium.Viewer`
- `options`: `HeatboxOptions`

### 日本語

#### HeatboxOptions
- `voxelSize?: number` デフォルト 20（m） 目標セルサイズ。実際の描画寸法は各軸の実セルサイズ `cellSizeX/Y/Z`（グリッド分割により `voxelSize` 以下になる場合あり）を用います。
- `opacity?: number` 0–1, デフォルト 0.8
- `emptyOpacity?: number` 0–1, デフォルト 0.03
- `showOutline?: boolean` デフォルト true
- `showEmptyVoxels?: boolean` デフォルト false
- `minColor?: [number,number,number]` デフォルト [0,32,255]
- `maxColor?: [number,number,number]` デフォルト [255,64,0]
- `maxRenderVoxels?: number` 描画上限（密度上位 N のみ描画）
- `wireframeOnly?: boolean` **v0.1.2新機能** 枠線のみ表示（視認性向上）
- `heightBased?: boolean` **v0.1.2新機能** 高さベース密度表現
- `outlineWidth?: number` **v0.1.2新機能** 枠線の太さ（デフォルト 2）
- `debug?: boolean` **v0.1.3新機能** ログ制御（デフォルト false）
- `autoVoxelSize?: boolean` **v0.1.4新機能** `voxelSize` 未指定時に自動決定

> 注: v0.1.1からレンダリング実装がEntityベースに変更されました。`maxRenderVoxels`の適切な値は300前後を推奨します。  
> v0.1.2では視認性改善のため`wireframeOnly`オプションを追加しました。重なったボクセルが見やすくなります。

### English

#### HeatboxOptions
- `voxelSize?: number` Default 20 (m) Target cell size. Actual rendered size uses per-axis cell sizes `cellSizeX/Y/Z` computed from the grid (may be slightly smaller than `voxelSize`).
- `opacity?: number` 0–1, Default 0.8
- `emptyOpacity?: number` 0–1, Default 0.03
- `showOutline?: boolean` Default true
- `showEmptyVoxels?: boolean` Default false
- `minColor?: [number,number,number]` Default [0,32,255]
- `maxColor?: [number,number,number]` Default [255,64,0]
- `maxRenderVoxels?: number` Render limit (only top N by density)
- `wireframeOnly?: boolean` **v0.1.2 New Feature** Show only wireframes (improved visibility)
- `heightBased?: boolean` **v0.1.2 New Feature** Height-based density representation
- `outlineWidth?: number` **v0.1.2 New Feature** Outline thickness (Default 2)
- `debug?: boolean` **v0.1.3 New Feature** Log control (Default false)
- `autoVoxelSize?: boolean` **v0.1.4 New Feature** Auto determine voxel size when `voxelSize` is omitted

> Note: Rendering implementation changed to Entity-based from v0.1.1. Recommended `maxRenderVoxels` value is around 300.  
> v0.1.2 added `wireframeOnly` option for improved visibility of overlapping voxels.

### 日本語

#### 主要メソッド
- `async createFromEntities(entities: Cesium.Entity[]): Promise<HeatboxStatistics>`
  - エンティティ配列からヒートマップ作成（非同期）
- `setData(entities: Cesium.Entity[]): void`
  - 同期 API。内部で境界計算→グリッド生成→分類→描画
- `updateOptions(newOptions: HeatboxOptions): void`
  - オプションを更新し再描画
- `setVisible(show: boolean): void`
  - 描画の表示/非表示切替
- `clear(): void`
  - 描画と内部状態をクリア
- `destroy(): void`
  - イベントやリソース解放
- `getOptions(): HeatboxOptions`
- `getStatistics(): HeatboxStatistics | null`
- `getBounds(): object | null`
- `getDebugInfo(): { options,bounds,grid,statistics }`

### English

#### Main Methods
- `async createFromEntities(entities: Cesium.Entity[]): Promise<HeatboxStatistics>`
  - Create heatmap from entity array (asynchronous)
- `setData(entities: Cesium.Entity[]): void`
  - Synchronous API. Internally: boundary calculation → grid generation → classification → rendering
- `updateOptions(newOptions: HeatboxOptions): void`
  - Update options and re-render
- `setVisible(show: boolean): void`
  - Toggle rendering visibility
- `clear(): void`
  - Clear rendering and internal state
- `destroy(): void`
  - Release events and resources
- `getOptions(): HeatboxOptions`
- `getStatistics(): HeatboxStatistics | null`
- `getBounds(): object | null`
- `getDebugInfo(): { options,bounds,grid,statistics }`

### 日本語

#### 静的メソッド
- `Heatbox.filterEntities(entities, predicate): Cesium.Entity[]`

#### HeatboxStatistics
```ts
interface HeatboxStatistics {
  totalVoxels: number;
  renderedVoxels: number;      // v0.1.3 追加: 実際に描画されたボクセル数
  nonEmptyVoxels: number;
  emptyVoxels: number;
  totalEntities: number;
  minCount: number;
  maxCount: number;
  averageCount: number;
  // v0.1.4 自動調整情報
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
}
```

### English

#### Static Methods
- `Heatbox.filterEntities(entities, predicate): Cesium.Entity[]`

#### HeatboxStatistics
```ts
interface HeatboxStatistics {
  totalVoxels: number;
  renderedVoxels: number;      // v0.1.3 added: Actually rendered voxel count
  nonEmptyVoxels: number;
  emptyVoxels: number;
  totalEntities: number;
  minCount: number;
  maxCount: number;
  averageCount: number;
  // v0.1.4 auto adjustment info
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
}
```

## 名前付きエクスポート / Named Exports

### 日本語
```js
import Heatbox, { createHeatbox, getAllEntities, generateTestEntities } from 'cesium-heatbox';
```
- `createHeatbox(viewer, options) => Heatbox`
- `getAllEntities(viewer) => Cesium.Entity[]`
- `generateTestEntities(viewer, bounds, count?) => Cesium.Entity[]`
- `getEnvironmentInfo() => { version, cesiumVersion, userAgent, webglSupport, timestamp }`
- `VERSION`, `AUTHOR`, `REPOSITORY`

### English
```js
import Heatbox, { createHeatbox, getAllEntities, generateTestEntities } from 'cesium-heatbox';
```
- `createHeatbox(viewer, options) => Heatbox`
- `getAllEntities(viewer) => Cesium.Entity[]`
- `generateTestEntities(viewer, bounds, count?) => Cesium.Entity[]`
- `getEnvironmentInfo() => { version, cesiumVersion, userAgent, webglSupport, timestamp }`
- `VERSION`, `AUTHOR`, `REPOSITORY`

## 使用上の注意 / Usage Notes

### 日本語
- v0.1.4 から `autoVoxelSize: true` でボクセルサイズの自動決定が利用可能です。`voxelSize` を省略すると、密度と範囲から推定し、内部上限を超える場合は自動調整します。
- `maxRenderVoxels` を設定すると、密度上位 N のみ描画されます（統計には全体が反映）。

### English
- From v0.1.4, enable `autoVoxelSize: true` to auto determine voxel size when `voxelSize` is omitted. The size is estimated from density and range, and adjusted to keep within internal limits.
- Setting `maxRenderVoxels` renders only top N by density (statistics reflect the whole dataset).
