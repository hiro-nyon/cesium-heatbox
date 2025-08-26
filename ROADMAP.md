# CesiumJS Heatbox - Roadmap

> このロードマップは四半期ごとに見直します。最新の進捗は GitHub Issues / Projects を参照してください。

本計画は「0.1で完結できるもの」と「0.2/0.3以降でなければ難しいもの」を切り分け、各バージョンのスコープ・受け入れ基準・互換性影響を明確化します。

---

## 0.1 系（安定化フェーズ）

### v0.1.5（完了: 2025-08-25）- 基本機能強化
- 追加: `debug.showBounds`、知覚均等カラーマップ（`viridis`/`inferno`）、発散配色（`diverging`/`divergingPivot`）、`highlightTopN`/`highlightStyle`
- 非推奨: `batchMode` は受理するが無視（v1.0.0で削除予定）
- ドキュメント: README/API/Wiki 同期、ADR-0002 Accepted

### v0.1.6（短期・仕上げ）- ハードニングとドキュメント
Priority: High | Target: 2025-09
- 品質
  - [ ] Lint 0 errors（現状指摘の `prefer-const`/未使用変数の解消）
  - [ ] 主要分岐のテスト追補（VoxelRenderer 色補間・TopN分岐の正常系）
  - [ ] 例の安定化（Basic/Advancedの微修正、OIT切替例の追記）
- ドキュメント
  - [ ] Wiki公開スクリプト/手順の整備（`docs/api`→Wiki 反映の一次自動化）
  - [ ] Legend（凡例）の「サンプル実装」ドキュメント（ライブラリ外の実装例として提示）
- 新機能（軽微）
  - [ ] 枠線太さ調整オプション拡張: `outlineWidth` をより柔軟に設定可能（個別ボクセル・全体・TopN強調の太さ個別制御）
  - [ ] Examples基本・高度デモで枠線太さ調整UI追加
- 互換性: 変更なし（非破壊）。軽微なAPI追加（後方互換性維持）。
- 受け入れ基準: Lint 0 errors、テスト緑、README/Wiki/Examples が v0.1.6 内容に同期、枠線調整機能の動作確認。

### v0.1.6.1（パッチ）- インセット枠線の導入（ADR-0004）
Priority: High | Target: 2025-09
- 機能
  - [ ] `outlineInset`（m）をデフォルトOFFで追加（二重Box方式）。
  - [ ] 必要に応じ `outlineInsetMode: 'all'|'topn'` を検討（TopN限定でコスト抑制）。
- 相互作用/運用
  - [ ] Docs: 不透明塗りでは効果が限定的で、`opacity<1` もしくは `wireframeOnly:true`、`voxelGap` 併用推奨を明記。
  - [ ] Examples: basic/advanced にスライダー（m）とトグル追加（OFF→TopN→ALLの3段階）。
- 受け入れ基準（ADR準拠）
  - [ ] 1000ボクセル規模で描画時間 +30〜50% 以内（上限 +50%）。
  - [ ] outlineWidthResolver/TopN/outlineOpacity/voxelGap と併用時に破綻なし。
  - [ ] 単体/結合テスト（寸法/優先順位/alpha反映）と目視チェックを通過。

### v0.1.7（推奨・適応的制御）- 枠線重なり対策の高度化とUX改善
Priority: Medium | Target: 2025-10
- 適応的枠線制御の実装
  - [ ] 隣接ボクセル密度を考慮した動的太さ調整（`outlineWidthResolver` の高度化）
  - [ ] 空間的近接度解析: 指定半径内のボクセル密度を算出し、密集時は枠線を細く、疎な時は太く自動調整
  - [ ] プリセット提供: `outlineWidthPreset: 'adaptive-density'|'topn-focus'|'uniform'` でよくある使用パターンを簡単設定
  - [ ] Examples UI: 「適応的制御」チェックボックスと効果確認用の密度パターン生成機能
- インセット枠線（フォローアップ）
  - [ ] 0.1.6.1 のフィードバック反映、パラメータの上限・UIチューニング、モードの最適化
- UX改善（継続）
  - [ ] Diverging ピボットのUI反映（Examples）
  - [ ] 凡例オーバレイの標準テンプレ（Examples / Snippet）
  - [ ] OIT有効化のガイド（`viewer.scene.orderIndependentTranslucency`）
- 互換性: 変更なし（非破壊）。新オプション・プリセット追加のみ。
- 受け入れ基準: 密集・疎・混在パターンでの適応的制御の視認性向上確認、パフォーマンス影響<5%。

> 注: 0.1系では「コアのデータモデル変更や新レイヤー」は行わず、安定化と利用性向上に限定します。

---

## 0.2 系（機能拡張フェーズ）

### v0.2.0 - 分類スキームと凡例（連続/離散）
Priority: High | Target: 2025-11
- 分類スキーム（最小セット）
  - [ ] linear（既定）、log（log10/2）、equal-interval、quantize、threshold（custom thresholds）
  - [ ] quantile、jenks（ckmeans）
  - [ ] API例: `classification: 'linear'|'log'|'equal-interval'|'quantize'|'threshold'|'quantile'|'jenks'`, `classes?: number`, `thresholds?: number[]`, `discrete?: boolean`
- 凡例
  - [ ] 連続/離散に応じたラベル・境界値表示
  - [ ] TopN・diverging との整合
- 実装方針
  - 既存ライブラリの活用（d3-array/d3-scale/simple-statistics 等）を優先。バンドルサイズ配慮のためユーティリティ部品のみ導入。
- 互換性: 低（新オプション追加のみ、既存デフォルト維持）。
- 受け入れ基準: 代表データで各分類が視覚的に区別でき、凡例が同期表示される。

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

---

## コントリビューション

議論や提案は Discussions / Issues / Projects へ。状況に応じて調整します。
