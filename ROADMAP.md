# CesiumJS Heatbox - Roadmap

> このロードマップは四半期ごとに見直します。最新の進捗は GitHub Issues / Projects を参照してください。  
本計画は「0.1で完結できるもの」と「1.x/2.x以降でなければ難しいもの」を切り分け、各バージョンのスコープ・受け入れ基準・互換性影響を明確化します。

> バージョニング方針変更（2025-09）
> - これまで「0.2.x」で計画していた機能群は「1.x」へ移行します。
> - メジャー: 破壊的変更（1.0.0）/ マイナー: 機能追加（1.1.0, 1.2.0, ...）/ パッチ: バグ修正（1.0.1, 1.0.2, ...）。
> - 旧記述「0.2.x」「0.3.x」「0.4.x」は順次「1.x」「2.x」「3.x」へ読み替えてください（記載更新中の箇所あり）。

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
  - コアレンダラ大改修（Primitive化等, 3.x以降）
- Risks & Mitigations
  - 選択戦略のばらつき → ハイブリッド（TopK by density + 層化サンプル）で安定化、`debug` で比率を可視化
  - カメラ適合の端ケース → `flyToBoundingSphere` をFallbackに用意

### v0.1.10（中止・破棄）- Cancelled
Status: Cancelled | Reason: ADR-0009 により計画を置換

- 概要
  - ADR-0009（VoxelRendererの責務分離/SRP適用）の採択に伴い、v0.1.10 で予定していたリファクタリング案（ADR-0008）は方針不一致と判断し中止しました。
  - v0.1.10 の実装は破棄し、バージョン自体もスキップします。
  - リファクタリングは v0.1.11 に移管し、以降の 0.1 系計画を1バージョン後ろ倒しにします。
- 参考
  - docs/adr/ADR-0008-v0.1.10-refactor-and-api-cleanup.md（Superseded by ADR-0009）
  - docs/adr/ADR-0009-voxel-renderer-responsibility-separation.md

### v0.1.11（リファクタリング・モジュール化）- Refactoring & Modularization
Priority: High | Target: 2025-11

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

### v0.1.12（APIクリーンアップ＋観測可能性）- API Cleanup & Observability
Priority: Medium | Target: 2026-01
- Scope
  - [API Cleanup（Breaking含む）]
    - オプション名の統一: `fitViewOptions.pitch`/`heading` → `pitchDegrees`/`headingDegrees`（旧名削除）
    - `outlineEmulation` → `outlineRenderMode: 'emulation-only'` に集約
    - Resolver系の削除: `outlineWidthResolver`/`outlineOpacityResolver`/`boxOpacityResolver`
    - 代替: `outlineWidthPreset` + `adaptiveOutlines` + `adaptiveParams`
    - `types/` と README/Wiki の更新、`MIGRATION.md` に移行手順を掲載
  - [Observability/Profiles]
  - [ ] Advanced に簡易パフォーマンスオーバーレイ（描画数/TopN比率/平均密度/フレーム時間）
  - [ ] ベンチ計測の整備（`npm run benchmark` の出力整形としきい値表示）
  - [ ] Docs: チューニングFAQの追補（計測の読み方/指標の目安）
  - [ ] 設定プロファイル機能（ユースケース別の推奨セット）
  - [ ] Auto Quality（任意拡張）: `qualityMode: 'manual'|'auto'`, `targetFPS` 等で“選抜側のつまみ（K/比率/戦略）”のみを実測FPSに応じて微調整（グリッド再構築は既定で行わない）
- Deliverables
  - [ ] `MIGRATION.md` 更新（0.1.9 → 0.1.11 → 0.1.12）とWiki「Migration」への同期
  - [ ] `types/` 更新（削除・名称統一を反映）
  - [ ] `examples/advanced/` にオーバーレイUI（ON/OFF）
  - [ ] `tools/benchmark.js` の改善（集計とCSV/markdownサマリ）
  - [ ] ドキュメント: パフォーマンスの見方/ボトルネック傾向
  - [ ] ブラウザ互換のスモークテスト（CIでの最小限の起動確認/レンダラ初期化）
  - [ ] `profile: 'mobile-fast'|'desktop-balanced'|'dense-data'|'sparse-data'` を `validateAndNormalizeOptions` でマージ適用（ユーザー設定が最終優先）
  - [ ] Auto Quality連携: `targetFPS` 達成のために `maxRenderVoxels`/`minCoverageRatio`/`renderLimitStrategy` をヒステリシス付きで微調整するサンプル実装
- Acceptance Criteria
  - [ ] 0.1.12 API に対して README/型/Wiki が整合し、`MIGRATION.md` に置換表・コード例が掲載
  - [ ] オーバーレイのON/OFFで目視確認でき、描画数とフレーム時間が相関して表示される
  - [ ] ベンチ出力が再現可能で、PRで差分比較が容易
  - [ ] `profile` 指定で、同一データに対し一貫した設定セットが適用される（例: `mobile-fast` で `opacity`/`highlightTopN`/`renderLimitStrategy` が想定値）
- Out-of-Scope
- 新規描画バックエンド（3.x 系で検討）
- Risks & Mitigations
  - 計測のばらつき → 複数回平均/サンプル数と偏差の表示

### v0.1.13-v0.1.14（緊急パッチ・後方互換性）
Priority: Immediate | Target: 2025-09-14

Scope（resolver の互換性維持と方針の明記）
- [x] validation: `boxOpacityResolver` / `outlineOpacityResolver` を正規化時に削除しない（非推奨の警告は出す）。
- [x] ドキュメント更新：以下の強い方針を明記。
  - 「AdaptiveController における `adaptiveParams.boxOpacityRange` / `outlineOpacityRange` の実装が完了し、安定版へ載るまで、resolver を絶対に削除しない（normalize で消さない）。」
  - 「resolver の廃止は、その代替（AdaptiveController 側の連続/離散の opacity 制御）が提供・検証・ドキュメント化された後にのみ実施する。」

Acceptance Criteria
- [x] Playground/Quick Start など既存の resolver 依存フローで密度ベースの不透明度が機能する。
- [x] Console に deprecation 警告は出るが、機能は維持される。

Risks & Mitigations
- v1.0.0 のAPI整理との整合: 将来的な削除は「Adaptive 実装完了後」へ明確化。利用者に段階的移行を促す（MIGRATION.md も追記）。

### v0.1.15（適応的表示の核）- 視認性最適化の仕上げ
Priority: Medium | Target: 2026-02

- コア機能（仕上げ・検証）
  - [ ] **Phase 0（先行）**: 正規化/既定値の整備
    - minOutlineWidth/maxOutlineWidth → outlineWidthRange への統一
    - adaptiveParams.overlapDetection の既定値追加（既定: false）
    - 優先順位（Resolver > Adaptive > Base）の仕様テスト（rangeクランプ含む）
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
  - [ ] 新機能有効時の計算時間増加 ≤ +15%（既存比）
  - [ ] メモリ使用量の増加 ≤ +10%（既存比）
  - [ ] 1000–5000ボクセル規模でのフレーム時間安定性（±20%以内）

#### v0.1.15の非目標（v1.1.0へ延期）
- opacity/width の classification 連携
- resolver の完全置き換え（削除は v1.x 以降の段階的対応）

#### Phase間のマージ基準
- Phase 0→1: validation/正規化の単体テストが100%パス
- Phase 1→2: 新デフォルト値での視覚的回帰テスト（3データセット）が承認
- Phase 2→3: エッジケーステスト（Z軸極小・高密度重なり）が緑
- Phase 3→4: Advanced Examplesが白画面/エラーなく動作
- Phase 4→main: 全受け入れ基準を満たし、リリースノート/移行ガイド完成

> 注: 0.1系では「コアのデータモデル変更や新レイヤー」は行わず、安定化と利用性向上に限定します。


### v1.0.0 — 最小の分類エンジン（colorのみ）
Priority: High | Target: 2025-12

- 分類スキーム（最小セット）
  - [ ] `linear`（既定）, `log`, `equal-interval`, `quantize`, `threshold`
  - ※ `quantile` と `jenks` は v1.1.0 に移行（本版では未対応）
- 適用対象
  - [ ] **color のみ**に分類を適用（`classificationTargets` は将来互換のため受付けるが、1.0.0では `color:true` のみ有効）
  - [ ] `opacity` / `width` への適用は行わない（v1.1.0で対応）
- API例
  - `classification: 'linear'|'log'|'equal-interval'|'quantize'|'threshold'`
  - `classes?: number`, `thresholds?: number[]`
  - `classificationTargets?: { color?: boolean }`（1.0.0時点では `color` 以外は無視）
- 実装方針
  - `src/utils/classification.js` に最小スキームを実装
  - `AdaptiveController` は **色スケールにのみ**分類を適用。`opacity/width` には一切触れない
  - 既存 Resolver（`boxOpacityResolver`/`outlineOpacityResolver`/`outlineWidthResolver`）は**存続**（警告のみ）
- 互換性
  - 低（新オプション追加のみ）。既存デフォルトの色挙動は実質維持
- 受け入れ基準
  - [ ] 既存の例とテストが設定変更なしで動作（色のデフォルト見た目に退行がない）
  - [ ] 5スキームで**色分布が仕様通り**（単体＆スナップショットテスト）
  - [ ] パフォーマンス退行が ±10% 以内
- Docs
  - [ ] `MIGRATION.md`：旧Resolver→**color分類**の最小マッピング例を掲載（opacity/widthは次版で案内）
  - [ ] README/Wiki：`classification` の基本と制限（colorのみ有効）を明記

### v1.1.0 — 視覚パリティ拡張（opacity/width＋凡例）
Priority: High | Target: 2026-01

- 適用対象の拡張
  - [ ] `classificationTargets` を `opacity` / `width` に拡張
  - [ ] `adaptiveParams.boxOpacityRange` / `outlineOpacityRange` / `outlineWidthRange` を **分類と同期して補間**
  - [ ] `TopN` ブーストとの合成仕様を明文化（優先順位・クランプを定義）
- 分類スキームの補完
  - [ ] `quantile`, `jenks` を追加（v1.0.0で未対応だった高度スキーム）
- エミュレーション連携
  - [ ] `outlineRenderMode: 'emulation-only'` 時の**エミュレーション・フック**を実装（最終α/太さをポリラインへ反映）
- 凡例/ガイド
  - [ ] 連続/離散に応じた凡例 UI（境界値・バー表示）、色＋透明度の表現ガイド
- 実装方針
  - `AdaptiveController` が color/opacity/width を**同一のclassificationユーティリティ**で補間
  - `src/utils/classification.js` を color/opacity/width で共用（将来の `gamma`/`easing` 拡張を想定）
  - Implementation Notes
    - `src/core/adaptive/AdaptiveController.js`
      - `calculateAdaptiveParams(...)` にて、`statistics` から算出される `normalizedDensity` を用い、
        - `adaptiveParams.boxOpacityRange: [min, max]` に従って `boxOpacity` を補間して設定。
        - `adaptiveParams.outlineOpacityRange: [min, max]` に従って `outlineOpacity` を補間して設定。
        - `adaptiveParams.outlineWidthRange: [min, max]`（新設）に従って `outlineWidth` を補間して設定（TopN時の加算ブーストも許容）。
        - 補間のロジックは v1.0.0 の分類（classification）と同期させる：
          - 既定は linear だが、`classification` の設定が有効な場合は同じスキーム（log/equal-interval/quantize/threshold/quantile/jenks 等）で opacity/width にも適用。
          - 実装は共通ユーティリティ（`src/utils/classification.js`）を用い、色・透明度・太さの補間ソースを統一する。
          - 任意で `gamma` や `easing` を導入し、連続補間の特性を統一的に調整できるようにする。
      - 必要に応じて `applyPresetLogic(...)` の戻り値とレンジ適用の優先順位を整理（レンジ優先→プリセット補正、もしくは逆）。
    - `src/core/VoxelRenderer.js`
      - 既存の `adaptiveParams.boxOpacity || options.opacity` をそのまま利用（AdaptiveController が最終値を入れる）。
      - outline 側も `adaptiveParams.outlineOpacity` を優先的に使用。
- 互換性
  - 低（オプション追加）。既存デフォルトは維持、Resolver は**存続**（警告のみ）
- Policy（重要・強い方針）
  - 上記の AdaptiveController での opacity range 実装が完了し、安定版に含まれるまでは、`boxOpacityResolver` / `outlineOpacityResolver` を絶対に削除しない（正規化で消さない）。
  - 削除の判断は、実装・検証・ドキュメント（MIGRATION.md/RELEASE_NOTES.md）のすべてが揃った後に行う。
- 受け入れ基準（視覚パリティ）
  1) 密度→ボックス不透明度（低密度：薄／高密度：濃）  
  2) 密度→枠線透明度（`emulation-only` 含む）  
  3) 密度→枠線太さ（`TopN` は加算ブースト）  
  4) `TopN` による不透明度切替  
  → 旧Resolver実装と**視覚パリティ**を達成（比較スクリーンショット同梱）
  - [ ] 代表データで各分類が視覚的に区別でき、凡例/ガイドが同期表示される。
  - [ ] 透明度分類を有効化した場合、fill/outline（標準/インセット/エミュ）に0–1で正しく反映される。
  - [ ] 適応的透明度（resolver）と併用時の優先順位（分類→resolver もしくは resolver→分類）を明示し、挙動が一貫。
- Docs / 移行
  - [ ] `MIGRATION.md`：Resolver→`adaptiveParams.*Range`/`classificationTargets` の**対応表**を掲載（視覚比較あり）
  - [ ] README/Wiki：凡例UIとベストプラクティス
- 設定プリセット管理（新規）
  - [ ] 設定プリセットのインポート/エクスポート（JSON）
  - [ ] シナリオ別推奨セット（密集データ/広域表示/TopN重視 など）
  - [ ] UI設定の永続化（localStorage）

---

Resolver 置き換え計画（v1.1.0で「別の形ですべて再実装」）

目的
- 既存の Resolver API（`outlineWidthResolver` / `outlineOpacityResolver` / `boxOpacityResolver`）で可能だった表現力を、宣言的で最適化しやすい新APIに置き換える。
- パフォーマンス（関数呼び出し頻度の削減）と一貫性（UI/プロファイル/チューニングとの連携）を高める。

設計（新API）
- Adaptive Ranges（連続制御）
  - `adaptiveParams.boxOpacityRange: [min, max]`
  - `adaptiveParams.outlineOpacityRange: [min, max]`
  - `adaptiveParams.outlineWidthRange: [min, max]`（新設）
  - いずれも `normalizedDensity` に対する線形補間（将来的に `gamma` 係数や `easing` を追加検討）。
- Classification（離散/連続の分類マップ）
  - v1.0.0 の `classification.*` と連携し、色だけでなく透明度/太さにも適用可能にする。
  - `classificationTargets: { color?: boolean; opacity?: boolean; width?: boolean }` を導入（デフォルト: colorのみ）。
- Emulation Hook（エミュレーション時の後処理）
  - `outlineRenderMode: 'emulation-only'` のとき、内部的にポリラインへ最終アルファ/太さを反映する軽量フックを設ける（Playgroundの後処理と同等の効果をライブラリ側に統合）。

実装箇所
- `src/core/adaptive/AdaptiveController.js`：range補間・TopN加算ロジックの中心。
- `src/core/VoxelRenderer.js`：AdaptiveController が計算した最終値をそのまま使用（条件分岐の簡素化）。
- `src/utils/validation.js`：新オプションの正規化・クランプ（0–1 / >0 の安全域）。
- `src/utils/classification.js`（新規）：分類スキーム実装（linear/log/quantile 等の薄いユーティリティ）。

互換性
- v1.0.0 までは Resolver API を「警告のみで存続」。移行ガイドに従い新APIへ移してもらう。
- v1.x（将来的に v2.0.0 で完全削除）で Resolver API を段階的に削除（ロードマップとリリースノートで事前告知）。

受け入れ基準（パリティテスト）
- 旧Resolverで実現していた代表シナリオで視覚的パリティ：
  1) 密度ベースのボックス不透明度（低密度:薄 / 高密度:濃）
  2) 密度ベースの枠線透明度（emulation-only を含む）
  3) 密度ベースの枠線太さ（TopNは加算ブースト）
  4) TopNベースの不透明度切替
- Playground/Quick Start で実データを用いた比較スクリーンショットを添付し、差分が許容範囲に収まる。

移行ガイド（MIGRATION.md 追記）
- 旧: `*Resolver` → 新: `adaptiveParams.*Range` または `classification.*` のマッピング例を掲載。
- emulation-only 時の透明度/太さの適用順序を明記（Adaptive → Emulation Hook の順）。

スケジュール
- 0.1.15: range の正規化＋クランプ基盤（AdaptiveController 側の最終値クランプ & テスト）。補間は v1.1.0 で実装。
- 1.0.0: color分類のみ実装。Resolver は**存続**（警告のみ）。
- 1.1.0: `outlineWidthRange` / classification 連携（opacity/width） / emulation hook を統合、Resolver を非推奨のまま維持。
- 1.x（v1.1.0安定以降）: Resolver API の段階的削除（少なくとも2リリース以上のグレイス期間）。

---

### v1.2.0 - 時間依存データ（PoC）
Priority: Medium | Target: 2026-02
- [ ] `viewer.clock.currentTime` に基づく時刻評価・スライス描画（ステップ更新）
- [ ] キャッシュ/再計算ポリシーの基本設計（時間次元の増加コスト抑制）
- 分類スコープ（時系列の揺れへの対応）
  - [ ] `temporalClassificationScope: 'per-time'|'global'` を追加。
    - `per-time`（時刻ごと再スケール）: 現在時刻（または `timeWindow`）内の density 分布（min/max や分位）で分類を算出。
    - `global`（全時刻で統一）: すべての時刻を通した分布で分類（domain/しきい値）を固定。
  - [ ] 既存の `classification`（linear/log/equal-interval/quantize/threshold/quantile/jenks）と組み合わせ可能。
  - [ ] 凡例はスコープに追随（per-time は時刻に応じて更新、global は固定）。
- API/実装メモ
  - [ ] `src/utils/classification.js` に `computeDomain(data, { scope: 'per-time'|'global', clock })` を追加し、`AdaptiveController` から利用。
  - [ ] グローバル domain は初回計算をメモ化、per-time は時刻キーごとにメモ化して再計算を抑制。
- 互換性: 低（オプション追加）。
- 受け入れ基準
  - [ ] 同一データで `temporalClassificationScope: 'per-time'` と `'global'` を切替えたとき、配色/凡例の挙動が仕様通りに変化する。
  - [ ] いずれのスコープでも `classification` の各スキームが正しく適用される（最小限のスナップショットテスト）。
  - [ ] サンプルで時刻操作に応じてボクセルが更新され、体感カクつきが許容範囲内。

### v1.3.0 - メモリ/パフォーマンス最適化
Priority: Medium | Target: 2026-03
- [ ] 必要フィールドのみ保持（エンティティ配列の縮約）
- [ ] 描画リストの再利用・差分更新
- [ ] 描画優先度制御（重要ボクセル優先）
- [ ] 動的LoD（Level of Detail）
- [ ] ビューポートカリング最適化
- [ ] ADR-0003 受け入れ基準の再達成（動的太さ制御のオーバーヘッド ≤ 5%）
- [ ] 大規模データ時のヒープ増分最適化（レンダ/クリア反復での増分 ≤ 20MB 目安）
- [ ] VoxelRenderer 行数の追加削減（≤ 300 行目標、パラメータ計算のヘルパー化）
- 互換性: 変更なし（内部最適化）。

### v1.4.0（Examples 体系化・整理）
Priority: Medium | Target: 2026-06

Scope（examples/advanced を体系化し、学習・検証導線を改善）
- [ ] カテゴリ別ディレクトリ構成の導入（既存ファイルは段階的に移行）
  - observability/（観測可能性）
    - performance-overlay-demo.html（v0.1.12）
    - benchmark-usage.md（CLIの使い方・CSV/MD出力サンプル）
  - rendering/（描画モード・高さ/ワイヤーフレーム）
    - wireframe-height-demo.js / wireframe-height-demo-umd.html
    - adaptive-rendering-demo.html / adaptive-rendering-demo.js（プリセット・adaptiveOutlines）
  - outlines/（枠線：標準/インセット/エミュレーション）
    - outline-overlap-demo-umd.html
    - emulation-scope-demo.html（新規: standard/inset への部分エミュ重ね合わせ例）
  - selection-limits/（選択戦略と描画上限）
    - selection-strategy-demo.html（新規: density/coverage/hybrid 比較）
    - performance-optimization.js（段階的ロード・上限制御）
  - data/（データ生成・フィルタリング）
    - entity-filtering.js（属性/高度/範囲フィルタ）

ガイドライン（examples 統一ルール）
- [ ] Cesium 1.120 を参照し、UMD/ESMのどちらでも動く最小構成を提示
- [ ] 各カテゴリ配下に README.md（目的、前提、主要オプション、落とし穴）
- [ ] 例名・ファイル名はケバブケース、UIテキストは英語、READMEは日英併記
- [ ] Heatbox の `profile` と `getEffectiveOptions()` の使用例を各カテゴリに1つ以上配置
- [ ] `fitView(..., { pitchDegrees, headingDegrees })` の統一APIで記述

受け入れ基準（Acceptance Criteria）
- [ ] examples/advanced のトップ README にカテゴリ一覧と対応ファイルの表を掲載
- [ ] observability/rendering/outlines/selection-limits/data の5カテゴリが存在
- [ ] すべてのHTML例で「白画面/コンソールエラー」が無い（ローカル確認）
- [ ] 既存の UMD 例（wireframe/outline-overlap）は動作維持（リンクも更新）
- [ ] v0.1.12 の新API（outlineRenderMode/emulationScope、pitchDegrees/headingDegrees、profile）が少なくとも1つの例で確認可能

移行計画（非破壊）
- Step 1: 例の分類・README整備（ファイル移動は行わない）
- Step 2: 新規例（emulation-scope-demo、selection-strategy-demo）を追加
- Step 3: 影響範囲を確認しつつフェーズドでディレクトリ移動（git mv）し、リンク更新
- Step 4: Wiki の Examples ページと同期（tools/wiki-sync.js）

リスク & 緩和
- URL/リンク切れ → Step 1ではリンクのみ先に整備、移動はStep 3で一括実施
- ブラウザ互換 → 例のHTMLテンプレートを統一（Cesium CSS/JS、UMD/ESM切替コメント）

---

## 2.x 系（高度可視化フェーズ）

### v2.0.0 - スライス/深度フェード/フォーカス
Priority: Medium | Target: 2026-04
- [ ] スライス表示（X/Y/Z 平面での断面）
- [ ] 深度フェード（カメラ距離に応じた不透明度）
- [ ] フォーカス・コンテキスト（近傍強調・周辺減衰）
- 互換性: 中（新API追加）。

### v2.1.0 - ROI/ローカルヒストグラム
Priority: Medium | Target: 2026-05
- [ ] 3Dボックス/ポリゴンでの範囲選択（ROI）
- [ ] ROI内分布のローカルヒストグラムとカラーマップ連動

### v2.2.0 - MIP風投影/動的TopN
Priority: Low | Target: 2026-06
- [ ] 最大値投影（MIP）サマリ表示
- [ ] 時間変化に同期した動的TopN演出

---

## 3.x 系（アーキテクチャ強化）

### v3.0.0 - レンダリング基盤の拡張（実験的）
Priority: Low | Target: 2026 H2
- [ ] Primitiveベース描画（実験的）を `renderBackend: 'entity'|'primitive'` フラグで選択可能に（デフォルトはentity）
- [ ] 座標変換の精度向上（高緯度・広域向けの ENU/ECEF 段階移行の調査）
- 互換性: 大（内部構造の変更。デフォルトは既存維持）

### v3.1.0+ - 応用表現/出力
- [ ] 2.5Dカラム/六角ビニング（応用表現）
- [ ] 静的LoD事前計算
- [ ] 3D Tiles出力

---

## 4.x 系（標準化連携フェーズ）

### v4.0.0 - 空間ID（Spatial ID）対応（標準化が確定した場合）
Priority: Conditional | Target: TBD

- 条件
  - 国内外で「空間ID（Spatial ID）」の仕様が正式に標準化・安定化し、利用条件（ライセンス/参照実装/仕様公開）が明確であること。
- スコープ
  - アダプタ追加: `src/core/spatial/SpatialIdIndex.js` を実装し、`encode(lon,lat,level)`, `bounds(id)`, `center(id)`, `parent(id)`, `children(id)`, `neighbors(id)` を提供（既存の OLC/JapanMesh/Quadkey と同一IF）。
  - オプション: `spatialIndex: 'spatialid'` と `spatialLevel` をサポート。高さは `heightBin`（Zビン）と併用。
  - 互換性: 低（新オプション追加のみ、既存デフォルトは維持）。
- 受け入れ基準（Acceptance Criteria）
  - 空間ID→境界（bbox）→ボックス生成の往復で1セル以内の誤差に収まる単体テストが緑。
  - 代表ケースで `neighbors(id)` が仕様通りに近傍セルを返す（極域/子午線跨ぎを含む）。
  - examples に解像度切替デモを追加し、Docs/Wiki/API を更新。
- リスク & 対応
  - 標準仕様の更新・後追い: アダプタ層で差分吸収（IFは固定、マッピング/パラメータを差し替え）。
  - 実装/配布条件の変更: 参照実装のライセンス確認をゲートに設定、代替の暫定アダプタを用意。

> 注: 標準化が延期/不成立の場合、本項目は次期版へ移動または見送りとします。

---

## 継続タスク（全バージョン）

- テスト強化: VoxelRenderer分岐網羅、`updateOptions` の再描画分岐、ピック判定の実機整合
- ドキュメント保守: 各バージョン機能の同期、例の継続更新、API仕様の一貫性
- 品質ゲート: Lintエラーゼロ、主要モジュールの基本分岐をカバー
 - DevX向上: TypeScript型定義の完全化、ブラウザDevTools連携、ホットリロード対応の開発サーバー

---

## コントリビューション

議論や提案は Discussions / Issues / Projects へ。状況に応じて調整します。
