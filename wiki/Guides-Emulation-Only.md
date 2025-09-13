# Emulation-Only Guide（エミュレーション専用ガイド） / Emulation-Only Guide

**日本語** | [English](#english)

## 日本語
エミュレーション専用（`outlineRenderMode: 'emulation-only'`）は、標準の枠線やインセットを使わず、エッジのポリラインのみで「太い枠線」を表現するモードです。WebGLの1px制限の影響を受けず、密度に応じた太さ/濃さの表現に適しています。

### 最小設定
```js
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  outlineEmulation: 'all',   // すべてをエミュレーション
  showOutline: false,        // 標準枠線はオフ
  opacity: 0.0               // ボックス塗り無し（エッジのみ）
});
```

### 密度に応じて「太く・濃く」する
```js
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  outlineEmulation: 'all',
  showOutline: false,
  opacity: 0.0,
  outlineWidthResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    return 1.5 + nd * (10 - 1.5); // 1.5〜10px
  },
  outlineOpacityResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    return Math.max(0.15, Math.min(1.0, 0.15 + nd * 0.85));
  }
});
```

### 使いどころ
- 高密度領域を「はっきり」見せたい
- 標準の枠線（box.outline）では太さの制約がある

## English
Emulation-only (`outlineRenderMode: 'emulation-only'`) renders thick edges using polylines without standard or inset outlines. It avoids the WebGL 1px limit and is suitable for density-driven thickness/opacity.

### Minimal Setup
```js
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  outlineEmulation: 'all',
  showOutline: false,
  opacity: 0.0
});
```

### Make dense voxels thicker and darker
```js
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only',
  outlineEmulation: 'all',
  showOutline: false,
  opacity: 0.0,
  outlineWidthResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    return 1.5 + nd * (10 - 1.5);
  },
  outlineOpacityResolver: ({ normalizedDensity }) => {
    const d = Math.max(0, Math.min(1, normalizedDensity || 0));
    const nd = Math.pow(d, 0.5);
    return Math.max(0.15, Math.min(1.0, 0.15 + nd * 0.85));
  }
});
```

### When to use
- Emphasize dense regions clearly
- Standard box outlines have thickness limitations

