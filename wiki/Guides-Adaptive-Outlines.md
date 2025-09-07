# Adaptive Outlines（適応枠線） / Adaptive Outlines

**日本語** | [English](#english)

## 日本語
`adaptiveOutlines: true` で密度や近傍状況に応じて枠線/不透明度を自動調整します。

- `outlineWidthPreset`: 'uniform' | 'adaptive-density' | 'topn-focus'
- `adaptiveParams`: 近傍半径/しきい値/カメラ距離係数/重なり係数
- 透過制御: `boxOpacityResolver` / `outlineOpacityResolver`（優先度: resolver > adaptive > fixed）
- 表示モード: `outlineRenderMode`: 'standard' | 'inset' | 'emulation-only'

### 代表パターン
```js
// 密集域は細め、疎な場所とTopNは太め
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density',
  adaptiveParams: {
    neighborhoodRadius: 50,
    densityThreshold: 5,
    cameraDistanceFactor: 1.0,
    overlapRiskFactor: 0.3
  },
  outlineRenderMode: 'inset',
  outlineInset: 2.0,
  outlineInsetMode: 'all'
});
```

```js
// TopN を強調しつつ、その他は抑制
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'topn-focus',
  highlightTopN: 20,
  boxOpacityResolver: ({ isTopN }) => (isTopN ? 0.9 : 0.5),
  outlineOpacityResolver: ({ isTopN }) => (isTopN ? 1.0 : 0.4)
});
```

### ヒント
- 密集域の線太り→ `overlapRiskFactor` を上げる or `outlineRenderMode: 'emulation-only'`
- 遠距離で線が見えにくい→ `cameraDistanceFactor` を上げる
- 細部の抜け→ `'uniform'` へ戻す or `outlineInset` を小さめに

## English
Enable `adaptiveOutlines: true` to adjust outline width and opacity based on density and context.

- `outlineWidthPreset`: 'uniform' | 'adaptive-density' | 'topn-focus'
- `adaptiveParams`: neighborhood radius/threshold/camera distance/overlap risk
- Opacity control via resolvers: `boxOpacityResolver` / `outlineOpacityResolver`
- Display mode: `outlineRenderMode`: 'standard' | 'inset' | 'emulation-only'

### Patterns
```js
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density',
  adaptiveParams: { neighborhoodRadius: 50, densityThreshold: 5, cameraDistanceFactor: 1.0, overlapRiskFactor: 0.3 },
  outlineRenderMode: 'inset', outlineInset: 2.0
});
```

```js
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'topn-focus',
  highlightTopN: 20,
  boxOpacityResolver: ({ isTopN }) => (isTopN ? 0.9 : 0.5),
  outlineOpacityResolver: ({ isTopN }) => (isTopN ? 1.0 : 0.4)
});
```

Tips:
- Thick lines in dense areas → increase `overlapRiskFactor` or use `'emulation-only'`
- Thin at far distance → increase `cameraDistanceFactor`
- Missing details → switch to `'uniform'` or reduce `outlineInset`

