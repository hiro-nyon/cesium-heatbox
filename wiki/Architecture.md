# Architecture（設計） / Architecture

**日本語** | [English](#english)

本ライブラリは 4 つの中核コンポーネントで構成されています（v0.1.7で適応的制御を強化）。

## 日本語

### コンポーネント
- `CoordinateTransformer` **（v0.1.2: シンプル化）**
  - エンティティからの位置取得、境界計算、ボクセル座標への変換を担当。
  - 複雑なメソッドを削除し、直接的なアプローチに変更。
- `VoxelGrid` **（v0.1.2: 軽量化）**
  - 範囲とボクセルサイズからグリッドを生成、インデックス/キー計算を提供。
  - 隣接ボクセル取得等の高度な機能を削除。
- `DataProcessor` **（v0.1.2: 堅牢化）**
  - エンティティをボクセルへ分類、統計値（min/max/avg 等）を算出。
  - エラーハンドリングを強化し、安全なエンティティ処理を実装。
- `VoxelRenderer` **（v0.1.2: Entity ベース）**
  - Cesium Entity を用いてボクセルを描画（Primitiveから変更）。
  - wireframeOnly・heightBased等の新機能を追加。

### 処理フロー（v0.1.2）
1. **境界計算**: `CoordinateTransformer.calculateBounds(entities)` - 直接的な座標範囲計算
2. **グリッド生成**: `VoxelGrid.createGrid(bounds, voxelSize)` - シンプルなグリッド作成
3. **分類/集計**: `DataProcessor.classifyEntitiesIntoVoxels(...)` - 安全なエンティティ処理
4. **統計算出**: `DataProcessor.calculateStatistics(...)` - 基本統計の計算
5. **描画**: `VoxelRenderer.render(...)` - Entity ベースの描画

### v0.1.7 の特徴
- **適応的枠線制御**: 近傍密度・カメラ距離・重なりリスクに応じた自動調整
- **表示モード拡張**: standard/inset/emulation-only の描画方式切替
- **透明度resolver**: カスタム透明度制御機能
- **インセット枠線**: 内側オフセット表示による視認性向上（v0.1.6.1）
- **エラーハンドリング**: 堅牢なエンティティ処理とresolver例外処理

### v0.1.7 新機能オプション
```javascript
const heatbox = new Heatbox(viewer, {
  // 適応的枠線制御
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density',
  // 表示モード
  outlineRenderMode: 'emulation-only',
  // 透明度resolver
  boxOpacityResolver: ({ isTopN, normalizedDensity }) => 
    isTopN ? 1.0 : Math.max(0.3, 0.3 + 0.7 * normalizedDensity),
  // インセット枠線
  outlineInset: 2.0,
  outlineInsetMode: 'all'
});
```

### 拡張の余地
- npm パッケージ化
- リアルタイム更新最適化
- カスタムカラーマップ
- データソース選択機能

## English

This library consists of 4 core components (enhanced with adaptive control in v0.1.7).

### Components
- `CoordinateTransformer` **(v0.1.2: Simplified)**
  - Handles position retrieval from entities, boundary calculation, and conversion to voxel coordinates.
  - Removed complex methods and changed to direct approach.
- `VoxelGrid` **(v0.1.2: Lightweight)**
  - Generates grids from ranges and voxel sizes, provides index/key calculations.
  - Removed advanced features like neighbor voxel retrieval.
- `DataProcessor` **(v0.1.2: Robust)**
  - Classifies entities into voxels, calculates statistics (min/max/avg, etc.).
  - Enhanced error handling and implemented safe entity processing.
- `VoxelRenderer` **(v0.1.2: Entity-based)**
  - Renders voxels using Cesium Entity (changed from Primitive).
  - Added new features like wireframeOnly and heightBased.

### Processing Flow (v0.1.2)
1. **Boundary Calculation**: `CoordinateTransformer.calculateBounds(entities)` - Direct coordinate range calculation
2. **Grid Generation**: `VoxelGrid.createGrid(bounds, voxelSize)` - Simple grid creation
3. **Classification/Aggregation**: `DataProcessor.classifyEntitiesIntoVoxels(...)` - Safe entity processing
4. **Statistics Calculation**: `DataProcessor.calculateStatistics(...)` - Basic statistics calculation
5. **Rendering**: `VoxelRenderer.render(...)` - Entity-based rendering

### v0.1.2 Features
- **Entity-based Rendering**: Changed from Primitive to Entity for improved stability
- **Visibility Improvement**: wireframeOnly makes overlapping voxels easier to see
- **Height-based Representation**: heightBased provides intuitive density understanding
- **Error Handling**: Robust entity processing
- **Performance**: Render count limitation with maxRenderVoxels (recommended ~300)

### New Feature Options
```javascript
const heatbox = new Heatbox(viewer, {
  wireframeOnly: true,    // Show only wireframes
  heightBased: true,      // Height-based representation  
  outlineWidth: 2,        // Outline thickness
  maxRenderVoxels: 300    // Render count limitation
});
```

### Extension Possibilities
- npm packaging
- Real-time update optimization
- Custom color maps
- Data source selection features
