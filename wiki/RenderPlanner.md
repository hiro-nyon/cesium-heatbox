<!-- Generated from docs/api/RenderPlanner.html by npm run wiki:sync. Edit JSDoc in src/, not this page. -->

# Class: RenderPlanner（RenderPlannerクラス）

**日本語** | [English](#english)

## English

Lightweight render planner for prioritization, LoD, and viewport culling.

### Constructor

#### new RenderPlanner()

### Methods

#### plan(voxels, bounds, grid, topNVoxels, baseBudget) → {Object}

| Name | Type | Description |
|---|---|---|
| voxels | Array.<{key: string, info: Object}> |  |
| bounds | Object |  |
| grid | Object |  |
| topNVoxels | Set.<string> |  |
| baseBudget | number |  |


## 日本語

描画優先度、簡易LoD、ビューポートカリングを担当する軽量プランナー。

### コンストラクタ

#### new RenderPlanner()

### メソッド

#### plan(voxels, bounds, grid, topNVoxels, baseBudget) → {Object}

| 名前 | 型 | 説明 |
|---|---|---|
| voxels | Array.<{key: string, info: Object}> |  |
| bounds | Object |  |
| grid | Object |  |
| topNVoxels | Set.<string> |  |
| baseBudget | number |  |
