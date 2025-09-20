# Architecture Decision Records (ADR)

このディレクトリには、CesiumJS Heatboxプロジェクトの重要な技術決定を記録したADRを保存しています。

## ADRとは

Architecture Decision Records（アーキテクチャ決定記録）は、プロジェクトで行った重要な技術決定を文書化するための軽量な形式です。

## フォーマット

各ADRは以下の構造に従います：

```
# ADR-XXXX: タイトル

## Status
Accepted / Deprecated / Superseded by ADR-YYYY

## Context
決定に至った背景・状況

## Decision
行った決定の詳細

## Consequences
決定による影響・結果
```

## 現在のADR一覧

| ADR | タイトル | ステータス | 日付 |
|-----|----------|------------|------|
| [ADR-0001](ADR-0001-auto-voxel-size-implementation.md) | ボクセルサイズ自動決定機能の実装方針 | Accepted | 2025-01-24 |
| [ADR-0002](ADR-0002-v0.1.5-basics-enhancements.md) | v0.1.5 基本機能強化（デバッグ・カラーマップ・TopN・整合） | Proposed | 2025-08-25 |
| [ADR-0003](ADR-0003-v0.1.6-hardening-and-docs.md) | v0.1.6 ハードニングとドキュメント（Lint/Tests/Wiki/凡例/枠線） | Proposed | 2025-08-25 |
| [ADR-0004](ADR-0004-outline-inset-voxels.md) | 枠線の内側オフセット（インセット枠線）機能の設計 | Accepted | 2025-08-26 |
| [ADR-0005](ADR-0005-adaptive-outlines-and-emulation-only.md) | 適応的枠線制御とエミュレーション専用表示モード | Proposed | 2025-08-26 |
| [ADR-0006](ADR-0006-v0.1.9-adaptive-rendering-and-auto-view.md) | v0.1.9 適応的レンダリング制限とスマート視覚化支援 | Proposed | 2025-08-30 |
| [ADR-0007](ADR-0007-v0.1.10-refactoring-modularization.md) | v0.1.10 リファクタリング・モジュール化 | Superseded by ADR-0008 | 2025-09-04 |
| [ADR-0008](ADR-0008-v0.1.10-refactor-and-api-cleanup.md) | v0.1.10 モジュール分割とAPIクリーンアップ（互換性見直し） | Superseded by ADR-0009 | 2025-09-04 |
| [ADR-0009](ADR-0009-voxel-renderer-responsibility-separation.md) | VoxelRenderer責任分離とSingle Responsibility Principle適用 | Accepted | 2025-09-07 |
| [ADR-0010](ADR-0010-v0.1.12-api-cleanup-and-observability.md) | v0.1.12 APIクリーンアップ・観測可能性 | Proposed | 2025-09-14 |
| [ADR-0011](ADR-0011-v0.1.15-adaptive-visualization-finalization.md) | v0.1.15 適応的表示の核・視認性最適化の仕上げ | Proposed | 2025-09-20 |

## 参考資料

- [Architecture Decision Records](https://adr.github.io/)
- [ADR Tools](https://github.com/npryce/adr-tools)
