# Release Notes（リリースノート） / Release Notes

**日本語** | [English](#english)

最新の変更はリポジトリの `CHANGELOG.md` を参照してください。ここでは主要トピックを抜粋します。

## 日本語

## 0.1.15-alpha.3 (2025-10-10)
- ADR-0011 Phase 4 を完了し、適応制御の最終調整を実装
  - `adaptiveParams.zScaleCompensation` の既定を有効化
  - `adaptiveParams.overlapDetection` による重なり診断と推奨モードの導入
  - `outlineWidthRange` / `boxOpacityRange` / `outlineOpacityRange` の正規化を統一
- `PerformanceOverlay` を拡張し、レンダリング時間・メモリ推定・適応メトリクスを表示
- `profile` と `adaptiveParams` のドキュメント/型定義を整理、TypeScript 用 `types/index.d.ts` を更新
- Wiki/ガイドを全面的に日英併記へ刷新

## 0.1.11 (2025-09-08)
- ADR-0009 に基づく責務分離を完了（`VoxelRenderer` をオーケストレーションに特化）
- 新コア: `ColorCalculator` / `VoxelSelector` / `AdaptiveController` / `GeometryRenderer`
- Playground: i18n とアクセシビリティの改善、emulation-only モードの整備
- ドキュメント: API/Wiki 自動生成の安定化、Source ページもMarkdown化
- テスト: パフォーマンス受入は `PERF_TESTS=1` で任意実行、メモリの閾値調整（CIばらつき対策）

参考: ADR-0009（VoxelRenderer責任分離） `docs/adr/ADR-0009-voxel-renderer-responsibility-separation.md`

## 0.1.10 (2025-09-04)
- 内部リファクタリング・モジュール化の段階実施。公開APIは互換維持。
  - 選択戦略/推定/視点調整の外部化とI/F明確化、`VoxelRenderer`の役割縮小の準備
- ドキュメント: ADR-0007/0008 を追加（最終的に 0009 に置換）。MIGRATION 計画を文書化（実運用は 0.1.11 へ統合）。

参考: ADR-0007（v0.1.10 リファクタ） `docs/adr/ADR-0007-v0.1.10-refactoring-modularization.md`  /  ADR-0008（API整理案） `docs/adr/ADR-0008-v0.1.10-refactor-and-api-cleanup.md`

## 0.1.9 (2025-08-30)
- 適応的レンダリング制限（選抜戦略の拡張）
  - `renderLimitStrategy: 'density'|'coverage'|'hybrid'`
  - `minCoverageRatio`, `coverageBinsXY('auto'|number)`
- 自動ボクセルサイズ強化（占有率ベース）: `autoVoxelSizeMode: 'occupancy'`, `autoVoxelTargetFill`
- Auto Render Budget: `renderBudgetMode: 'auto'|'manual'`（端末ティアに応じて上限を初期化）
- スマート視覚化支援: `autoView: true`, `fitView(bounds, options)` 公開

参考: ADR-0006（v0.1.9） `docs/adr/ADR-0006-v0.1.9-adaptive-rendering-and-auto-view.md`

## 0.1.5 (2025-08-25)
- デバッグ: `debug.showBounds` で境界ボックス表示を明示的に制御（`debug` は boolean | object）
- カラーマップ: `colorMap: 'viridis' | 'inferno'`、発散配色 `diverging`/`divergingPivot`
- 強調表示: `highlightTopN` と `highlightStyle` で上位Nボクセルを強調
- 非推奨: `batchMode` はDeprecated（互換性のため受理するが無視。将来削除）
- ドキュメント: README / API / Wiki を v0.1.5 に同期

## 0.1.4 (2025-08-24)
- 新機能: `autoVoxelSize` によるボクセルサイズ自動決定（`voxelSize` 未指定時）
- 統計/デバッグ拡充: `HeatboxStatistics` と `getDebugInfo()` に自動調整の詳細を追加
- 仕様明確化: 実描画寸法は各軸の実セルサイズ `cellSizeX/Y/Z` を使用する旨を明記
- 不具合修正: 分母ゼロ安全化と寸法計算の是正で隣接ボクセルの重なりを解消
- ドキュメント: API/Getting Started/Examples を v0.1.4 内容に同期

## 0.1.3 (2025-01-22)
- 統計の整合性: `renderedVoxels` を実描画数と一致させる修正
- デバッグ制御: `debug` オプションでログ出力や境界表示を制御
- 互換性/サンプル: UMD対応の高度な例と日本語UI統一、CDN整合
- 細かな修正: 選択イベント情報の取得や未使用コードの整理 等

## 0.1.2 (2025-10-05)
- **視認性改善**: `wireframeOnly`オプションで枠線のみ表示、重なったボクセルが見やすく
- **高さベース表現**: `heightBased`オプションで密度を高さで視覚化
- **UI拡張**: Playgroundに新しい表示オプションを追加
- **テスト整備**: シンプル化されたAPIに対応したテストケース更新

## 0.1.1 (2025-08-20)
- **レンダリング実装の変更**: PrimitiveベースからEntityベースへ移行
- **互換性の向上**: Cesium 1.132との完全互換性を確保
- **エラー処理の強化**: エンティティの削除と表示/非表示切り替えでのエラー処理改善
- **デバッグ支援**: バウンディングボックス表示と詳細ログ出力

## 0.1.0 (2025-09-15)
- 安定版リリース（alpha から移行）
- CI（GitHub Actions）導入、ツリーシェイキング対応
- README/設定の整理、重複設定の解消

## 0.1.0-alpha.3
- 新規 API 追加: `createFromEntities`, `getOptions`, `getDebugInfo`, `Heatbox.filterEntities`
- Jest 設定の安定化、JSDoc/型定義生成スクリプト整備
- ESM/UMD エントリーポイント整理、外部モジュール扱い調整

## 0.1.0-alpha.2 / alpha.1
- 初期実装、基本ボクセル可視化と統計
- 仕様・開発ガイド・クイックスタートの追加

## 取得・ビルド手順

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

詳細は Getting Started / Quick Start ページを参照してください。

> 詳細は `CHANGELOG.md` を参照してください。

## English

### v0.1.15-alpha.3 (2025-10-10)
- Completed ADR-0011 Phase 4, finalising adaptive visualisation
  - Enabled `adaptiveParams.zScaleCompensation` by default
  - Added `adaptiveParams.overlapDetection` to surface recommended outline modes
  - Unified normalisation for `outlineWidthRange`, `boxOpacityRange`, `outlineOpacityRange`
- Expanded `PerformanceOverlay` with render time, memory estimates, and adaptive metrics
- Refined `profile` and `adaptiveParams` documentation and regenerated the public type definition (`types/index.d.ts`)
- Refreshed the Wiki/guides with bilingual (JA/EN) coverage

### v0.1.11 (2025-09-08)
- Completed responsibility separation per ADR-0009 (`VoxelRenderer` acts as orchestrator)
- New core modules: `ColorCalculator`, `VoxelSelector`, `AdaptiveController`, `GeometryRenderer`
- Playground: i18n & accessibility improvements; refined emulation-only mode
- Docs: Stable API/Wiki generation, including Source pages to Markdown
- Tests: Gate perf acceptance with `PERF_TESTS=1`; relaxed memory thresholds for CI variance

Ref: ADR-0009 `docs/adr/ADR-0009-voxel-renderer-responsibility-separation.md`

### v0.1.10 (2025-09-04)
- Incremental refactoring/modularization with API compatibility preserved.
  - Extracted selection/estimation/view-fitting concerns, prepared `VoxelRenderer` for orchestration role
- Docs: Added ADR-0007/0008 (superseded by 0009). Migration plan documented (operationalized in 0.1.11).

Refs: ADR-0007 `docs/adr/ADR-0007-v0.1.10-refactoring-modularization.md` / ADR-0008 `docs/adr/ADR-0008-v0.1.10-refactor-and-api-cleanup.md`

### v0.1.9 (2025-08-30)
- Adaptive rendering limits (selection strategies)
  - `renderLimitStrategy: 'density'|'coverage'|'hybrid'`
  - `minCoverageRatio`, `coverageBinsXY('auto'|number)`
- Occupancy-based auto voxel size: `autoVoxelSizeMode: 'occupancy'`, `autoVoxelTargetFill`
- Auto Render Budget: `renderBudgetMode: 'auto'|'manual'`
- Smart view assistance: `autoView: true`, `fitView(bounds, options)`

Ref: ADR-0006 `docs/adr/ADR-0006-v0.1.9-adaptive-rendering-and-auto-view.md`

Please refer to the repository's `CHANGELOG.md` for the latest changes. Here we extract major topics.

### v0.1.7 (2025-01-09)
- **Adaptive Outline Control**: Automatic adjustment based on neighborhood density, camera distance, and overlap risk
- **Display Mode Extension**: Switching between standard/inset/emulation-only rendering methods  
- **Opacity Resolvers**: Custom opacity control functionality
- Performance optimization and error handling enhancements

### v0.1.6.1 (2025-08-26)
- **Inset Outline Feature**: Display outlines offset inward for improved visibility
- Examples updated with inset outline UI
- Comprehensive unit and integration tests added

### v0.1.6 (2025-08-26)
- **Outline Overlap Mitigation**: `voxelGap` option for inter-voxel gaps to improve visibility
- **Outline Transparency Control**: `outlineOpacity` option to control outline transparency (0-1)
- **Dynamic Outline Width Control**: `outlineWidthResolver` function for dynamic per-voxel outline width determination
- **Legend Implementation Guide**: Detailed documentation for custom legend implementation
- **Wiki Auto-sync**: Complete automation of Wiki updates via GitHub Actions

### v0.1.5 (2025-08-25)
- Debug: Explicit control of bounding box display with `debug.showBounds`
- Color maps: `colorMap: 'viridis' | 'inferno'`, diverging colors `diverging`/`divergingPivot`
- Highlighting: Emphasize top N voxels with `highlightTopN` and `highlightStyle`
- Deprecated: `batchMode` is deprecated (accepted for compatibility but ignored, will be removed in future)

### v0.1.4 (2025-08-24)
- New feature: Automatic voxel size determination with `autoVoxelSize` (when `voxelSize` is unspecified)
- Statistics/debug enhancement: Added auto-adjustment details to `HeatboxStatistics` and `getDebugInfo()`
- Specification clarification: Clarified that actual rendering dimensions use actual cell sizes `cellSizeX/Y/Z` for each axis

### v0.1.2 (2025-10-05)
- **Visibility Improvement**: `wireframeOnly` option for outline-only display, making overlapping voxels easier to see
- **Height-based Representation**: `heightBased` option to visualize density through height
- **UI Extension**: Added new display options to Playground

### v0.1.0 (2025-09-15)
- Stable release (migrated from alpha)
- CI (GitHub Actions) introduction, tree shaking support
- README/configuration organization, duplicate configuration resolution

### v0.1.0-alpha.3
- New API additions: `createFromEntities`, `getOptions`, `getDebugInfo`, `Heatbox.filterEntities`
- Jest configuration stabilization, JSDoc/type definition generation script organization
- ESM/UMD entry point organization, external module handling adjustment

### v0.1.0-alpha.2 / alpha.1
- Initial implementation, basic voxel visualization and statistics
- Addition of specifications, development guide, and quick start

### Installation and Build Instructions

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

Please refer to the Getting Started / Quick Start pages for details.

> Please refer to `CHANGELOG.md` for details.
