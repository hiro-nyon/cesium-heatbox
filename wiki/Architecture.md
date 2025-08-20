# Architecture（内部構成の概要） - v0.1.2

> **⚠️ 注意**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。

本ライブラリは 4 つの中核コンポーネントで構成されています（v0.1.2でシンプル化）。

## コンポーネント
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

## 処理フロー（v0.1.2）
1. **境界計算**: `CoordinateTransformer.calculateBounds(entities)` - 直接的な座標範囲計算
2. **グリッド生成**: `VoxelGrid.createGrid(bounds, voxelSize)` - シンプルなグリッド作成
3. **分類/集計**: `DataProcessor.classifyEntitiesIntoVoxels(...)` - 安全なエンティティ処理
4. **統計算出**: `DataProcessor.calculateStatistics(...)` - 基本統計の計算
5. **描画**: `VoxelRenderer.render(...)` - Entity ベースの描画

## v0.1.2 の特徴
- **Entity ベース描画**: Primitive から Entity に変更で安定性向上
- **視認性改善**: wireframeOnly で重なったボクセルが見やすく
- **高さベース表現**: heightBased で直感的な密度理解
- **エラーハンドリング**: 堅牢なエンティティ処理
- **パフォーマンス**: maxRenderVoxels で描画数制限（推奨300前後）

## 新機能オプション
```javascript
const heatbox = new Heatbox(viewer, {
  wireframeOnly: true,    // 枠線のみ表示
  heightBased: true,      // 高さベース表現  
  outlineWidth: 2,        // 枠線の太さ
  maxRenderVoxels: 300    // 描画数制限
});
```

## 拡張の余地
- npm パッケージ化
- リアルタイム更新最適化
- カスタムカラーマップ
- データソース選択機能
