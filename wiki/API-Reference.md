# API Reference（APIリファレンス）

**日本語** | [English](#english)

---

## 日本語

### 概要
このページは v0.1.15-alpha.3 時点の API をまとめています。  
ライブラリ本体の JSDoc コメントから自動生成した Markdown をベースにしつつ、主要なクラス・オプションの関係が一目で分かるよう手動で再構成しています。

- **最終確認日**: 2025-10-10  
- **生成コマンド**: `npm run docs` (JSDoc) / `npm run wiki:sync`  
- **型定義同期**: `node tools/build-types.js` で `types/index.d.ts` を再出力

> 自動生成したファイルを取り込む際は、上記コマンドを実行してから差分を確認してください。

### クラス一覧

| クラス | 説明 | 代表的な API |
|-------|------|--------------|
| [Heatbox](Heatbox) | ライブラリのエントリポイント。Cesium Viewer とオプションを受け取り、全体を統括 | `setData()`, `updateOptions()`, `getStatistics()`, `togglePerformanceOverlay()` |
| [VoxelRenderer](VoxelRenderer) | ボクセル描画のオーケストレータ。適応制御や選択ロジックを束ねて描画を実行 | `_calculateAdaptiveParams()`, `render()` |
| [VoxelGrid](VoxelGrid) | ボクセルグリッド生成とインデックス計算を担当 | `createGrid()`, `getVoxelKey()` |
| [DataProcessor](DataProcessor) | エンティティのボクセル分類と統計計算 | `classifyEntitiesIntoVoxels()`, `calculateStatistics()` |
| [CoordinateTransformer](CoordinateTransformer) | 緯度経度⇔Cartesian 変換などのユーティリティ | `calculateBounds()` |
| [ColorCalculator](ColorCalculator) | 密度に応じた色を算出（カラーマップ／発散配色） | `calculateColor()` |
| [VoxelSelector](VoxelSelector) | 描画上限やハイブリッド戦略に基づいて表示ボクセルを選別 | `selectVoxels()` |
| [AdaptiveController](AdaptiveController) | v0.1.15 の適応制御ロジック。近傍密度・Z軸補正・重なり診断を提供 | `calculateAdaptiveParams()` |
| [GeometryRenderer](GeometryRenderer) | 実際の Cesium Entity（ボックス・ポリライン等）生成を担当 | `createVoxelBox()`, `createInsetOutline()` |
| [PerformanceOverlay](PerformanceOverlay) | パフォーマンス指標をブラウザ上に表示 | `update()`, `toggle()` |

### オプションと設定カテゴリ

- **描画基本設定**: `voxelSize`, `opacity`, `maxRenderVoxels`
- **自動調整**: `autoVoxelSize`, `renderBudgetMode`, `profile`
- **適応制御 (ADR-0011)**: `adaptiveOutlines`, `outlineWidthPreset`, `adaptiveParams.*`, `overlapDetection`, `zScaleCompensation`
- **表示モード**: `outlineRenderMode`, `emulationScope`, `wireframeOnly`, `heightBased`
- **パフォーマンス監視**: `performanceOverlay`, `togglePerformanceOverlay()` 系

詳細なパラメータの型は [types/index.d.ts](../types/index.d.ts) または `npm run docs` の出力を参照してください。

### 生成ワークフロー

1. JSDoc を整備（`src` 内のコメント）
2. `npm run docs` で `docs/api/` を生成
3. `npm run wiki:sync` で Wiki 用 Markdown を更新
4. 必要に応じて本ページを手動編集し、概要・リンクを整える

> 生成結果は直接コミットせず、`docs/api/` と Wiki 双方で内容を確認してから反映します。

### 関連リンク

- [Home](Home)
- [Getting Started](Getting-Started)
- [Quick Start](Quick-Start)
- [Guides: Adaptive Outlines](Guides-Adaptive-Outlines.md)
- [Troubleshooting](Troubleshooting)

---

## English

### Overview
This document summarises the API as of **v0.1.15-alpha.3**.  
It combines auto-generated Markdown (from JSDoc) with a curated overview so that developers can quickly identify the major classes and options.

- **Last validated**: 2025-10-10  
- **Generation commands**: `npm run docs` (JSDoc) / `npm run wiki:sync`  
- **Type sync**: `node tools/build-types.js` regenerates `types/index.d.ts`

> Always run the commands above before committing regenerated documentation.

### Class Catalogue

| Class | Description | Key API |
|-------|-------------|---------|
| [Heatbox](Heatbox) | Library entry point orchestrating the full pipeline | `setData()`, `updateOptions()`, `getStatistics()`, `togglePerformanceOverlay()` |
| [VoxelRenderer](VoxelRenderer) | Rendering orchestrator coordinating adaptive logic and selection | `_calculateAdaptiveParams()`, `render()` |
| [VoxelGrid](VoxelGrid) | Generates voxel grids and index helpers | `createGrid()`, `getVoxelKey()` |
| [DataProcessor](DataProcessor) | Classifies entities into voxels and computes statistics | `classifyEntitiesIntoVoxels()`, `calculateStatistics()` |
| [CoordinateTransformer](CoordinateTransformer) | Coordinate conversion utilities | `calculateBounds()` |
| [ColorCalculator](ColorCalculator) | Produces density-based colours (colormaps, diverging schemes) | `calculateColor()` |
| [VoxelSelector](VoxelSelector) | Chooses voxels for rendering according to strategies and budgets | `selectVoxels()` |
| [AdaptiveController](AdaptiveController) | v0.1.15 adaptive logic: neighbourhood density, Z-scale compensation, overlap hints | `calculateAdaptiveParams()` |
| [GeometryRenderer](GeometryRenderer) | Creates Cesium entities (boxes, inset outlines, polylines) | `createVoxelBox()`, `createInsetOutline()` |
| [PerformanceOverlay](PerformanceOverlay) | Displays performance metrics in the browser | `update()`, `toggle()` |

### Configuration Map

- **Core rendering**: `voxelSize`, `opacity`, `maxRenderVoxels`
- **Automation**: `autoVoxelSize`, `renderBudgetMode`, `profile`
- **Adaptive (ADR-0011)**: `adaptiveOutlines`, `outlineWidthPreset`, `adaptiveParams.*`, `overlapDetection`, `zScaleCompensation`
- **Display modes**: `outlineRenderMode`, `emulationScope`, `wireframeOnly`, `heightBased`
- **Observability**: `performanceOverlay`, overlay controls (`togglePerformanceOverlay()`, etc.)

Refer to [types/index.d.ts](../types/index.d.ts) or the generated docs for the full signature of every option.

### Generation Workflow

1. Maintain JSDoc comments in `src/**`
2. Run `npm run docs` to build `docs/api/`
3. Run `npm run wiki:sync` to update Markdown for the GitHub Wiki
4. Manually review and adjust curated sections like this page

> Do not commit generated artifacts blindly—review the diff and ensure links remain valid.

### Quick Links

- [Home](Home)
- [Getting Started](Getting-Started)
- [Quick Start](Quick-Start)
- [Guides: Adaptive Outlines](Guides-Adaptive-Outlines.md)
- [Troubleshooting](Troubleshooting)
