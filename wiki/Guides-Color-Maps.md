# Color Maps（カラーマップ） / Color Maps

**日本語** | [English](#english)

## 日本語
値の分布に合わせて色表現を選びます。

- `colorMap`: 'viridis' | 'inferno' | 'custom'
- `diverging`: 二極性（青-白-赤）。`divergingPivot` で中心を指定（0 は符号ベース）。
- `minColor`/`maxColor`: 線形補間用（`colorMap: 'custom'` 時）。

### 例
```js
// 知覚均等マップ: viridis
const heatbox = new Heatbox(viewer, { colorMap: 'viridis' });

// 発散配色（正負あり）
const heatbox2 = new Heatbox(viewer, {
  diverging: true,
  divergingPivot: 0 // 0: 符号ベース。>0: ピボット中心で正規化
});

// カスタム2点補間
const heatbox3 = new Heatbox(viewer, {
  colorMap: 'custom',
  minColor: [0, 64, 255],
  maxColor: [255, 96, 0]
});
```

使い分け:
- 観測密度の段階表現: viridis / inferno
- 正負の偏りを見せたい: diverging（pivot を文脈値へ）

## English
Choose color representation for your data distribution.

- `colorMap`: 'viridis' | 'inferno' | 'custom'
- `diverging`: blue-white-red; set `divergingPivot` (0 uses sign-based mapping).
- `minColor`/`maxColor`: for linear interpolation when `colorMap: 'custom'`.

### Examples
```js
const heatbox = new Heatbox(viewer, { colorMap: 'viridis' });

const heatbox2 = new Heatbox(viewer, { diverging: true, divergingPivot: 0 });

const heatbox3 = new Heatbox(viewer, {
  colorMap: 'custom', minColor: [0,64,255], maxColor: [255,96,0]
});
```

Guidance:
- Perceptual sequential maps: viridis/inferno
- Signed deviation/contrast: diverging with appropriate pivot

