# Architecture Decision Records (ADR)

このディレクトリには、CesiumJS Heatboxプロジェクトの重要な技術決定を記録したADRを保存しています。

## For English-speaking readers

**Start with [ADR-0019](ADR-0019-v1.3.7-current-runtime-architecture.md) for an up-to-date overview of Cesium Heatbox's runtime architecture and CesiumJS integration.** It maps the current subsystems, the CesiumJS integration boundaries, and the library's verified limitations, with links into the decisions that produced them.

Three ADRs are fully bilingual — every English passage is followed by its Japanese counterpart, so they can be read end to end in either language. Mermaid node labels are English, with a Japanese reading note after each diagram.

| ADR | Scope |
|---|---|
| [ADR-0019](ADR-0019-v1.3.7-current-runtime-architecture.md) | **Current runtime architecture and CesiumJS integration** — the authoritative architecture map. Read this first. |
| [ADR-0020](ADR-0020-v1.3.0-incremental-entity-rendering.md) | **Rendering architecture** — incremental Entity lifecycle and camera-aware render planning. |
| [ADR-0021](ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md) | **Temporal architecture** — asynchronous temporal pipeline and lightweight updates. |

ADR-0001 through ADR-0018 are historical records written in Japanese (ADR-0013 onward are partly bilingual). They are **not** retro-fitted to the current implementation. Where the code has since diverged from a decision, the divergence is recorded in an appended `Implementation Outcome` section rather than by rewriting the original decision.

**On dates.** ADR-0020 and ADR-0021 were **written on 2026-08-23** but record decisions taken in April 2026 (v1.3.0–v1.3.4), which were shipped without an ADR at the time. Their headers carry both a `Decision date` and a `Recorded` date, and each states plainly that it is a retrospective reconstruction from Git history and source. The table below is ordered by ADR number, so the date column is not monotonic.

**日付について.** ADR-0020 と ADR-0021 は **2026-08-23 に作成** されたが、記録対象は2026年4月（v1.3.0〜v1.3.4）に実施され当時ADR化されなかった決定である。両ADRのヘッダには `Decision date` と `Recorded` の両方があり、Git history とソースからの後追い再構成であることを本文冒頭で明示している。下表はADR番号順のため、日付列は単調にならない。

## ADRとは

Architecture Decision Records（アーキテクチャ決定記録）は、プロジェクトで行った重要な技術決定を文書化するための軽量な形式です。

## Status と Implementation State の区別

このリポジトリでは、**決定のステータス**と**実装の進捗**を明確に分離します。

**Status**（決定ステータス）— 次のいずれかのみを使用します:

| Status | 意味 |
|---|---|
| `Proposed` | 提案済み。まだ決定されていない |
| `Accepted` | 決定済み |
| `Rejected` | 却下された |
| `Deprecated` | 決定は有効だったが、現在は非推奨 |
| `Superseded` | 別のADRに置き換えられた |

**Implementation State**（実装状況）— 必要に応じて別項目として記録します:

| Implementation State | 意味 |
|---|---|
| `Not implemented` | 未実装 |
| `Partially implemented` | 一部のみ実装 |
| `Implemented` | 決定どおり実装済み |
| `Evolved` | 実装済みだが、その後設計が発展・変化した |

`In Progress` のような進捗ラベルは Status には使用しません。

## フォーマット

各ADRは以下の構造に従います：

```
# ADR-XXXX: タイトル

## Status
Proposed / Accepted / Rejected / Deprecated / Superseded by ADR-YYYY

## Context
決定に至った背景・状況

## Decision
行った決定の詳細

## Consequences
決定による影響・結果
```

詳細な執筆要件は `AGENTS.md` の "Architecture Decision Records (ADR)" セクションを参照してください。なお ADR-0019 / 0020 / 0021 は個別機能の ADR ではなく現行アーキテクチャの記述文書であるため、`AGENTS.md` の feature-ADR テンプレート（Implementation Plan / Testing Strategy / Migration Guide 等）には意図的に従っていません。一方で `AGENTS.md` の Bilingual 要件と命名規約（`ADR-NNNN-<version>-<feature-name>.md`）には従っています。

## 現在のADR一覧

| ADR | タイトル | Status | Implementation State | 日付 | 関係 |
|-----|----------|--------|----------------------|------|------|
| [ADR-0001](ADR-0001-auto-voxel-size-implementation.md) | ボクセルサイズ自動決定機能の実装方針 | Accepted | Evolved | 2025-01-24 | — |
| [ADR-0002](ADR-0002-v0.1.5-basics-enhancements.md) | v0.1.5 基本機能強化（デバッグ・カラーマップ・TopN・整合） | Accepted | Implemented | 2025-08-25 | — |
| [ADR-0003](ADR-0003-v0.1.6-hardening-and-docs.md) | v0.1.6 ハードニングとドキュメント（Lint/Tests/Wiki/凡例/枠線） | Accepted | Implemented | 2025-08-25 | — |
| [ADR-0004](ADR-0004-outline-inset-voxels.md) | 枠線の内側オフセット（インセット枠線）機能の設計 | Accepted | Implemented | 2025-08-26 | — |
| [ADR-0005](ADR-0005-adaptive-outlines-and-emulation-only.md) | 適応的枠線制御とエミュレーション専用表示モード | Accepted | Implemented | 2025-08-26 | — |
| [ADR-0006](ADR-0006-v0.1.9-adaptive-rendering-and-auto-view.md) | v0.1.9 適応的レンダリング制限とスマート視覚化支援 | Accepted | Implemented | 2025-08-30 | — |
| [ADR-0007](ADR-0007-v0.1.10-refactoring-modularization.md) | v0.1.10 リファクタリング・モジュール化 | Superseded | Not implemented | 2025-09-04 | Superseded by ADR-0008 |
| [ADR-0008](ADR-0008-v0.1.10-refactor-and-api-cleanup.md) | v0.1.10 モジュール分割とAPIクリーンアップ（互換性見直し） | Superseded | Not implemented | 2025-09-07 | Supersedes ADR-0007 / Superseded by ADR-0009 |
| [ADR-0009](ADR-0009-voxel-renderer-responsibility-separation.md) | VoxelRenderer責任分離とSingle Responsibility Principle適用 | Accepted | Partially implemented / Evolved | 2025-09-07 | Supersedes ADR-0008 / Extended by ADR-0020 |
| [ADR-0010](ADR-0010-v0.1.12-api-cleanup-and-observability.md) | v0.1.12 APIクリーンアップ・観測可能性 | Accepted | Implemented | 2025-09-09 | — |
| [ADR-0011](ADR-0011-v0.1.15-adaptive-visualization-finalization.md) | v0.1.15 適応的表示の核・視認性最適化の仕上げ | Accepted | Implemented | 2025-09-20 | — |
| [ADR-0012](ADR-0012-v0.1.16-examples-organization.md) | v0.1.16 Examples 体系化・整理 | Accepted | Implemented | 2025-11-01 | — |
| [ADR-0013](ADR-0013-v0.1.17-spatial-id-support.md) | v0.1.17 空間ID対応（tile-gridモード統合） | Accepted | Implemented / Evolved | 2025-11-02 | 前提: PREP-ADR-0013 / QA: ADR-0015 |
| [ADR-0014](ADR-0014-v0.1.18-voxel-layer-aggregation.md) | v0.1.18 ボクセル内情報のレイヤ別集約 | Accepted | Implemented | 2025-11-02 | — |
| [ADR-0015](ADR-0015-v0.1.19-global-spatialid-qa.md) | v0.1.19 グローバル空間ID QA | Accepted | Implemented | 2025-11-18 | 関連: ADR-0013 |
| [ADR-0016](ADR-0016-v1.0.0-classification-engine.md) | v1.0.0 基本分類エンジンと統計ライブラリ方針 | Accepted | Implemented | 2025-11-18 | Extended by ADR-0017 |
| [ADR-0017](ADR-0017-v1.1.0-classification-extension.md) | v1.1.0 分類エンジン拡張（opacity/width + quantile/jenks） | Accepted | Implemented | 2025-11-18 | Extends ADR-0016 |
| [ADR-0018](ADR-0018-v1.2.0-time-dependent-data.md) | v1.2.0 時間依存データ（PoC） | Accepted | Implemented / Evolved | 2025-11-19 | Extended by ADR-0021 |
| [ADR-0019](ADR-0019-v1.3.7-current-runtime-architecture.md) | **Current Runtime Architecture and CesiumJS Integration** 🌐 | Accepted | Implemented | 2026-08-23 | 全ADRへの入口。置き換えではない |
| [ADR-0020](ADR-0020-v1.3.0-incremental-entity-rendering.md) | **Incremental Entity Rendering and Camera-Aware Render Planning** 🌐 | Accepted | Implemented | 決定 2026-04-06 / 記録 2026-08-23 | Extends ADR-0009 |
| [ADR-0021](ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md) | **Asynchronous Temporal Data Pipeline and Lightweight Updates** 🌐 | Accepted | Implemented | 決定 2026-04-06 / 記録 2026-08-23 | Extends ADR-0018（supersede ではない） |

🌐 = 全文 日英併記 / fully bilingual

### 補助文書

| 文書 | 種別 | 内容 |
|---|---|---|
| [PREP-ADR-0013](PREP-ADR-0013-ouranos-gex-api-summary.md) | Preparatory reference | ADR-0013 執筆のための ouranos-gex API 調査サマリ。決定文書ではない |

## 読む順序の目安

- **現行アーキテクチャを知りたい** → ADR-0019 → ADR-0020 → ADR-0021
- **描画パイプラインの経緯** → ADR-0009（責務分離）→ ADR-0020（差分描画・描画計画）
- **時系列処理の経緯** → ADR-0018（PoC）→ ADR-0021（非同期・軽量更新）
- **空間ID対応** → PREP-ADR-0013 → ADR-0013 → ADR-0015
- **分類エンジン** → ADR-0016 → ADR-0017

## 参考資料

- [Architecture Decision Records](https://adr.github.io/)
- [ADR Tools](https://github.com/npryce/adr-tools)
