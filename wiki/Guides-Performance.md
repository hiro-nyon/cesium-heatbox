# Performance（性能チューニング） / Performance

**日本語** | [English](#english)

## 日本語
負荷を抑えつつ視認性を確保するための実践的な手順です。

1) スケール調整
- `autoVoxelSize: true` + `autoVoxelSizeMode: 'occupancy'`
- `autoVoxelTargetFill: 0.5〜0.7`

2) 上限と戦略
- `maxRenderVoxels: 10k〜20k`（端末次第）
- `renderLimitStrategy: 'hybrid'`、`minCoverageRatio: 0.2〜0.4`

3) 表示の工夫
- `wireframeOnly: true` で軽量化、または `opacity` を下げる
- 線の重なりは `outlineInset` / `voxelGap` / `outlineOpacity` で緩和
- 太線は以下のいずれかを検討
  - 部分エミュ: `outlineRenderMode: 'standard'|'inset'` + `emulationScope: 'topn'|'all'`
  - 専用モード: `outlineRenderMode: 'emulation-only'`

4) デバッグ/検証
- `const s = heatbox.getStatistics()` で `renderedVoxels` と `maxCount` を確認
- メモリ/描画が重い: `voxelSize` を上げる or `maxRenderVoxels` を下げる

### 例
```js
const heatbox = new Heatbox(viewer, {
  autoVoxelSize: true,
  autoVoxelSizeMode: 'occupancy',
  autoVoxelTargetFill: 0.6,
  maxRenderVoxels: 15000,
  renderLimitStrategy: 'hybrid',
  minCoverageRatio: 0.3,
  outlineInset: 1.5,
  voxelGap: 0.5,
  outlineOpacity: 0.7
});
```

---

## 適応制御のチューニング / Adaptive Control Tuning (v0.1.15)

### データ特性の把握 / Understanding Data Characteristics

**1. 密度分布の確認 / Check Density Distribution**
```js
const stats = heatbox.getStatistics();
console.log('Density range:', stats.minCount, '-', stats.maxCount);
console.log('Average:', stats.averageCount);
console.log('Rendered/Total:', stats.renderedVoxels, '/', stats.totalVoxels);
```

**2. 空間的偏りの診断 / Diagnose Spatial Bias**
```js
// PerformanceOverlay で視覚的に確認
const heatbox = new Heatbox(viewer, {
  performanceOverlay: { enabled: true, position: 'top-right' }
});
// Dense Areas の割合を確認 → 高密度データか疎データかを判断
```

**3. Z軸解像度の確認 / Check Z-axis Resolution**
```js
// データの Z 軸サイズが極端に小さい場合、zScaleCompensation を有効化
const aspectRatio = cellSizeZ / ((cellSizeX + cellSizeY) / 2);
console.log('Z aspect ratio:', aspectRatio);
// aspectRatio < 0.1 なら zScaleCompensation: true を推奨
```

### プロファイル選択の指針 / Profile Selection Guide

| データ特性 | 推奨プロファイル | 理由 |
|-----------|----------------|------|
| モバイル端末 | `mobile-fast` | 描画上限を低く、軽量な設定 |
| デスクトップ、バランス重視 | `desktop-balanced` | 品質とパフォーマンスのバランス |
| 高密度データ（都市部等） | `dense-data` | 密集エリアに最適化 |
| 疎データ（広域等） | `sparse-data` | 疎領域の可視化を優先 |

```js
// プロファイル使用例
const heatbox = new Heatbox(viewer, {
  profile: 'dense-data',  // 基本設定を適用
  maxRenderVoxels: 20000  // 個別調整も可能
});
```

### `adaptiveParams` の調整優先順位 / Adjustment Priority

**1. `densityThreshold`（密集判定の閾値）**
```js
adaptiveParams: {
  densityThreshold: 3  // デフォルト: 3
  // 低い値 (1-2): より多くのセルを「密集」と判定
  // 高い値 (5-10): 本当に密集したエリアのみ判定
}
```

**2. `neighborhoodRadius`（近傍探索範囲）**
```js
adaptiveParams: {
  neighborhoodRadius: 30  // デフォルト: 30m
  // 小さい値 (10-20): 局所的な密度判定、計算コスト低
  // 大きい値 (50-100): 広域的な密度判定、計算コスト高
}
```

**3. 範囲制約（`outlineWidthRange` / `boxOpacityRange` / `outlineOpacityRange`）**
```js
adaptiveParams: {
  outlineWidthRange: [1.0, 3.0],      // 線幅を1-3pxに制限
  boxOpacityRange: [0.5, 0.9],        // ボックス透明度を制限
  outlineOpacityRange: [0.3, 1.0]     // 枠線透明度を制限
}
```

**4. `zScaleCompensation`（Z軸極小データ用の補正）**
```js
adaptiveParams: {
  zScaleCompensation: true  // Z軸が極小の場合に有効化
}
```

**5. `overlapDetection`（高密度重なり対策）**
```js
adaptiveParams: {
  overlapDetection: true  // 重なり検出を有効化（オプトイン）
}
```

### 視認性検証の確認項目 / Visibility Verification Checklist

**✓ 重なり：高密度エリアでの枠線視認性**
- 症状：枠線が重なって見づらい
- 確認：`overlapDetection: true` + `outlineRenderMode: 'inset'`

**✓ ちらつき：カメラ移動時の安定性**
- 症状：ズーム時に線幅が急変
- 確認：`outlineWidthRange` で変動幅を制限

**✓ 遠景表示：ズームアウト時の表示品質**
- 症状：遠距離で線が見えなくなる
- 確認：`outlineWidthRange: [1.5, 3.0]` で最小値を上げる

### コード例 / Code Examples

**例1: 高密度都市データ**
```js
const heatbox = new Heatbox(viewer, {
  profile: 'dense-data',
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    densityThreshold: 3,
    neighborhoodRadius: 30,
    outlineWidthRange: [1.0, 2.5],
    zScaleCompensation: true,
    overlapDetection: true
  },
  outlineRenderMode: 'inset',
  outlineInset: 0.5
});
```

**例2: 疎な広域データ**
```js
const heatbox = new Heatbox(viewer, {
  profile: 'sparse-data',
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    densityThreshold: 5,        // 高い閾値で厳密に判定
    neighborhoodRadius: 50,      // 広い範囲で探索
    outlineWidthRange: [1.5, 3.0],
    zScaleCompensation: false
  },
  outlineRenderMode: 'standard'
});
```

**例3: Z軸極小データ（高さ方向が薄い）**
```js
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',
  adaptiveOutlines: true,
  adaptiveParams: {
    zScaleCompensation: true,   // 必須
    densityThreshold: 3,
    outlineWidthRange: [1.2, 2.5]
  },
  heightMultiplier: 2.0  // 高さ方向を強調
});
```

---

## English
Practical steps to balance performance and readability.

1) Scale
- `autoVoxelSize: true` with `autoVoxelSizeMode: 'occupancy'`
- `autoVoxelTargetFill: 0.5–0.7`

2) Limits and strategy
- `maxRenderVoxels: 10k–20k`
- `renderLimitStrategy: 'hybrid'`, `minCoverageRatio: 0.2–0.4`

3) Display
- `wireframeOnly: true` or reduce `opacity`
- Use `outlineInset` / `voxelGap` / `outlineOpacity` to mitigate overlap
- For thicker lines, consider either:
  - Partial emulation: `outlineRenderMode: 'standard'|'inset'` + `emulationScope: 'topn'|'all'`
  - Emulation-only mode: `outlineRenderMode: 'emulation-only'`

4) Debug/Verify
- Check `renderedVoxels` and `maxCount` via `getStatistics()`
- If heavy, increase `voxelSize` or reduce `maxRenderVoxels`
