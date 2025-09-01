# Cesium Heatbox リリースノート

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
