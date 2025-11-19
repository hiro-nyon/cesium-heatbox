# API Reference（APIリファレンス）

**日本語** | [English](#english)

## English

This documentation is auto-generated from JSDoc comments in the source code.

### Classes

- [AdaptiveController](AdaptiveController) — AdaptiveController - Adaptive outline logic delegated from VoxelRenderer.
- [ColorCalculator](ColorCalculator) — Color calculator class for voxel rendering.
- [CoordinateTransformer](CoordinateTransformer) — Class providing coordinate transformation utilities.
- [DataProcessor](DataProcessor) — Class responsible for processing entity data.
- [GeometryRenderer](GeometryRenderer) — GeometryRenderer - Creates Cesium entities consumed by VoxelRenderer.
- [Heatbox](Heatbox) — Main class of CesiumJS Heatbox.
- [PerformanceOverlay](PerformanceOverlay) — Performance Overlay UI component
- [SpatialIdAdapter](SpatialIdAdapter) — SpatialIdAdapter - Abstraction layer for spatial ID providers
- [VoxelGrid](VoxelGrid) — Class for managing 3D voxel grids.
- [VoxelRenderer](VoxelRenderer) — VoxelRenderer - 3D voxel rendering orchestration class.
- [VoxelSelector](VoxelSelector) — Voxel selection strategy executor.
- [ZFXYConverter](ZFXYConverter) — ZFXYConverter - Built-in ZFXY (3D tile coordinates) converter

### Version Information

- **Current Version**: 0.1.18-alpha.2
- **Last Updated**: 2025-11-02
- **Generated From**: JSDoc → Markdown conversion

### Quick Links

- [Home](Home)
- [Getting Started](Getting-Started)
- [Examples](Examples)
- [Temporal Data](Temporal-Data)

### Temporal Data (v1.2.0)

Use the new `temporal` option to feed ordered `{ start, stop, data }` slices and let Heatbox synchronize with `viewer.clock`. See [Temporal Data](Temporal-Data) for option details, overlap policies, and migration tips from manual `clock.onTick` handlers.

## 日本語

このドキュメントは、ソースコードのJSDocコメントから自動生成されます。

### クラス

- [AdaptiveController](AdaptiveController) — 適応的制御ロジック - ボクセルレンダラーから委譲されるアウトライン制御を担当
- [ColorCalculator](ColorCalculator) — ボクセル描画用の色計算クラス。
- [CoordinateTransformer](CoordinateTransformer) — 座標変換機能を提供するクラス。
- [DataProcessor](DataProcessor) — エンティティデータの処理を担当するクラス。
- [GeometryRenderer](GeometryRenderer) — ジオメトリレンダラー - VoxelRenderer が利用する Cesium エンティティを生成・管理
- [Heatbox](Heatbox) — CesiumJS Heatbox メインクラス。
- [PerformanceOverlay](PerformanceOverlay) — パフォーマンスオーバーレイUIコンポーネント
- [SpatialIdAdapter](SpatialIdAdapter) — 空間IDプロバイダーの抽象化層
- [VoxelGrid](VoxelGrid) — 3Dボクセルグリッドを管理するクラス。
- [VoxelRenderer](VoxelRenderer) — 3Dボクセル描画オーケストレーションクラス。
- [VoxelSelector](VoxelSelector) — VoxelSelector - ボクセル選択戦略の実装。
- [ZFXYConverter](ZFXYConverter) — 内蔵ZFXY（3次元タイル座標）コンバーター

### バージョン情報

- **現在のバージョン**: 0.1.18-alpha.2
- **最終更新**: 2025-11-02
- **生成元**: JSDoc → Markdown変換

### クイックリンク

- [Home](Home) - ホーム
- [Getting Started](Getting-Started) - はじめに
- [Examples](Examples) - サンプル
- [Temporal Data](Temporal-Data) - 時系列データガイド

### 時系列データ (v1.2.0)

`temporal` オプションに時間帯ごとのエンティティ配列を渡すと、Heatbox が `viewer.clock` と同期して自動で `setData()` を切り替えます。`classificationScope` や `updateInterval`、`overlapResolution` の詳細は [Temporal Data](Temporal-Data) を参照してください。
