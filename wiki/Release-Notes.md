# Release Notes（リリースノート） / Release Notes

**日本語** | [English](#english)

最新の変更はリポジトリの `CHANGELOG.md` を参照してください。ここでは主要トピックを抜粋します。

## 日本語

## 0.1.11 (2025-09-XX)
- ADR-0009 に基づく責務分離を完了（`VoxelRenderer` をオーケストレーションに特化）
- 新コア: `ColorCalculator` / `VoxelSelector` / `AdaptiveController` / `GeometryRenderer`
- Playground: i18n とアクセシビリティの改善、emulation-only モードの整備
- ドキュメント: API/Wiki 自動生成の安定化、Source ページもMarkdown化
- テスト: パフォーマンス受入は `PERF_TESTS=1` で任意実行、メモリの閾値調整（CIばらつき対策）

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

### v0.1.11 (2025-09-XX)
- Completed responsibility separation per ADR-0009 (`VoxelRenderer` acts as orchestrator)
- New core modules: `ColorCalculator`, `VoxelSelector`, `AdaptiveController`, `GeometryRenderer`
- Playground: i18n & accessibility improvements; refined emulation-only mode
- Docs: Stable API/Wiki generation, including Source pages to Markdown
- Tests: Gate perf acceptance with `PERF_TESTS=1`; relaxed memory thresholds for CI variance

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
