# Architecture（内部構成の概要）

本ライブラリは 4 つの中核コンポーネントで構成されています。

## コンポーネント
- `CoordinateTransformer`
  - Entity の位置を取得し、緯度経度高度と Cartesian3 の相互変換、境界計算、ボクセル座標への正規化を担当。
- `VoxelGrid`
  - 範囲とボクセルサイズからグリッドを生成し、総ボクセル数やインデックス/キー計算、隣接ボクセル取得、座標→中心位置変換などを提供。
- `DataProcessor`
  - エンティティをボクセルへ分類、ボクセルごとの `count` 集計、統計値（min/max/avg 等）を算出。
- `VoxelRenderer`
  - Cesium の Primitive を用いてボクセルを一括描画。密度に応じた色、枠線、描画上限（上位 N のみ）を制御。

## 処理フロー
1. 境界計算: `CoordinateTransformer.calculateBounds(entities)`
2. グリッド生成: `VoxelGrid.createGrid(bounds, voxelSize)`
3. 分類/集計: `DataProcessor.classifyEntitiesIntoVoxels(...)`
4. 統計算出: `DataProcessor.calculateStatistics(...)`
5. 描画: `VoxelRenderer.render(voxelData, bounds, grid, statistics)`

## パフォーマンス
- 総ボクセル数が閾値を超えた場合、`validateVoxelCount` の推奨に従いボクセルサイズを自動拡大して再試行。
- `maxRenderVoxels` を設定すると、密度の高い順に上位 N のみ描画（空ボクセルは抑制）。

## 拡張の余地（例）
- 非均一ボクセルサイズ、動的更新/ストリーミング、データソース選択、GPU インスタンシング最適化 など。
