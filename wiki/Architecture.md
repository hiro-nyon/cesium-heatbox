# Architecture（設計） / Architecture

**日本語** | [English](#english)

本ライブラリは v0.1.11 で ADR-0009 に基づく責務分離を完了し、`VoxelRenderer` は各専門コンポーネントを統括するオーケストレーションに特化しました。

## 日本語

### コンポーネント（v0.1.11）
- `VoxelRenderer`（Orchestrator）
  - 下記 4 コンポーネントを統括し、描画フローを制御
  - 公開APIの互換維持、エラーハンドリングとログの一元化
- `ColorCalculator`（色計算）
  - 線形補間/カラーマップ/発散配色の純粋関数群
- `VoxelSelector`（選択戦略）
  - density/coverage/hybrid の戦略と TopN 強調、統計収集
- `AdaptiveController`（適応制御）
  - 近傍密度・カメラ要素・重なりリスクを踏まえたパラメータ決定
- `GeometryRenderer`（描画/エンティティ管理）
  - ボックス/インセット枠線/ポリライン等の生成とライフサイクル管理（Cesium依存）

### 処理フロー（v0.1.11）
1. **境界計算**: `CoordinateTransformer.calculateBounds(entities)`
2. **グリッド生成**: `VoxelGrid.createGrid(bounds, voxelSize)`
3. **分類/集計**: `DataProcessor.classifyEntitiesIntoVoxels(...)` → `calculateStatistics(...)`
4. **オーケストレーション**: `VoxelRenderer.render(...)`
   - `VoxelSelector` で選抜 → `AdaptiveController` でパラメータ → `ColorCalculator` で色 → `GeometryRenderer` で描画

### v0.1.11 のポイント
- **責務分離**: SRPに基づく明確な分離でテスト/拡張容易性が向上（ADR-0009）
- **依存境界**: {Selector, Adaptive, Color} → GeometryRenderer への逆参照禁止、Cesium依存はGeometryRendererに限定
- **互換性維持**: 公開APIは継続、内部刷新のみ（Examples/Quick-Start はそのまま動作）

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

### 互換性・依存
- **Entity-based Rendering**: Changed from Primitive to Entity for improved stability
- Cesium: ^1.120.0（peer）/ Node.js: >=18
- Auto Render Budget / fitView 等は v0.1.9 の設計（ADR-0006）を継承

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
