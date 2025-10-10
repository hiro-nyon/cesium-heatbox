# Cesium Heatbox リリースノート

## バージョン 0.1.15-alpha.4（2025-10-10）

**Phase 4 ドキュメント & 品質保証アップデート（プレリリース）**

### ハイライト
- **品質保証の自動化**: `test/integration/quality-assurance.test.js` を追加し、視認性・パフォーマンス・優先順位・エッジケースの受け入れ基準を網羅的にテスト。
- **ベンチマーク拡張**: `tools/benchmark.js` に適応制御専用メトリクスと `--adaptive` フラグを実装。CSV/Markdown/Console で一貫した指標を出力。
- **回帰テストスクリプト**: `tools/adr0011/phase4-baseline.js` で Phase 1 との比較レポートを自動生成し、性能劣化ゼロを確認。

### ドキュメント整備
- `wiki/Guides-Performance.md` に適応制御チューニングガイドを追加。
- `wiki/Troubleshooting.md` を全面刷新し、FAQ 10件・コード例を掲載。
- API リファレンスと主要クラスの JSDoc を日英併記へ整理、表レイアウトを修正。

### 不具合修正
- `utils/validation.js` で密度正規化時に発生し得た `RangeError` を修正。
- テスト補助コード（performance overlay mock）の lint 警告を解消。

---

## バージョン 0.1.15（2025-10-10）

**ADR-0011 Phase 4完了: 適応的表示の核・視認性最適化の仕上げ**

v0.1系における適応的可視化機能の完成版。Phase 0-3で実装された適応制御の基盤に対し、Phase 4ではドキュメント整備・ツール拡張・品質保証を実施し、**v1.0.0への移行準備を完了**しました。

### 主要な成果

#### ドキュメント強化
- **パフォーマンスガイド拡張**: `wiki/Guides-Performance.md` に適応制御のチューニングセクションを追加
  - データ特性の診断方法（密度分布・空間的偏り・Z軸解像度）
  - プロファイル選択の指針（4つの基本プロファイルの使い分け）
  - `adaptiveParams` の調整優先順位と視認性検証チェックリスト
  - 実用的なコード例3件（高密度都市データ・疎な広域データ・Z軸極小データ）

- **トラブルシューティング拡充**: `wiki/Troubleshooting.md` に適応制御FAQ 10項目を追加
  - 各項目200-300語の詳細解説（問題・原因・診断・解決策・関連リンク）
  - Before/Afterのコード比較で具体的な対処法を提示
  - よくある問題を網羅（重なり・Z軸潰れ・TopN埋もれ・カメラ距離・透明度・エミュレーション・パフォーマンス等）

#### ツール拡張
- **ベンチマークツール強化**: `tools/benchmark.js` に適応制御メトリクスを追加
  - 新規メトリクス: `denseAreaRatio`, `avgOutlineWidth`, `emulationUsage`, `overlapDetections`, `zScaleAdjustments`
  - `--adaptive` フラグで詳細出力に対応
  - CSV/Markdown/Consoleフォーマットすべてで適応制御メトリクスを出力

- **回帰テストスクリプト**: `tools/adr0011/phase4-baseline.js` を新規作成
  - 3つのデータパターン（dense/sparse/mixed）でベースラインメトリクスを測定
  - Phase 1との比較により性能劣化なし（全デルタ +0.000）を確認
  - ADR用のMarkdownテーブルを自動生成

#### テスト拡充
- **統合テスト強化**: `test/integration/quality-assurance.test.js` に適応制御の受け入れ基準テストを追加
  - 視認性要件（3パターンでの改善・TopN埋もれ防止・モード切替安定性）
  - 優先順位とクランプ（Resolver > Adaptive > Base、range境界値）
  - パフォーマンス要件（計算時間+15%以内・メモリ+10%以内・フレーム時間安定性±20%）
  - エッジケースとロバスト性（Z軸極小・重なり検出・range検証）
  - 既存機能との統合（プロファイル・レンダリングモード・emulationScope）

### 品質保証の完了
- **Lint errors 0**: 全ソースコードでlintエラーなし
- **Type-check pass**: TypeScript型チェック完全パス
- **Test pass**: 全テスト通過（240 passed, 1 skipped）
- **受け入れ基準達成**: ADR-0011の全項目（機能・パフォーマンス・品質・ドキュメント）を達成

### パフォーマンス検証
- Phase 4ベースライン測定により、Phase 1から性能劣化なし（全デルタ +0.000）を確認
- 適応制御の計算時間増加 ≤ +15%、メモリ使用量増加 ≤ +10%の要件を満たしていることを検証
- 1000-5000ボクセル規模でのフレーム時間安定性（±20%以内）を確保

### v1.0.0への移行準備
- ADR-0011の全Phase（0-4）が完了し、適応的表示機能の基盤が完成
- ドキュメント・ツール・テストが整備され、運用性が大幅に向上
- 次のステップ: v1.0.0で`classification.*`と`adaptiveParams.*Range`の補間を統合実装

---

## バージョン 0.1.13（2025-09-14）

緊急パッチ。非推奨としていた透明度リゾルバ（`boxOpacityResolver` / `outlineOpacityResolver`）が正規化段階で削除されるため、密度ベースの不透明度制御が使えないケースが発生していました。本バージョンでは、警告は維持しつつ削除せずに通過させることで、後方互換を復元します。

変更点
- validation: 正規化時に `boxOpacityResolver` / `outlineOpacityResolver` を削除せず、関数であればそのまま保持（非関数は警告の上で無効化）。
- docs: ROADMAP に「AdaptiveController による `adaptiveParams.boxOpacityRange`/`outlineOpacityRange` の実装が完成するまで、resolver を絶対に削除しない」強い方針を明記。

注意
- resolver は引き続き非推奨です。AdaptiveController 側での opacity range 実装完了・安定化が済むまでは削除しませんが、将来的には移行を推奨します。

## バージョン 0.1.10 - 安定化と移行準備（2025-01-XX）

### 🧭 方針転換
- ADR-0008 の全面的なリファクタリング案は実装複雑性のため中止し、ADR-0009（段階的な責務分離/SRP適用）へ方針転換しました。
- 本バージョンでは破壊的変更は行わず、非推奨化と代替APIの追加に留めます。

### 🔄 非破壊のAPI変更（移行準備）
- `fitViewOptions.pitch`/`heading` の代替として `pitchDegrees`/`headingDegrees` を追加（旧名は存続・警告のみ）
- `outlineRenderMode`（`standard`/`inset`/`emulation-only`）を追加。既存の `outlineEmulation` は引き続き利用可能（将来削除予定）
- 適応的制御のプリセット（`outlineWidthPreset` など）を強化。`boxOpacityResolver`/`outlineOpacityResolver` は非推奨化の対象としつつ存続
- 0.1.10 以前の移行ガイドは不要です（0.1.10 は破棄）。変更点は本リリースノートおよび ADR を参照してください。

### 🧪 品質・その他
- 安定化・ハードニング（ログ/バリデーションの改善）
- 既存の Examples/README を v0.1.10 の非破壊変更に追随（順次更新）

### 📌 次の予定（v0.1.11 以降）
- ADR-0009 に基づく段階的な責務分離（ColorCalculator/VoxelSelector/AdaptiveController/GeometryRenderer）
- 互換性を維持したまま `VoxelRenderer` をオーケストレーション役へ縮減
- 非推奨APIの削除は v0.1.11+ のメジャーでない範囲内で段階的に実施

---

## バージョン 0.1.5 - デバッグ/カラーマップ/TopN 強化（2025-08-25）

### 主要変更
- 新機能: `debug.showBounds` による境界ボックス表示の明示的制御（`debug` は boolean | object を許容）
- 新機能: 知覚均等カラーマップ `colorMap: 'viridis' | 'inferno'`、発散配色 `diverging`/`divergingPivot`
- 新機能: `highlightTopN` と `highlightStyle` による上位Nボクセルの強調表示
- 非推奨: `batchMode` をDeprecated（互換性のため受理するが無視、v1.0.0で削除予定）
- ドキュメント: README / API / Wiki を v0.1.5 内容に同期

### 技術ノート
- `VoxelRenderer` の色補間ロジックを拡張（カラーマップ/発散配色対応）
- バリデーションに `colorMap`/`highlightTopN` チェックを追加
- 型定義（types/index.d.ts）を v0.1.5 のオプションに更新

## バージョン 0.1.4 - 自動ボクセルサイズとドキュメント整備（2025-08-24）

### 主要変更
- 新機能: `autoVoxelSize` によるボクセルサイズ自動決定（`voxelSize` 未指定時）
- 統計/デバッグ拡充: `HeatboxStatistics` と `getDebugInfo()` に自動調整の詳細（`autoAdjusted`, `originalVoxelSize`, `finalVoxelSize`, `adjustmentReason`, `autoVoxelSizeInfo`）を追加
- 仕様明確化: 実描画寸法に各軸の実セルサイズ `cellSizeX/Y/Z` を使用する旨を明記
- ドキュメント: API/Getting Started/Examples/Wiki を v0.1.4 内容に同期

### 技術ノート
- ゼロ除算安全化とグリッド実セル寸法の導入により、隣接ボクセルの重なりを解消
- `validation.js` に `estimateInitialVoxelSize()` と `calculateDataRange()` を実装

---

## バージョン 0.1.3 - 安定化とUX改善（2025-08-23）

### 主要変更
- Fixed: 選択イベント情報の不一致修正、統計値の整合性、ピック判定のキー取得、未使用コード削除
- Changed: 型定義生成の整合、デバッグログ抑制（`debug`/`NODE_ENV`）、`DEFAULT_OPTIONS.debug = false`、Debug境界ボックス制御
- Added: 基本例のUX改善（UMD対応、日本語UI、Debug切替）、高度な例のUMD対応、Wiki API更新
- Technical: JSDoc HTML再生成、バージョン更新、Lint 0件

---

## バージョン 0.1.2 - 表現機能の追加（2025-08-20）

### 主要変更
- Added: `wireframeOnly`・`heightBased`・`outlineWidth` の導入と対応UI/サンプル
- Changed: 重なったボクセルの視認性改善、ドキュメント整備
- Fixed: ESLintエラー修正、削除APIの置換、テスト更新

---

## バージョン 0.1.1 - エンティティベース実装への移行

### 主な変更点

#### 1. レンダリングエンジンの変更
- **Primitiveベースから Entityベースへの移行**
  - より安定した描画を実現
  - Cesium サポートバージョン (1.120+) と完全互換

#### 2. パフォーマンス最適化
- **エンティティ数の自動制限**
  - `maxRenderVoxels` オプションによる制御（デフォルト: 300）
  - 高密度領域を優先的に表示

#### 3. 視認性の向上
- **アウトラインと色の最適化**
  - 半透明表示によるデータの重なりの可視化
  - クリック可能な詳細情報表示

### 推奨設定

```javascript
const options = {
  voxelSize: 25,            // ボクセルサイズ (メートル)
  opacity: 0.7,             // ボクセルの不透明度
  showOutline: true,        // アウトラインの表示
  showEmptyVoxels: false,   // 空のボクセルは表示しない
  maxRenderVoxels: 300,     // 表示上限数
};
```

### 既知の問題
- 非常に大量のエンティティ（数万以上）がある場合、表示に時間がかかることがあります
- 範囲が非常に広い場合、ボクセルサイズの自動調整が必要な場合があります

### 今後の予定
- WebGL シェーダーベースのレンダリング実装の検討
- データのリアルタイム更新のサポート
- ボクセルの時間変化アニメーション機能
