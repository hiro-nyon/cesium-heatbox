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
- 太線は `outlineEmulation: 'topn'|'all'` を併用

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
- Consider `outlineEmulation: 'topn'|'all'` for thicker lines

4) Debug/Verify
- Check `renderedVoxels` and `maxCount` via `getStatistics()`
- If heavy, increase `voxelSize` or reduce `maxRenderVoxels`

