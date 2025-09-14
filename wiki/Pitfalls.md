# Pitfalls（よくある落とし穴） / Pitfalls

**日本語** | [English](#english)

## 日本語
- ボクセルが多すぎる: `voxelSize` が小さすぎる or `maxRenderVoxels` が高すぎ。→ ボクセルサイズを上げる/自動化、上限を下げる。
- 線が太くならない: WebGL の線幅制限。→ `outlineRenderMode: 'emulation-only'` を使うか、標準/インセットに `emulationScope: 'topn'|'all'` を重ねる。
- インセットが見えない: `opacity: 1.0` で塗りが覆う。→ 0.6〜0.9 に下げる or `wireframeOnly: true`。
- 重なりで見づらい: `outlineInset`/`voxelGap`/`outlineOpacity` を調整。密集域は `adaptiveOutlines` も有効。
- 英語/日本語の混在説明: JSDoc 分離が未整備な箇所。→ Wiki では言語別セクションを参照。
- 画面全体が白っぽい: coverage を上げすぎ。→ `minCoverageRatio` を下げる or density に戻す。
- UMD/ESM の混同: CDN は `CesiumHeatbox`、ESM は `import Heatbox from 'cesium-heatbox'`。
- Cesium バージョン不整合: peer `^1.120.0` を満たすこと。

## English
- Too many voxels: `voxelSize` too small or `maxRenderVoxels` too high → increase voxel size / lower the cap.
- Thick lines don’t render: WebGL line width limit → use `outlineRenderMode: 'emulation-only'`, or overlay partial emulation with `emulationScope: 'topn'|'all'`.
- Inset outline invisible: filled box hides it → reduce `opacity` or use `wireframeOnly`.
- Visual clutter from overlap: tune `outlineInset`/`voxelGap`/`outlineOpacity`; consider `adaptiveOutlines`.
- Mixed language docs: prefer language-specific sections in Wiki.
- Washed-out look: excessive coverage → lower `minCoverageRatio` or revert to density.
- UMD/ESM mismatch: use `CesiumHeatbox` on CDN, `import` for ESM.
- Cesium version mismatch: ensure peer `^1.120.0`.
