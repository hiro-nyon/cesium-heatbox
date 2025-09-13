# Glossary（用語集） / Glossary

**日本語** | [English](#english)

## 日本語
- ボクセル (voxel): 三次元グリッドの最小単位。ヒートボックスは各ボクセルに集計値を持つ。
- カバレッジ (coverage): 空間的な網羅性。層化抽出で全域に点在させる選抜方針。
- ハイブリッド (hybrid): coverage と density を按分する選抜戦略。
- TopN: 密度上位Nボクセル。`highlightTopN` と `highlightStyle` で強調。
- インセット枠線 (inset outline): 枠線を内側にオフセットして表示する手法。
- 太線エミュレーション (outline emulation): ポリラインで太線を表現し WebGL の線幅制限を回避。
- 発散配色 (diverging): 青-白-赤で負/正の偏差を表す配色。`divergingPivot` で中心設定。
- レンダリング予算 (render budget): 表示上限などの制約（`maxRenderVoxels` など）。
- 占有率 (occupancy): グリッドに対するボクセル充填率。`autoVoxelSizeMode: 'occupancy'` で利用。

## English
- Voxel: The smallest unit of a 3D grid; Heatbox aggregates values per voxel.
- Coverage: Spatial completeness; stratified sampling to reduce gaps.
- Hybrid: A strategy balancing coverage and density.
- TopN: Top-N densest voxels; emphasized via `highlightTopN` and `highlightStyle`.
- Inset outline: Outlines drawn offset inward from box faces.
- Outline emulation: Thick lines emulated with polylines to bypass WebGL width limits.
- Diverging: Blue–white–red scheme to show signed deviation; centered by `divergingPivot`.
- Render budget: Upper bounds such as `maxRenderVoxels`.
- Occupancy: Fill ratio of grid cells; used by `autoVoxelSizeMode: 'occupancy'`.

