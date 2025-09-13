# Rendering Strategies（レンダリング戦略） / Rendering Strategies

**日本語** | [English](#english)

## 日本語
`renderLimitStrategy` は表示ボクセルの選び方を決めます（上限は `maxRenderVoxels`）。

- density（既定）: 密度順に上位から選択。ピーク把握に最適。
- coverage: XY平面を格子に分け各ビンから代表を層化抽出。全域の抜けを減らす。
- hybrid: coverage と density を按分。広く薄く＋濃い部分の両取り。

関連オプションと目安:
- `maxRenderVoxels`: 5k〜30k 目安。視野と端末により調整。
- `coverageBinsXY`: `'auto'` 推奨（約 4 ボクセル/ビン相当）。明示値なら 8〜24 程度。
- `minCoverageRatio`（hybrid 用）: 0.2〜0.5（coverage: density ≈ 2:8〜5:5）。
- `highlightTopN`: 10〜50（領域規模に応じて）。

### 設定例
```js
const heatbox = new Heatbox(viewer, {
  maxRenderVoxels: 15000,
  renderLimitStrategy: 'hybrid',
  minCoverageRatio: 0.3,
  coverageBinsXY: 'auto',
  highlightTopN: 20,
  outlineWidth: 2
});
```

使い分け:
- ホットスポット特定: density
- エリアの網羅性: coverage
- 実務の第一選択: hybrid（coverage 2〜4割＋density 残り）

## English
`renderLimitStrategy` controls how voxels are selected up to `maxRenderVoxels`.

- density (default): sort by density, ideal for hotspot detection.
- coverage: stratified sampling over XY bins to reduce spatial gaps.
- hybrid: a balance of coverage and density.

Guidelines:
- `maxRenderVoxels`: 5k–30k depending on device/scene.
- `coverageBinsXY`: `'auto'` recommended; explicit 8–24 works well.
- `minCoverageRatio`: 0.2–0.5 (coverage:density ≈ 2:8–5:5).
- `highlightTopN`: 10–50 depending on scene size.

### Example
```js
const heatbox = new Heatbox(viewer, {
  maxRenderVoxels: 15000,
  renderLimitStrategy: 'hybrid',
  minCoverageRatio: 0.3,
  coverageBinsXY: 'auto',
  highlightTopN: 20,
  outlineWidth: 2
});
```

Use cases:
- Hotspots: density
- Coverage completeness: coverage
- General default: hybrid (20–40% coverage + remainder density)

