# ADR-0001: ボクセルサイズ自動決定機能の実装方針

## Status

**Accepted** - 2025-01-24

## Context

v0.1.4でボクセルサイズ自動決定機能（`autoVoxelSize`）を実装するにあたり、以下の課題があった：

1. **初心者ユーザビリティ**: 適切な`voxelSize`の選択が困難
2. **パフォーマンス問題**: 不適切なサイズでメモリ・描画制限を超過
3. **ボクセル重複問題**: 隣接ボクセルが重なる視覚的不具合
4. **設計選択肢**: Boolean型 vs 3モード型のAPI設計

## Decision

### 1. API設計: Boolean型を採用

```typescript
interface HeatboxOptions {
  autoVoxelSize?: boolean;    // デフォルト: false
  voxelSize?: number;         // 手動指定時は autoVoxelSize を無効化
}
```

**理由**: シンプルで理解しやすく、既存互換性を維持

### 2. 自動調整アルゴリズム

1. **データ範囲解析**: エンティティ分布からX/Y/Z軸の物理的範囲を計算
2. **密度推定**: `エンティティ数 / データ範囲体積` で密度を算出
3. **初期サイズ推定**: 密度に応じて10-100m範囲で初期サイズを決定
4. **制限チェック**: `PERFORMANCE_LIMITS.maxVoxels` (50000) との照合
5. **調整適用**: 制限超過時に`validateVoxelCount`の推奨サイズを適用

### 3. ボクセル重複解決策

- **VoxelGrid**: 実際のセルサイズ（`cellSizeX/Y/Z`）をグリッド情報に追加
- **VoxelRenderer**: 描画時に`grid.cellSizeX/Y/Z`を使用、`voxelSize`は目標値として扱う
- **DataProcessor**: 分母ゼロ安全対策（`lonDen === 0 ? 0 : Math.floor(...)`）

### 4. 統計・デバッグ情報拡張

```typescript
interface HeatboxStatistics {
  autoAdjusted?: boolean;
  originalVoxelSize?: number;
  finalVoxelSize?: number;
  adjustmentReason?: string;
}
```

## Consequences

### Positive

- ✅ 初心者ユーザーの使いやすさ向上
- ✅ パフォーマンス問題の自動回避
- ✅ ボクセル重複問題の完全解決
- ✅ 既存APIとの完全な後方互換性
- ✅ 調整過程の透明性確保

### Negative

- ⚠️ 内部複雑性の増加
- ⚠️ 自動調整ロジックのメンテナンス負荷
- ⚠️ エッジケースでの予期しない動作の可能性

### Risks & Mitigation

| リスク | 対策 |
|--------|------|
| 推定精度の問題 | フォールバック値(20m)、統計情報での調整理由記録 |
| パフォーマンス劣化 | 軽量な推定アルゴリズム、制限値での安全弁 |
| デバッグ困難 | `getDebugInfo()`での詳細情報提供 |

## Implementation Details

### Key Files Modified

- `src/utils/constants.js`: `autoVoxelSize: false` をDEFAULT_OPTIONSに追加
- `src/utils/validation.js`: `estimateInitialVoxelSize()`, `calculateDataRange()` 実装
- `src/Heatbox.js`: 自動調整ロジック統合
- `src/core/DataProcessor.js`: ゼロ除算安全対策、統計情報拡張
- `src/core/VoxelGrid.js`: 実セルサイズ（`cellSizeX/Y/Z`）計算追加
- `src/core/VoxelRenderer.js`: 実セルサイズ優先の描画寸法

### Test Coverage

- ✅ 自動調整の基本動作
- ✅ 制限超過時の調整動作
- ✅ 手動指定時の無効化
- ✅ ゼロ除算エッジケース
- ✅ 統計情報の正確性

## References

- v0.1.4 Auto Voxel Size Design (archived in Git history at tag v0.1.4)
- v0.1.4 Implementation Guide (archived in Git history at tag v0.1.4)
- [GitHub Issue #XXX](https://github.com/hiro-nyon/cesium-heatbox/issues/XXX) - User feedback on voxel sizing difficulty

## Superseded Documents

This ADR supersedes and archives:
- `docs/v0.1.4-auto-voxelsize-design.md`
- `docs/v0.1.4-implementation-guide.md`

These documents served their purpose during development and can be found in project history via Git tags.
