# Voxel Selection（ボクセル選抜） / Voxel Selection

**日本語** | [English](#english)

## 日本語
TopN・比率・戦略の実戦目安です。

- TopN 強調: `highlightTopN: 10〜50`（都市規模: 20±）。
- coverage 比率（hybrid）: `minCoverageRatio: 0.2〜0.5`。
- coverage ビン数: `'auto'` 推奨。固定なら 8〜24。
- 併用: `renderLimitStrategy: 'hybrid'` + TopN で「広く＋濃く」。

### 実装例
```js
const heatbox = new Heatbox(viewer, {
  maxRenderVoxels: 12000,
  renderLimitStrategy: 'hybrid',
  minCoverageRatio: 0.35,
  coverageBinsXY: 'auto',
  highlightTopN: 24,
  highlightStyle: { outlineWidth: 6 }
});
```

Tips:
- TopN は √N の近辺から調整すると安定。
- coverage を増やすと白地が減り、ピークの相対強調は弱まる。

## English
Operational guidance for TopN, ratios, and strategies.

- TopN highlight: `highlightTopN: 10–50` (city scale: around 20).
- Hybrid coverage ratio: `minCoverageRatio: 0.2–0.5`.
- Coverage bins: `'auto'` recommended; 8–24 when fixed.
- Combine `hybrid` with TopN to capture both spread and peaks.

### Example
```js
const heatbox = new Heatbox(viewer, {
  maxRenderVoxels: 12000,
  renderLimitStrategy: 'hybrid',
  minCoverageRatio: 0.35,
  coverageBinsXY: 'auto',
  highlightTopN: 24,
  highlightStyle: { outlineWidth: 6 }
});
```

Tips:
- Start TopN around √N and tune.
- More coverage reduces blank areas but softens peaks.

