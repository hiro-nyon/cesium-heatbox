# CesiumJS Heatbox - Roadmap

> このロードマップは四半期ごとに見直します。最新の進捗は GitHub Issues / Projects を参照してください。  
本計画は「0.1で完結できるもの」と「0.2/0.3以降でなければ難しいもの」を切り分け、各バージョンのスコープ・受け入れ基準・互換性影響を明確化します。

---

## 0.1 系（安定化フェーズ）

### v0.1.8（完了: 2025-08-30）- 多言語ドキュメント対応
- 追加: 英語/日本語バイリンガルドキュメント体系、国際化対応README/Wiki
- 改善: ドキュメント構造統一、API説明の詳細化
- ドキュメント: 完全バイリンガル対応、開発ガイド充実

### v0.1.9（短期・品質向上）- ハードニング＋適応的可視化の第一歩
Priority: High | Target: 2025-09
- Scope（Playground発見の2課題に対処: 表示の疎化/カメラ不整合）
  - [ ] 適応的レンダリング制限（オプトイン）
    - 実装: `renderLimitStrategy: 'density'|'coverage'|'hybrid'` を追加（デフォルトは既存の `'density'`）。
    - 併用設定: `minCoverageRatio`（0–1, デフォルト: 0.2）, `coverageBinsXY`（自動/手動ビン数）で疎領域も拾う層化抽出を実装。
  - [ ] 自動ボクセルサイズ決定の強化（オプトイン）
    - 実装: `autoVoxelSizeMode: 'basic'|'occupancy'` を追加（デフォルト `'basic'`）。
    - `occupancy` は期待占有セル数 E[occupied] ≈ M·(1-exp(-N/M)) を用い、`maxRenderVoxels` と `targetFill`（デフォルト: 0.6）に整合するサイズを反復近似。
    - 責務分離: 自動ボクセルサイズは「初期グリッド決定専用」。既定ではグリッド再構築は行わず、可視化の適応は“選抜（renderLimitStrategy）側”で行う。
  - [ ] スマート視覚化支援（オプトイン）
    - 実装: `autoView: false` と `fitView(bounds, options)` を公開。`fitView` はデータ境界に対し、ピッチ/視野角を考慮した高度を自動計算（もしくは `Camera.flyToBoundingSphere` を利用）。
  - [ ] 端末依存の自動レンダリング上限（Auto Render Budget）
    - 実装: `maxRenderVoxels: number|'auto'`（または `renderBudgetMode: 'manual'|'auto'`）。
    - 指標: WebGL対応/上限、`navigator.deviceMemory`（Chrome系のみ）/`hardwareConcurrency`/`devicePixelRatio` などから端末ティア（低/中/高）を推定。`deviceMemory` 未対応時は `hardwareConcurrency` と画面解像度を主指標とするフォールバック。
    - 連携: 戦略（density/coverage/hybrid）はユーザー選択のまま、描画上限（`maxRenderVoxels`）のみ自動初期化（以下「上限K」）。占有率モードとも併用可能。
  - [ ] ハードニング/テスト
    - Lint 0 errors、`VoxelRenderer` 選択戦略の単体テスト追加、`Heatbox.updateOptions` 再描画確認。
    - 例（Basic/Advanced）の初期設定/文言を新フラグに追随。
- Deliverables
  - [ ] `renderLimitStrategy` + `minCoverageRatio` + `coverageBinsXY`（後方互換: 既定は従来通り）
  - [ ] `autoVoxelSizeMode: 'occupancy'` + `autoVoxelTargetFill`（推奨値0.6）
  - [ ] `Heatbox.fitView(bounds, { paddingPercent, pitch, heading, altitudeStrategy })` と `options.autoView`
  - [ ] Auto Render Budget: `maxRenderVoxels: 'auto'`（または `renderBudgetMode: 'auto'`）で端末ティア別の初期上限を自動設定
  - [ ] Debug/統計: `selectionStrategy`, `clippedNonEmpty`, `coverageRatio` に加え、`renderBudgetTier`, `autoMaxRenderVoxels` を `getStatistics()` に追加
  - [ ] Docs: Playground既知課題と解法（設定例つき）をチューニングFAQへ追記
  - [ ] 追加テスト: 選択戦略（密度/層化/ハイブリッド）のサンプル再現, `updateOptions` の再描画分岐
- Acceptance Criteria
  - [ ] 疎密混在データで `maxRenderVoxels` を 300 にしても、`renderLimitStrategy: 'hybrid'` で低密度セルが可視化に最低限含まれる（`coverageRatio ≥ 0.3`）
  - [ ] `autoVoxelSizeMode: 'occupancy'` 有効時、`renderedVoxels / maxRenderVoxels` が 0.4–0.8 に収まり、過剰トリミングが抑制される
  - [ ] `autoView: true` でデータ境界が10%パディング付きで確実にフレーム内に収まる（ピッチ-30°でも欠落なし）
  - [ ] Auto Render Budget: `'auto'` 指定時に低ティア端末で `autoMaxRenderVoxels ≤ 12,000`、高ティア端末で `autoMaxRenderVoxels ≥ 40,000`（いずれも `PERFORMANCE_LIMITS.maxVoxels` 以下）
  - [ ] Lint 0 errors, 追加テスト緑、Basic/Advanced が初期状態で正常動作
- Out-of-Scope
  - コアレンダラ大改修（Primitive化等, 0.4以降）
- Risks & Mitigations
  - 選択戦略のばらつき → ハイブリッド（TopK by density + 層化サンプル）で安定化、`debug` で比率を可視化
  - カメラ適合の端ケース → `flyToBoundingSphere` をFallbackに用意

### v0.1.10（リファクタリング・モジュール化）- Refactoring & Modularization
Priority: High | Target: 2025-10

- Scope（挙動非変更・内部構造の整理）
  - [ ] 選択戦略の分離: `src/core/selection/` に density/coverage/hybrid を分割しIF化
  - [ ] 近似/推定の分離: `src/utils/voxelSizeEstimator.js`（basic/occupancy）を新設
  - [ ] 端末ティア検出の分離: 既存の `src/utils/deviceTierDetector.js`（Auto Render Budget計算）のI/F整備と再利用
  - [ ] 視点合わせの分離: `src/utils/viewFit.js` と `Heatbox.fitView()` の連携
  - [ ] options正規化の抽出（任意）: `src/utils/options/normalize.js` に新オプション検証を移管
  - [ ] 既存API/挙動は不変（Public API/既存オプション名は変更しない）
- Deliverables
  - [ ] `VoxelRenderer` から選択戦略ロジックを戦略層へ移動（densityで先行、続いてcoverage/hybrid）
  - [ ] `Heatbox.setData()` 後段で選択メタの統計反映（`selectionStrategy`/`clippedNonEmpty`/`coverageRatio`）
  - [ ] `estimateByOccupancy()` の独立化と `Heatbox` からの呼び出し
  - [ ] `maxRenderVoxels: 'auto'` の解決を `deviceTierDetector` で実装
  - [ ] JSDoc/型注釈の整備（公開関数）＋ファイル長の縮小（目標: 200–350行/ファイル）
  - [ ] 単体テストの再配置（selection/estimator/tierDetector/viewFit）
- Acceptance Criteria
  - [ ] 既存のExamples/テストがすべてグリーン（挙動差分なし）
  - [ ] ファイル分割が完了し、主要ファイルが目標行数内に収まる（例: `VoxelRenderer.js` < 350行）
  - [ ] Lint 0 errors、型/JSdocが主要モジュールに付与されている
  - [ ] CI時間/ビルドに顕著な退行がない（±10%以内）
- Risks & Mitigations
  - 大規模移動による衝突 → 小PR分割（戦略→推定→予算→視点の順）と即時レビュー
  - 回帰リスク → 既存Examples/テストでのスナップショット・差分確認を強化

### v0.1.11（観測可能性・プロファイル）- Observability & Profiles
Priority: Medium | Target: 2025-11
- Scope
  - [ ] Advanced に簡易パフォーマンスオーバーレイ（描画数/TopN比率/平均密度/フレーム時間）
  - [ ] ベンチ計測の整備（`npm run benchmark` の出力整形としきい値表示）
  - [ ] Docs: チューニングFAQの追補（計測の読み方/指標の目安）
  - [ ] 設定プロファイル機能（ユースケース別の推奨セット）
  - [ ] Auto Quality（任意拡張）: `qualityMode: 'manual'|'auto'`, `targetFPS` 等で“選抜側のつまみ（K/比率/戦略）”のみを実測FPSに応じて微調整（グリッド再構築は既定で行わない）
- Deliverables
  - [ ] `examples/advanced/` にオーバーレイUI（ON/OFF）
  - [ ] `tools/benchmark.js` の改善（集計とCSV/markdownサマリ）
  - [ ] ドキュメント: パフォーマンスの見方/ボトルネック傾向
  - [ ] ブラウザ互換のスモークテスト（CIでの最小限の起動確認/レンダラ初期化）
  - [ ] `profile: 'mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data'` を `validateAndNormalizeOptions` でマージ適用（ユーザー設定が最終優先）
  - [ ] Auto Quality連携: `targetFPS` 達成のために `maxRenderVoxels`/`minCoverageRatio`/`renderLimitStrategy` をヒステリシス付きで微調整するサンプル実装
- Acceptance Criteria
  - [ ] オーバーレイのON/OFFで目視確認でき、描画数とフレーム時間が相関して表示される
  - [ ] ベンチ出力が再現可能で、PRで差分比較が容易
  - [ ] `profile` 指定で、同一データに対し一貫した設定セットが適用される（例: `mobile-fast` で `opacity`/`highlightTopN`/`renderLimitStrategy` が想定値）
- Out-of-Scope
  - 新規描画バックエンド（0.4 系で検討）
- Risks & Mitigations
  - 計測のばらつき → 複数回平均/サンプル数と偏差の表示

### v0.1.12（適応的表示の核）- 視認性最適化の仕上げ
Priority: Medium | Target: 2025-12

- コア機能（仕上げ・検証）
  - [ ] 適応的制御のパラメータチューニングとデフォルト見直し（`adaptiveParams`/プリセットの係数微調整）
  - [ ] エッジケースの最適化：`emulation-only` と `inset`/`standard` の切り替え条件、隣接重なり時の線の視認性
  - [ ] 解像度差（`cellSizeZ` が極小など）の安定化（下限クランプ/積み上げ規則の見直し）
- UI/Examples
  - [ ] 密度パターン生成（格子/群集/疎）の追加プリセットで効果を可視化
  - [ ] パフォーマンス可視化オーバーレイ（描画数/TopN比率/平均密度）
- Docs/Wiki
  - [ ] ガイド: チューニング手順（密集/疎/遠景の推奨値、TopN併用の勘所）
  - [ ] FAQ: 重なり/ちらつき時の対処（voxelGap/outlineOpacity/inset/エミュの使い分け）
- パフォーマンス/品質
  - [ ] 1000〜5000ボクセル規模のフレーム時間を収集し、しきい値を可視化（Advanced/perf例でのマイクロベンチ）
  - [ ] 単体: インセット寸法クランプ/アウトライン優先順位/透明度resolverの境界値テスト
  - [ ] メモリ安定（複数回描画/再設定でリークなし）
  - [ ] 受け入れ基準：密集・疎・混在パターンで視認性が一律太さ/固定透明度より改善、TopN/選択が埋もれない
  - [ ] 受け入れ基準：アウトライン描画モード（`standard`/`inset`/`emulation-only`）の切替が安定
  - [ ] 受け入れ基準：カスタム透明度リゾルバ（box/outline）併用時の優先順位・クランプが一貫

> 注: 0.1系では「コアのデータモデル変更や新レイヤー」は行わず、安定化と利用性向上に限定します。

#### 0.1 Exit Criteria（0.2 への移行基準）
- [ ] Lint 0 errors、主要分岐に単体テストが存在（Heatbox/VoxelRenderer/Validation）
- [ ] Examples（Basic/Advanced）が主要機能（TopN/インセット/エミュ/適応制御）の動作確認に十分
- [ ] Docs/Wiki がバイリンガルで同期（API/FAQ/チューニング/運用）
- [ ] ベンチ指標（代表データ）のベースライン化と目安（例: 1000ボクセル規模で安定60FPS、5000規模で操作可能）

---

## 0.2 系（機能拡張フェーズ）

### v0.2.0 - 分類スキームと凡例（連続/離散）
Priority: High | Target: 2025-12
- 分類スキーム（最小セット）
  - [ ] linear（既定）、log（log10/2）、equal-interval、quantize、threshold（custom thresholds）
  - [ ] quantile、jenks（ckmeans）
  - [ ] 適用対象: 色（color）に加えて、透明度（opacity）にも適用（fill と outline の双方）
  - [ ] API例: 
    - `classification: 'linear'|'log'|'equal-interval'|'quantize'|'threshold'|'quantile'|'jenks'`
    - `classes?: number`, `thresholds?: number[]`, `discrete?: boolean`
    - `classificationTargets?: { color?: boolean; opacity?: boolean }`（既定: color=true, opacity=false）
    - `opacityStops?`/`opacityRange?` など連続/離散の指定（0–1にクランプ）
- 凡例/ガイド
  - [ ] 連続/離散に応じたラベル・境界値表示（必要に応じて透明度の示唆も表現）
  - [ ] TopN・diverging との整合（分類と強調の優先順位）
  - [ ] ドキュメントに「色のみ/色+透明度」両パターンの例とベストプラクティスを追記
- 実装方針
  - 既存ライブラリの活用（d3-array/d3-scale/simple-statistics 等）を優先。バンドルサイズ配慮のためユーティリティ部品のみ導入。
- 互換性: 低（新オプション追加のみ、既存デフォルト維持）。
- 受け入れ基準:
  - [ ] 代表データで各分類が視覚的に区別でき、凡例/ガイドが同期表示される。
  - [ ] 透明度分類を有効化した場合、fill/outline（標準/インセット/エミュ）に0–1で正しく反映される。
  - [ ] 適応的透明度（resolver）と併用時の優先順位（分類→resolver もしくは resolver→分類）を明示し、挙動が一貫。

- 設定プリセット管理（新規）
  - [ ] 設定プリセットのインポート/エクスポート（JSON）
  - [ ] シナリオ別推奨セット（密集データ/広域表示/TopN重視 など）
  - [ ] UI設定の永続化（localStorage）

### v0.2.1 - 時間依存データ（PoC）
Priority: Medium | Target: 2026-01
- [ ] `viewer.clock.currentTime` に基づく時刻評価・スライス描画（ステップ更新）
- [ ] キャッシュ/再計算ポリシーの基本設計（時間次元の増加コスト抑制）
- 互換性: 低（オプション追加）。
- 受け入れ基準: サンプルで時刻操作に応じてボクセルが更新され、体感カクつきが許容範囲内。

### v0.2.2 - メモリ/パフォーマンス最適化
Priority: Medium | Target: 2026-02
- [ ] 必要フィールドのみ保持（エンティティ配列の縮約）
- [ ] 描画リストの再利用・差分更新
- [ ] 描画優先度制御（重要ボクセル優先）
- [ ] 動的LoD（Level of Detail）
- [ ] ビューポートカリング最適化
- 互換性: 変更なし（内部最適化）。

---

## 0.3 系（高度可視化フェーズ）

### v0.3.0 - スライス/深度フェード/フォーカス
Priority: Medium | Target: 2026-04
- [ ] スライス表示（X/Y/Z 平面での断面）
- [ ] 深度フェード（カメラ距離に応じた不透明度）
- [ ] フォーカス・コンテキスト（近傍強調・周辺減衰）
- 互換性: 中（新API追加）。

### v0.3.1 - ROI/ローカルヒストグラム
Priority: Medium | Target: 2026-05
- [ ] 3Dボックス/ポリゴンでの範囲選択（ROI）
- [ ] ROI内分布のローカルヒストグラムとカラーマップ連動

### v0.3.2 - MIP風投影/動的TopN
Priority: Low | Target: 2026-06
- [ ] 最大値投影（MIP）サマリ表示
- [ ] 時間変化に同期した動的TopN演出

---

## 0.4 系（アーキテクチャ強化）

### v0.4.0 - レンダリング基盤の拡張（実験的）
Priority: Low | Target: 2026 H2
- [ ] Primitiveベース描画（実験的）を `renderBackend: 'entity'|'primitive'` フラグで選択可能に（デフォルトはentity）
- [ ] 座標変換の精度向上（高緯度・広域向けの ENU/ECEF 段階移行の調査）
- 互換性: 大（内部構造の変更。デフォルトは既存維持）

### v0.4.1+ - 応用表現/出力
- [ ] 2.5Dカラム/六角ビニング（応用表現）
- [ ] 静的LoD事前計算
- [ ] 3D Tiles出力

---

## 1.0.0（メジャー）

Priority: Future | Target: TBD
- [ ] レガシー削除（`batchMode`削除 ほか）
- [ ] しきい値面（等値面; Marching Cubes）
- [ ] 高度な統計分析/監視
- 互換性: 破壊的変更を伴う可能性

---

## 継続タスク（全バージョン）

- テスト強化: VoxelRenderer分岐網羅、`updateOptions` の再描画分岐、ピック判定の実機整合
- ドキュメント保守: 各バージョン機能の同期、例の継続更新、API仕様の一貫性
- 品質ゲート: Lintエラーゼロ、主要モジュールの基本分岐をカバー
 - DevX向上: TypeScript型定義の完全化、ブラウザDevTools連携、ホットリロード対応の開発サーバー

---

## コントリビューション

議論や提案は Discussions / Issues / Projects へ。状況に応じて調整します。
