# CesiumJS Heatbox - Roadmap

> **Note**: このロードマップは予定であり、優先度や実装順序は変更される可能性があります。最新の進捗は [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues) と [GitHub Projects](https://github.com/hiro-nyon/cesium-heatbox/projects) をご確認ください。

## v0.1.5 (近期予定) - 基本機能強化

**Priority: High | Target: Q1 2025**

### 計画中の機能
- [ ] デバッグ描画制御: `debug.showBounds` オプションでバウンディングボックス表示のON/OFF制御
- [ ] 未使用オプション整理: `batchMode: 'auto'` の実装または仕様からの削除で整合性確保
- [ ] カラーマップ選択: `viridis`、`inferno` 等の知覚均等カラーマップ選択機能
- [ ] 二極性データ対応: 正負値に対応した発散配色（blue-white-red）
- [ ] トップN強調表示: 密度上位ボクセルのみ色・サイズ・ラベル強調、他は淡色表示

### 修正予定
- [ ] 実装と仕様の整合: ドキュメントでのPrimitive/Entity描画方式記述を現状に合わせて修正
- [ ] Cesiumバージョン整合: peerDependencies `cesium ^1.120.0` とサンプルCDN参照の一致
- [ ] ESM/UMDビルド整合: `package.json`のエントリポイントと実際のビルド成果物の一致確認

**実装工数: 低 | 互換性影響: なし**

---

## v0.2.0 (中期予定) - インタラクション機能

**Priority: Medium | Target: Q2 2025**

### 計画中の機能
- [ ] 時間依存データ対応: `viewer.clock.currentTime` を用いた動的時刻での位置評価
- [ ] エンティティ範囲拡張: polygon、polyline、billboard、model等の代表点推定ユーティリティ
- [ ] 分位・対数スケール: 外れ値対策として分位（等頻度）・対数スケール選択
- [ ] 凡例・分布表示: 最小・最大・中央値・分位を併記した読み取り支援
- [ ] OIT有効化: `viewer.scene.orderIndependentTranslucency = true` での半透明重ね順問題緩和
- [ ] シルエット・エッジ強調: アウトライン・選択時シルエットによる輪郭強調

### 変更予定
- [ ] メモリ削減最適化: エンティティ配列保持方法の最適化（カウントのみ保持、必要フィールド限定等）

**実装工数: 中 | 互換性影響: 軽微（新オプション追加のみ）**

---

## v0.3.0 (長期予定) - 高度な可視化機能

**Priority: Medium | Target: Q3-Q4 2025**

### 計画中の機能
- [ ] スライス表示: X/Y/Z断面移動による内部構造把握機能
- [ ] 深度フェード: カメラからの距離に応じた自動不透明度調整
- [ ] 前面ハイライト: 画面手前層の通常描画、奥層のワイヤーフレーム透視化
- [ ] フォーカス・コンテキスト: 選択ボクセル近傍の高彩度表示、周辺淡色化
- [ ] ROI抽出: 3Dボックス・ポリゴン範囲選択による局所分析
- [ ] ローカルヒストグラム: 選択範囲の値分布表示とカラーマップ調整連動

**実装工数: 高 | 互換性影響: 中（新API追加、既存動作は維持）**

---

## v0.4.0 (将来予定) - アーキテクチャ強化

**Priority: Low | Target: 2026**

### 計画中の機能
- [ ] 2.5Dカラム表示: 高さ方向集計による棒グラフ（四角・六角）押し出し表示
- [ ] 六角ビニング: 地表六角格子・垂直層スタックによる規則的表現
- [ ] 空ボクセル最適化: LOD・スキップレベル・サンプリング表示による効率化

### 変更予定
- [ ] Primitiveバッチ描画: Entity大量描画限界解消のためGeometryInstance + Primitive実装検討
- [ ] 座標変換強化: 高緯度・大域範囲での誤差軽減向けENU/ECEFベース座標変換への段階移行

**実装工数: 非常に高 | 互換性影響: 大（内部アーキテクチャ変更）**

---

## v1.0.0 (未定) - メジャーリリース

**Priority: Future | Target: TBD**

### 計画中の機能
- [ ] しきい値面（等値面）: 密度しきい値でのMarching Cubesメッシュ化・半透明表面表示

### 変更予定
- [ ] 破壊的変更: レガシーAPIの削除、パフォーマンス要件の見直し

**実装工数: 極めて高 | 互換性影響: 破壊的変更**

---

## 継続的タスク（全バージョン共通）

### テスト強化
- [ ] VoxelRenderer分岐網羅率向上
- [ ] `Heatbox.updateOptions` の再描画分岐テスト
- [ ] ピック判定の実機整合テスト追加

### ドキュメント保守
- [ ] 各バージョンの新機能に対応したドキュメント更新
- [ ] サンプル・例の継続的更新
- [ ] API仕様書の同期保持

---

## コントリビューション

ロードマップの優先度や機能について議論したい場合は、以下で参加できます：

- [GitHub Discussions](https://github.com/hiro-nyon/cesium-heatbox/discussions) - 機能提案・議論
- [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues) - 具体的なバグ・機能要求
- [GitHub Projects](https://github.com/hiro-nyon/cesium-heatbox/projects) - 進捗管理

ロードマップは四半期ごとに見直され、コミュニティフィードバックに基づいて調整されます。
