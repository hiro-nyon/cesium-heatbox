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

## 参考資料

- [Architecture Decision Records](https://adr.github.io/)
- [ADR Tools](https://github.com/npryce/adr-tools)
