# Troubleshooting（トラブルシューティング） / Troubleshooting

**日本語** | [English](#english)

## 日本語

## npm install が失敗する（ERESOLVE）
```
npm ERR! ERESOLVE unable to resolve dependency tree
```
対応:
```
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## ESLint 設定エラー
```
Error: ESLint configuration in eslint.config.js is invalid
```
対応:
- ESLint 8.x 系を使用（9.x のフラット設定は未対応）
- `.eslintrc.js` 形式 or 既存設定に合わせる

## Cesium 型定義の警告
```
warn deprecated @types/cesium@...: cesium provides its own type definitions
```
対応:
```
npm uninstall @types/cesium
```

## Jest 設定エラー
```
Unknown option "moduleNameMapping" with value
```
対応:
- `moduleNameMapping` → `moduleNameMapper` へ修正

## import パスの誤り
```
Cannot find module '../src/core/CoordinateTransformer.js'
```
対応:
- 相対パスを正しく設定（例: `../../src/core/...`）

## Cesium オブジェクト未定義
```
TypeError: Cesium.Cartesian3 is not a constructor
```
対応:
- テスト時は Cesium モックを用意（`test/setup.js` を参照）
- 実ブラウザでは CDN などで Cesium を正しくロード

## v0.1.2 特有の問題

### wireframeOnly で何も表示されない
対応:
- `opacity` を 0 以外に設定（wireframeOnly 時は自動で 0.0 になります）
- `showOutline: true` を確認

### heightBased で高さが反映されない
対応:
- データに十分な密度差があることを確認
- `maxRenderVoxels` を適切に設定（推奨: 300前後）

### Entity の isDestroyed エラー
```
TypeError: t.isDestroyed is not a function
```
対応:
- v0.1.2 で修正済み。古いバージョンを使用している場合は更新してください

## English

### npm install fails (ERESOLVE)
```
npm ERR! ERESOLVE unable to resolve dependency tree
```
Solution:
```
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ESLint configuration error
```
Error: ESLint configuration in eslint.config.js is invalid
```
Solution:
- Use ESLint 8.x series (9.x flat configuration not supported)
- Use `.eslintrc.js` format or match existing configuration

### Cesium type definition warnings
```
warn deprecated @types/cesium@...: cesium provides its own type definitions
```
Solution:
```
npm uninstall @types/cesium
```

### Jest configuration error
```
Unknown option "moduleNameMapping" with value
```
Solution:
- Fix `moduleNameMapping` → `moduleNameMapper`

### Import path errors
```
Cannot find module '../src/core/CoordinateTransformer.js'
```
Solution:
- Set relative paths correctly (e.g., `../../src/core/...`)

### Cesium object undefined
```
TypeError: Cesium.Cartesian3 is not a constructor
```
Solution:
- Prepare Cesium mocks for testing (refer to `test/setup.js`)
- Load Cesium correctly via CDN in actual browsers

### v0.1.2 Specific Issues

#### Nothing displays with wireframeOnly
Solution:
- Set `opacity` to non-zero (wireframeOnly automatically sets it to 0.0)
- Confirm `showOutline: true`

#### Height not reflected with heightBased
Solution:
- Confirm that data has sufficient density variation
- Set `maxRenderVoxels` appropriately (recommended: around 300)

#### Entity isDestroyed error
```
TypeError: t.isDestroyed is not a function
```
Solution:
- Fixed in v0.1.2. Please update if using an older version

---

## 適応制御のFAQ / Adaptive Control FAQ (v0.1.15)

### 1. 高密度エリアでアウトラインが重なって見づらい

**問題**  
高密度のボクセルエリアで、アウトライン同士が重なり合って線が太く見えたり、色が濃くなりすぎて視認性が低下します。

**原因**  
隣接するボクセルのアウトライン（枠線）が同じ位置で重なり、透明度のブレンディングにより視覚的なノイズが発生しています。標準モード（`outlineRenderMode: 'standard'`）では、各ボクセルの枠線がボクセルの外縁に描画されるため、隣接する場合に重なりやすくなります。

**診断**  
```js
const heatbox = new Heatbox(viewer, {
  performanceOverlay: { enabled: true }
});
// Dense Areas の割合が高い（80%以上）場合、重なりの可能性が高い
```

**解決策**  
```js
// Before: 標準モード（重なり発生）
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'standard'
});

// After 1: インセットモードで内側にオフセット
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'inset',
  outlineInset: 0.5  // 50%内側にオフセット（0.3-0.8を推奨）
});

// After 2: 重なり検出を有効化して自動推奨
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    overlapDetection: true  // オプトイン
  }
});

// After 3: エミュレーションモードに切り替え
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only'
});
```

**関連**  
- [`outlineRenderMode`](API-Reference.md#outlineRenderMode)
- [`outlineInset`](API-Reference.md#outlineInset)
- [`adaptiveParams.overlapDetection`](API-Reference.md#adaptiveParams)

#### English

**Problem**  
In dense voxel clusters the outlines stack on top of each other, making the lines look oversized and muddy.

**Cause**  
`outlineRenderMode: 'standard'` draws the outline on the outer edge of every voxel. When neighbours share the same edge the alpha values accumulate, so the line appears thicker and darker.

**Diagnosis**  
```js
const heatbox = new Heatbox(viewer, {
  performanceOverlay: { enabled: true }
});
// If the Dense Areas ratio exceeds roughly 80%, overlapping outlines are very likely.
```

**Solution**  
```js
// Before: standard mode (outlines overlap)
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'standard'
});

// After 1: move the outline inward with inset mode
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'inset',
  outlineInset: 0.5  // Shift the line inward by ~50% (0.3–0.8 recommended)
});

// After 2: enable overlap detection to receive inset recommendations
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    overlapDetection: true  // Opt-in flag
  }
});

// After 3: fall back to emulation-only lines
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only'
});
```

**Related**  
- [`outlineRenderMode`](API-Reference.md#outlineRenderMode)
- [`outlineInset`](API-Reference.md#outlineInset)
- [`adaptiveParams.overlapDetection`](API-Reference.md#adaptiveParams)

---

### 2. Z軸が薄いデータでボクセルが潰れて見える

**問題**  
Z軸方向（高さ）の解像度が水平方向に比べて極端に小さいデータで、ボクセルが平たく潰れたように表示され、3D感が失われます。

**原因**  
`cellSizeZ` が `cellSizeX`/`cellSizeY` に比べて非常に小さい（例：Z=0.5m, X/Y=20m）場合、ボクセルのアスペクト比が極端になり、視覚的に薄いパンケーキのように見えます。適応制御のデフォルト設定では、この極端なアスペクト比に対応していません。

**診断**  
```js
// グリッド情報からアスペクト比を確認
const grid = heatbox._voxelGrid; // 内部API（開発用）
const aspectRatio = grid.cellSizeZ / ((grid.cellSizeX + grid.cellSizeY) / 2);
console.log('Z aspect ratio:', aspectRatio);
// aspectRatio < 0.1 の場合、補正が必要
```

**解決策**  
```js
// Before: Z軸補正なし（潰れて見える）
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true
});

// After: Z軸スケール補正を有効化
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    zScaleCompensation: true  // Z軸補正を有効化
  },
  heightMultiplier: 2.0  // さらに高さ方向を強調（オプション）
});
```

**関連**  
- [`adaptiveParams.zScaleCompensation`](API-Reference.md#zScaleCompensation)
- [`heightMultiplier`](API-Reference.md#heightMultiplier)
- [Guides: Z-axis Compensation](Guides-Adaptive-Outlines.md#z-axis-compensation)

#### English

**Problem**  
When the Z resolution is tiny compared to X/Y, voxels look like flat pancakes and the 3D shape disappears.

**Cause**  
If `cellSizeZ` is far smaller than `cellSizeX`/`cellSizeY` (e.g. 0.5 m vs. 20 m) the aspect ratio becomes extreme. The default adaptive settings do not automatically compensate for that.

**Diagnosis**  
```js
// Inspect aspect ratio using grid info (internal API)
const grid = heatbox._voxelGrid;
const aspectRatio = grid.cellSizeZ / ((grid.cellSizeX + grid.cellSizeY) / 2);
console.log('Z aspect ratio:', aspectRatio);
// If aspectRatio < 0.1 you should enable compensation.
```

**Solution**  
```js
// Before: no compensation (flattened look)
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true
});

// After: enable z-scale compensation
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    zScaleCompensation: true
  },
  heightMultiplier: 2.0  // Optional: exaggerate height visually
});
```

**Related**  
- [`adaptiveParams.zScaleCompensation`](API-Reference.md#zScaleCompensation)
- [`heightMultiplier`](API-Reference.md#heightMultiplier)
- [Guides: Z-axis Compensation](Guides-Adaptive-Outlines.md#z-axis-compensation)

---

### 3. TopN ボクセルが埋もれて見えない

**問題**  
`highlightTopN` で上位ボクセルを強調しているはずなのに、周囲の通常ボクセルに埋もれて目立たない。

**原因**  
適応制御が有効な場合、TopN ボクセルと通常ボクセルの両方に密度ベースの調整が適用され、TopN の強調効果が相対的に弱まります。また、`outlineWidthRange` で上限を制限している場合、TopN の加算ブーストが効かない可能性があります。

**診断**  
```js
const stats = heatbox.getStatistics();
console.log('TopN count:', stats.topNCount);
console.log('TopN ratio:', stats.topNCount / stats.renderedVoxels);
// TopN ratio が低すぎる（< 0.05）場合、強調効果が見えにくい
```

**解決策**  
```js
// Before: TopN が埋もれる
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.0]  // 上限が低すぎ
  }
});

// After 1: outlineWidthRange の上限を上げる
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 4.0]  // TopN ブーストを許容
  }
});

// After 2: TopN フォーカスプリセットを使用
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'topn-focus',  // レガシー名（thick推奨）
  adaptiveParams: {
    outlineWidthRange: [1.0, 5.0]
  }
});

// After 3: エミュレーションスコープで TopN のみ太線化
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  outlineRenderMode: 'standard',
  emulationScope: 'topn',  // TopN のみエミュレーション
  adaptiveOutlines: true
});
```

**関連**  
- [`highlightTopN`](API-Reference.md#highlightTopN)
- [`outlineWidthPreset`](API-Reference.md#outlineWidthPreset)
- [`emulationScope`](API-Reference.md#emulationScope)

#### English

**Problem**  
Even with `highlightTopN`, the densest voxels do not pop out and are buried among normal cells.

**Cause**  
Adaptive logic also adjusts TopN voxels, so the difference shrinks. In addition, a narrow `outlineWidthRange` may clamp the TopN boost.

**Diagnosis**  
```js
const stats = heatbox.getStatistics();
console.log('TopN count:', stats.topNCount);
console.log('TopN ratio:', stats.topNCount / stats.renderedVoxels);
// If the ratio stays below ~0.05, the highlight probably looks weak.
```

**Solution**  
```js
// Before: TopN gets clamped
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.0]
  }
});

// After 1: raise the upper bound so boosts are allowed
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 4.0]
  }
});

// After 2: use a preset focused on TopN voxels
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'thick',  // 'topn-focus' legacy name
  adaptiveParams: {
    outlineWidthRange: [1.0, 5.0]
  }
});

// After 3: emulate thick lines only for TopN
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  outlineRenderMode: 'standard',
  emulationScope: 'topn',
  adaptiveOutlines: true
});
```

**Related**  
- [`highlightTopN`](API-Reference.md#highlightTopN)
- [`outlineWidthPreset`](API-Reference.md#outlineWidthPreset)
- [`emulationScope`](API-Reference.md#emulationScope)

---

### 4. カメラ距離でアウトライン太さが変わらない

**問題**  
カメラをズームイン・ズームアウトしても、アウトラインの太さが変化せず、遠景で線が見えなくなったり、近景で太すぎたりします。

**原因**  
v0.1.15 の現在の実装では、`cameraDistanceFactor` はプレースホルダーとして存在しますが、実際のカメラ距離の取得と反映が簡略化されており、固定値を使用しています。動的なカメラ距離ベースの調整は v1.0.0 で本実装予定です。

**診断**  
```js
// 現在のカメラ距離を確認
const cameraPosition = viewer.camera.positionCartographic;
const height = cameraPosition.height;
console.log('Camera height:', height, 'm');
// height が大きく変動しても線幅が変わらない場合、この問題
```

**解決策（現在の回避策）**  
```js
// Workaround: outlineWidthRange で固定範囲を設定
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.5, 3.0]  // 遠景でも見える最小値
  }
});

// v1.0.0 以降では動的調整が利用可能になる予定
```

**関連**  
- [ROADMAP: v1.0.0 Camera Distance Integration](../../ROADMAP.md#v1.0.0)
- [`adaptiveParams.cameraDistanceFactor`](API-Reference.md#cameraDistanceFactor)

#### English

**Problem**  
Outline width stays the same regardless of zoom level, so faraway lines disappear and close-up lines look oversized.

**Cause**  
`cameraDistanceFactor` is a placeholder in v0.1.15. The renderer still uses a fixed distance estimate; proper camera-aware scaling lands in v1.0.0.

**Diagnosis**  
```js
const cameraPosition = viewer.camera.positionCartographic;
const height = cameraPosition.height;
console.log('Camera height:', height, 'm');
// If height changes but outline width does not, this is the known limitation.
```

**Workaround**  
```js
// Clamp the outline width so it remains visible in the distance
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.5, 3.0]
  }
});

// Dynamic scaling will be delivered in v1.0.0.
```

**Related**  
- [ROADMAP: v1.0.0 Camera Distance Integration](../../ROADMAP.md#v1.0.0)
- [`adaptiveParams.cameraDistanceFactor`](API-Reference.md#cameraDistanceFactor)

---

### 5. 密度に応じた透明度変化が効かない

**問題**  
適応制御を有効にしても、ボクセルや枠線の透明度が密度に応じて変化せず、一律の値のままです。

**原因**  
v0.1.15 では、`boxOpacityRange` と `outlineOpacityRange` は正規化とクランプの基盤のみ実装されており、実際の補間ロジックは v1.0.0 で実装予定です。現在は `boxOpacity` と `outlineOpacity` にプリセットから計算された値が設定されますが、range による連続的な補間は行われません。

**診断**  
```js
const stats = heatbox.getStatistics();
console.log('Density range:', stats.minCount, '-', stats.maxCount);
// 密度に大きな差があるのに透明度が変わらない場合、この問題
```

**解決策（現在の回避策）**  
```js
// v0.1.15: range でクランプのみ可能
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    boxOpacityRange: [0.5, 0.9],      // 範囲制限のみ
    outlineOpacityRange: [0.3, 1.0]   // 範囲制限のみ
  }
});

// v1.0.0 で classification と統合された連続補間が利用可能になる予定
// 現在はプリセット（'adaptive'等）による離散的な調整のみ
```

**関連**  
- [ROADMAP: v1.0.0 Opacity Range Implementation](../../ROADMAP.md#v1.0.0)
- [`adaptiveParams.boxOpacityRange`](API-Reference.md#boxOpacityRange)
- [`adaptiveParams.outlineOpacityRange`](API-Reference.md#outlineOpacityRange)

#### English

**Problem**  
Opacity does not change with density; everything keeps the same transparency.

**Cause**  
In v0.1.15 the range settings (`boxOpacityRange`, `outlineOpacityRange`) only clamp values. Continuous interpolation is planned for v1.0.0. Presets like `'adaptive'` still return discrete opacity levels.

**Diagnosis**  
```js
const stats = heatbox.getStatistics();
console.log('Density range:', stats.minCount, '-', stats.maxCount);
// Large range + flat opacity = expected behaviour in v0.1.15
```

**Workaround**  
```js
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    boxOpacityRange: [0.5, 0.9],
    outlineOpacityRange: [0.3, 1.0]
  }
});

// Continuous opacity control will ship together with classification in v1.0.0.
```

**Related**  
- [ROADMAP: v1.0.0 Opacity Range Implementation](../../ROADMAP.md#v1.0.0)
- [`adaptiveParams.boxOpacityRange`](API-Reference.md#boxOpacityRange)
- [`adaptiveParams.outlineOpacityRange`](API-Reference.md#outlineOpacityRange)

---

### 6. エミュレーションモードで線が表示されない

**問題**  
`outlineRenderMode: 'emulation-only'` に設定しても、画面に何も表示されないか、ボクセルのボックス部分のみが表示されます。

**原因**  
エミュレーションモードでは、ポリライン（線）エンティティを生成してアウトラインを描画しますが、以下の条件で失敗する可能性があります：
1. `emulationScope` が `'off'` に設定されている
2. `showOutline: false` になっている
3. `outlineOpacity` が 0 または極端に低い
4. データが空またはレンダリング対象が 0

**診断**  
```js
const stats = heatbox.getStatistics();
console.log('Rendered voxels:', stats.renderedVoxels);
console.log('Emulation scope:', heatbox.options.emulationScope);
console.log('Show outline:', heatbox.options.showOutline);
console.log('Outline opacity:', heatbox.options.outlineOpacity);
```

**解決策**  
```js
// Before: 線が表示されない
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  emulationScope: 'off'  // ❌ 矛盾
});

// After: 正しい設定
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  emulationScope: 'all',  // または 'topn'/'non-topn'
  showOutline: true,
  outlineOpacity: 0.8,    // 十分な不透明度
  outlineWidth: 2
});
```

**関連**  
- [`outlineRenderMode`](API-Reference.md#outlineRenderMode)
- [`emulationScope`](API-Reference.md#emulationScope)
- [Guides: Emulation-Only Mode](Guides-Emulation-Only.md)

#### English

**Problem**  
Nothing renders—or only the box fill shows up—when `outlineRenderMode: 'emulation-only'` is enabled.

**Cause**  
Emulation mode draws additional polyline entities. Rendering fails when:
1. `emulationScope` is `'off'`
2. `showOutline` is `false`
3. `outlineOpacity` is 0 or extremely low
4. No voxels are selected for rendering

**Diagnosis**  
```js
const stats = heatbox.getStatistics();
console.log('Rendered voxels:', stats.renderedVoxels);
console.log('Emulation scope:', heatbox.options.emulationScope);
console.log('Show outline:', heatbox.options.showOutline);
console.log('Outline opacity:', heatbox.options.outlineOpacity);
```

**Solution**  
```js
// Before: configuration mismatch
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  emulationScope: 'off'
});

// After: enable lines visibly
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  emulationScope: 'all',  // or 'topn' / 'non-topn'
  showOutline: true,
  outlineOpacity: 0.8,
  outlineWidth: 2
});
```

**Related**  
- [`outlineRenderMode`](API-Reference.md#outlineRenderMode)
- [`emulationScope`](API-Reference.md#emulationScope)
- [Guides: Emulation-Only Mode](Guides-Emulation-Only.md)

---

### 7. 適応制御を有効化するとパフォーマンスが低下

**問題**  
`adaptiveOutlines: true` に設定すると、描画が遅くなったりフレームレートが低下します。

**原因**  
適応制御では、各ボクセルに対して近傍密度計算を行うため、計算コストが増加します。特に `neighborhoodRadius` が大きい場合や、ボクセル数が多い場合（5000+）に顕著になります。

**診断**  
```js
const stats = heatbox.getStatistics();
console.log('Rendered voxels:', stats.renderedVoxels);
// 5000+ ボクセルで neighborhoodRadius > 50 の場合、パフォーマンス懸念あり

// Performance Overlay で確認
const heatbox = new Heatbox(viewer, {
  performanceOverlay: { enabled: true }
});
// Render Time が 100ms 以上の場合、最適化が必要
```

**解決策**  
```js
// Before: 計算コストが高い
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  maxRenderVoxels: 10000,
  adaptiveParams: {
    neighborhoodRadius: 100  // 大きすぎ
  }
});

// After 1: neighborhoodRadius を縮小
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  maxRenderVoxels: 5000,  // 上限を下げる
  adaptiveParams: {
    neighborhoodRadius: 30  // デフォルト値を使用
  }
});

// After 2: プロファイルで最適化済み設定を使用
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast',  // 軽量設定
  adaptiveOutlines: true
});

// After 3: 適応制御を無効化して基本プリセットのみ使用
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: false,
  outlineWidthPreset: 'medium'  // 固定プリセット
});
```

**関連**  
- [Guides: Performance Tuning](Guides-Performance.md)
- [`adaptiveParams.neighborhoodRadius`](API-Reference.md#neighborhoodRadius)
- [`maxRenderVoxels`](API-Reference.md#maxRenderVoxels)

#### English

**Problem**  
Frame rate drops when `adaptiveOutlines: true` is enabled.

**Cause**  
Adaptive control calculates neighbourhood density for every voxel. The cost rises with larger `neighborhoodRadius` values and high voxel counts (5,000+).

**Diagnosis**  
```js
const stats = heatbox.getStatistics();
console.log('Rendered voxels:', stats.renderedVoxels);
// If this exceeds ~5,000 while radius > 50, expect extra load.

const heatbox = new Heatbox(viewer, {
  performanceOverlay: { enabled: true }
});
// When render time exceeds ~100 ms, consider optimisation.
```

**Solution**  
```js
// Before: expensive configuration
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  maxRenderVoxels: 10000,
  adaptiveParams: {
    neighborhoodRadius: 100
  }
});

// After 1: reduce the radius and render budget
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  maxRenderVoxels: 5000,
  adaptiveParams: {
    neighborhoodRadius: 30
  }
});

// After 2: use the lightweight profile
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast',
  adaptiveOutlines: true
});

// After 3: disable adaptive control and rely on presets
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: false,
  outlineWidthPreset: 'medium'
});
```

**Related**  
- [Guides: Performance Tuning](Guides-Performance.md)
- [`adaptiveParams.neighborhoodRadius`](API-Reference.md#neighborhoodRadius)
- [`maxRenderVoxels`](API-Reference.md#maxRenderVoxels)

---

### 8. `overlapDetection` を有効にしても効果が見えない

**問題**  
`adaptiveParams.overlapDetection: true` に設定しても、重なり検出の効果が視覚的に確認できません。

**原因**  
v0.1.15 の `overlapDetection` は、重なりを検出して推奨モード（`recommendedMode`）を返しますが、自動的にレンダリングモードを切り替えるわけではありません。検出結果は `_debug` 情報に含まれますが、実際の表示に反映させるには手動で設定を調整する必要があります。

**診断**  
```js
// デバッグ情報を確認（開発用）
const controller = heatbox._adaptiveController; // 内部API
// _detectOverlapAndRecommendMode の戻り値を確認
```

**解決策**  
```js
// v0.1.15: overlapDetection は検出のみ、手動で設定調整が必要
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    overlapDetection: true
  },
  // 検出結果に基づき、手動で inset を設定
  outlineRenderMode: 'inset',
  outlineInset: 0.5
});

// v1.0.0 以降で自動切り替えが実装される予定
```

**関連**  
- [`adaptiveParams.overlapDetection`](API-Reference.md#overlapDetection)
- [ROADMAP: v1.0.0 Auto Mode Switching](../../ROADMAP.md#v1.0.0)

#### English

**Problem**  
Turning on `adaptiveParams.overlapDetection` shows no visible difference.

**Cause**  
In v0.1.15 the feature only reports a recommendation (`recommendedMode`, `recommendedInset`) in debug data. It does not switch the renderer automatically; you need to apply the suggestion yourself.

**Diagnosis**  
```js
const controller = heatbox._adaptiveController; // Internal API
// Examine controller._detectOverlapAndRecommendMode(voxelInfo, data, options)
```

**Solution**  
```js
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  adaptiveParams: {
    overlapDetection: true
  },
  outlineRenderMode: 'inset',
  outlineInset: 0.5  // Apply the recommended inset manually
});

// Automatic switching is planned for v1.0.0.
```

**Related**  
- [`adaptiveParams.overlapDetection`](API-Reference.md#overlapDetection)
- [ROADMAP: v1.0.0 Auto Mode Switching](../../ROADMAP.md#v1.0.0)

---

### 9. `outlineWidthRange` で制限しても範囲外になる

**問題**  
`adaptiveParams.outlineWidthRange: [1.0, 2.5]` のように制限しているのに、実際の線幅が範囲外（例：3.0px）になっています。

**原因**  
TopN ボクセルに対しては、プリセット（`topn-focus`等）が加算ブーストを適用するため、range によるクランプ後にさらに係数が掛けられる場合があります。また、優先順位（Resolver > Adaptive > Base）により、カスタムの `outlineWidthResolver` が設定されている場合、それが最優先されます。

**診断**  
```js
const options = heatbox.getEffectiveOptions();
console.log('outlineWidthRange:', options.adaptiveParams.outlineWidthRange);
console.log('outlineWidthPreset:', options.outlineWidthPreset);
console.log('highlightTopN:', options.highlightTopN);
// TopN が設定されている場合、range を超える可能性あり
```

**解決策**  
```js
// Before: TopN ブーストで範囲外になる
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'topn-focus',
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.5]  // TopN ブーストで超える
  }
});

// After 1: range の上限を TopN ブーストを考慮して設定
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',  // ブーストが控えめ
  adaptiveParams: {
    outlineWidthRange: [1.0, 4.0]  // 余裕を持たせる
  }
});

// After 2: TopN を無効化して range を厳密に適用
const heatbox = new Heatbox(viewer, {
  highlightTopN: null,  // TopN 無効
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.5]
  }
});
```

**関連**  
- [`adaptiveParams.outlineWidthRange`](API-Reference.md#outlineWidthRange)
- [`highlightTopN`](API-Reference.md#highlightTopN)
- [Guides: Priority Order](Guides-Adaptive-Outlines.md#priority-order)

#### English

**Problem**  
Even with `adaptiveParams.outlineWidthRange: [1.0, 2.5]`, the final outline sometimes reaches 3 px or more.

**Cause**  
TopN presets (such as `'thick'` / `topn-focus`) apply an extra multiplier after the range clamp. Also note the priority order: Resolver > Adaptive > Base. A custom `outlineWidthResolver` therefore overrides the adaptive range.

**Diagnosis**  
```js
const options = heatbox.getEffectiveOptions();
console.log('outlineWidthRange:', options.adaptiveParams.outlineWidthRange);
console.log('outlineWidthPreset:', options.outlineWidthPreset);
console.log('highlightTopN:', options.highlightTopN);
// When highlightTopN is active, expect boosted widths.
```

**Solution**  
```js
// Before: capped range prevents the boost
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'thick',
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.5]
  }
});

// After 1: give the boost headroom
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    outlineWidthRange: [1.0, 4.0]
  }
});

// After 2: disable TopN to enforce strict clamping
const heatbox = new Heatbox(viewer, {
  highlightTopN: null,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 2.5]
  }
});
```

**Related**  
- [`adaptiveParams.outlineWidthRange`](API-Reference.md#outlineWidthRange)
- [`highlightTopN`](API-Reference.md#highlightTopN)
- [Guides: Priority Order](Guides-Adaptive-Outlines.md#priority-order)

---

### 10. プロファイルとカスタム設定の優先順位がわからない

**問題**  
`profile: 'dense-data'` とカスタム設定（例：`maxRenderVoxels: 20000`）を両方指定した場合、どちらが優先されるのかわかりません。

**原因**  
プロファイルは「ベース設定」として最初に適用され、その後ユーザーのカスタム設定で上書きされます。つまり、ユーザー設定が常に最優先されます。

**診断**  
```js
const options = heatbox.getEffectiveOptions();
console.log('Effective options:', options);
// プロファイルとカスタム設定がマージされた最終値が表示される
```

**解決策**  
```js
// 優先順位: ユーザー設定 > プロファイル > デフォルト

// 例: dense-data プロファイルをベースに一部をカスタマイズ
const heatbox = new Heatbox(viewer, {
  profile: 'dense-data',          // ベース設定（Step 1）
  maxRenderVoxels: 20000,         // 上書き（Step 2）
  adaptiveParams: {
    densityThreshold: 5,          // 上書き（Step 2）
    neighborhoodRadius: 30        // プロファイルのデフォルトを使用
  }
});

// 最終的な設定を確認
const effective = heatbox.getEffectiveOptions();
console.log('maxRenderVoxels:', effective.maxRenderVoxels); // 20000
console.log('densityThreshold:', effective.adaptiveParams.densityThreshold); // 5
```

**関連**  
- [`profile`](API-Reference.md#profile)
- [`getEffectiveOptions()`](API-Reference.md#getEffectiveOptions)
- [Guides: Profile Usage](Guides-Rendering-Strategies.md#profiles)

#### English

**Problem**  
Which value wins when both `profile: 'dense-data'` and explicit overrides (e.g. `maxRenderVoxels: 20000`) are supplied?

**Cause**  
Profiles act as a baseline. Defaults are applied, the profile overwrites them, and finally your custom options take precedence.

**Diagnosis**  
```js
const options = heatbox.getEffectiveOptions();
console.log('Effective options:', options);
// This shows the merged snapshot after all overrides.
```

**Solution**  
```js
// Order of precedence: user options > profile > defaults
const heatbox = new Heatbox(viewer, {
  profile: 'dense-data',
  maxRenderVoxels: 20000,
  adaptiveParams: {
    densityThreshold: 5,
    neighborhoodRadius: 30
  }
});

const effective = heatbox.getEffectiveOptions();
console.log('maxRenderVoxels:', effective.maxRenderVoxels); // 20000
console.log('densityThreshold:', effective.adaptiveParams.densityThreshold); // 5
```

**Related**  
- [`profile`](API-Reference.md#profile)
- [`getEffectiveOptions()`](API-Reference.md#getEffectiveOptions)
- [Guides: Profile Usage](Guides-Rendering-Strategies.md#profiles)
