# ADR-0004: 枠線の内側オフセット（インセット枠線）機能の設計

## Status
Proposed (for review)

## Context
- v0.1.6 では枠線重なり対策として `voxelGap`（寸法縮小）と `outlineOpacity`（透明度）を導入し、`outlineWidthResolver` で太さを動的制御できるようにした。
- ただし、視認性改善の要望として「枠線をボックスの外縁ではなく、内側にオフセット（インセット）したい」というニーズがある。
- Cesium の `Entity` ベース Box 表現は `box.outline` で外周を描くのみで、インセット枠線を直接指定するAPIはない。

## Decision
オプション `outlineInset`（meters）を追加し、以下の方式でインセット枠線を実現する。

1) 既存の fill 用エンティティ（通常の Box）は従来どおり生成する。
2) 枠線専用のセカンダリ Box エンティティを追加生成し、各軸の寸法から `outlineInset` を差し引いた「一回り小さい」Box を配置する。
   - 小さい Box の `box.fill = false`, `box.outline = true` を設定。
   - 枠線色は既存ロジック（TopN/ColorMap/opacity）に準拠。

有効時の優先順位（既存との整合）:
- 枠線太さは `outlineWidthResolver` があれば最優先。なければ `highlightTopN` の TopN に `highlightStyle.outlineWidth`、以外は `outlineWidth`。
- `outlineOpacity` はセカンダリ Box の `outlineColor.alpha` に適用。
- `voxelGap` は fill/outline の両方のベース寸法に適用された上で、`outlineInset` により outline 用にさらに縮小される。

境界条件:
- `outlineInset <= 0` で機能無効（従来どおり）。
- `outlineInset` は各軸寸法の最大 40% 程度まで（過度な縮小で枠線が重なり過ぎるのを防ぐ）→ 実装では軸毎に `effectiveInset = min(outlineInset, cellSize * 0.4)`。
- `wireframeOnly: true` の場合はセカンダリ Box を使わず、既存の単一 Box の `outline` を使用（インセット効果なし）。将来の最適化検討余地。

API 仕様（追加）:
```ts
interface HeatboxOptions {
  outlineInset?: number; // meters, default 0 (disabled)
}
```

## Consequences
メリット:
- 枠線が外縁で重なる問題をさらに軽減し、fill と線の分離により視認性が向上。
- 既存対策（voxelGap/outlineOpacity/TopN/resolver）と併用できる。

デメリット/コスト:
- エンティティ数が（fill + outline）で最大 2 倍になりうる。`maxRenderVoxels` の制約と併用し、パフォーマンスを管理する必要あり。
- カメラ距離や透過順序で見え方が変化し得る。特に fill が不透明だとインセット枠線は視認されにくい。

## Alternatives Considered
- Shader/Primitive ベースでのカスタム描画: 柔軟だが 0.1 系のスコープ外。将来の 0.4 系の検討事項。
- 既存 Box の outline を内側に寄せるパラメータ: Cesium Entity API に直接的な機能がない。
- `voxelGap` のみで対応: 接触は減るが「外縁ではなく内側に線を引く」という要件は満たせない。

## Acceptance Criteria
機能:
- outlineInset > 0 のとき、fill と独立したインセット枠線が描画される。
- TopN 強調・`outlineWidthResolver` がインセット枠線に期待どおり反映される。
- `outlineOpacity`/`voxelGap` を併用しても破綻しない。

パフォーマンス:
- 1000 ボクセル規模での描画時間がベースライン +50% 以内（セカンダリエンティティ追加のオーバーヘッド考慮）。
- メモリ使用量の顕著なリークなし（複数回描画/クリアで安定）。

テスト:
- 単体: インセット適用時の `box.dimensions`（outline用）が fill より小さいことを確認。
- 単体: `outlineOpacity` が alpha に反映、`outlineWidthResolver`/TopN 優先順位が期待どおり。
- 結合/例: Basic/Advanced でオン/オフ比較の視覚確認手順。

ドキュメント:
- API.md / Wiki Examples に `outlineInset` の用途・制約・優先順位の追記。
- Advanced に「インセット枠線オプション付き」例を追記（既存の overlap デモにチェック/スライダー追加）。

## Rollout Plan
- フラグはデフォルト OFF（0）。
- 0.1.7 で導入し、使用痕跡・フィードバックを踏まえて 0.2 系で改善可否を再評価。

