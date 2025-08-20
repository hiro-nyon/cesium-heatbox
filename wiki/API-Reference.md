# API リファレンス（概要）

詳細な JSDoc は `docs/api/` を参照してください（リポジトリ同梱）。ここでは主な公開 API を概説します。

## クラス: `Heatbox`

### コンストラクタ
```js
new Heatbox(viewer, options?)
```
- `viewer`: `Cesium.Viewer`
- `options`: `HeatboxOptions`

#### HeatboxOptions
- `voxelSize?: number` デフォルト 20（m）
- `opacity?: number` 0–1, デフォルト 0.8
- `emptyOpacity?: number` 0–1, デフォルト 0.03
- `showOutline?: boolean` デフォルト true
- `showEmptyVoxels?: boolean` デフォルト false
- `minColor?: [number,number,number]` デフォルト [0,32,255]
- `maxColor?: [number,number,number]` デフォルト [255,64,0]
- `maxRenderVoxels?: number` 描画上限（密度上位 N のみ描画）
- `batchMode?: 'auto'|'primitive'|'entity'`

### 主要メソッド
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

### 静的メソッド
- `Heatbox.filterEntities(entities, predicate): Cesium.Entity[]`

### HeatboxStatistics
```ts
interface HeatboxStatistics {
  totalVoxels: number;
  nonEmptyVoxels: number;
  emptyVoxels: number;
  totalEntities: number;
  minCount: number;
  maxCount: number;
  averageCount: number;
}
```

## 名前付きエクスポート
```js
import Heatbox, { createHeatbox, getAllEntities, generateTestEntities } from 'cesium-heatbox';
```
- `createHeatbox(viewer, options) => Heatbox`
- `getAllEntities(viewer) => Cesium.Entity[]`
- `generateTestEntities(viewer, bounds, count?) => Cesium.Entity[]`
- `getEnvironmentInfo() => { version, cesiumVersion, userAgent, webglSupport, timestamp }`
- `VERSION`, `AUTHOR`, `REPOSITORY`

## 使用上の注意
- ボクセル総数が多すぎる場合は自動でボクセルサイズを拡大して再試行します。
- `maxRenderVoxels` を設定すると、密度上位 N のみ描画されます（統計には全体が反映）。
