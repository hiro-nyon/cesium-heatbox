# Quick Start Guide (クイックスタートガイド)

[English](#english) | [日本語](#日本語)

## English

**Target Audience**: Developers who want to render their first `cesium-heatbox` heatmap
**Time Required**: ~10 minutes
**Prerequisites**: Node.js 18+, an existing app that creates a `Cesium.Viewer`, basic JavaScript knowledge

This guide gets a heatmap on screen using your own project. If you are looking for library development or release workflows instead, see [Development Environment Setup](development-setup.md) and the [Development Guide](development-guide.md).

### Table of Contents

1. [Install](#1-install)
2. [Set up a Cesium Viewer (if you don't have one yet)](#2-set-up-a-cesium-viewer-if-you-dont-have-one-yet)
3. [Render your first heatmap](#3-render-your-first-heatmap)
4. [Use your own entities](#4-use-your-own-entities)
5. [Common adjustments](#5-common-adjustments)
6. [Inspect the result](#6-inspect-the-result)
7. [Troubleshooting](#7-troubleshooting)
8. [Next Steps](#8-next-steps)

---

### 1. Install

```bash
npm install cesium-heatbox
```

`cesium-heatbox` declares `cesium@^1.120.0` as a peer dependency. If your project does not already depend on CesiumJS, install it too:

```bash
npm install cesium@^1.120.0
```

### 2. Set up a Cesium Viewer (if you don't have one yet)

`cesium-heatbox` renders into an existing `Cesium.Viewer`; it does not create one for you. If your app already has a `viewer` instance, skip to [step 3](#3-render-your-first-heatmap).

A minimal viewer that works without a Cesium Ion token (avoids the common "black globe" pitfall):

```javascript
import * as Cesium from 'cesium';

Cesium.Ion.defaultAccessToken = null;

const viewer = new Cesium.Viewer('cesiumContainer', {
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    credit: '© OpenStreetMap contributors © CARTO'
  }),
  terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  baseLayerPicker: false
});
```

For a full runnable page, see `examples/basic/index.html`.

### 3. Render your first heatmap

`generateTestEntities()` (bundled with `cesium-heatbox`) creates sample point entities so you can see a heatmap immediately, without preparing real data:

```javascript
import { Heatbox, generateTestEntities } from 'cesium-heatbox';

const bounds = {
  minLon: 139.68, maxLon: 139.70,
  minLat: 35.68, maxLat: 35.70,
  minAlt: 0, maxAlt: 200
};
generateTestEntities(viewer, bounds, 1000);

const heatbox = new Heatbox(viewer, {
  voxelSize: 50,
  opacity: 0.8
});

await heatbox.createFromEntities(viewer.entities.values);
await heatbox.fitView(null, { pitchDegrees: -35, paddingPercent: 0.1 });
```

You should now see voxel boxes colored by entity density over Shinjuku, Tokyo. `createFromEntities()` computes bounds, builds the voxel grid, classifies entities, renders, and resolves with the same statistics object returned by `getStatistics()`.

### 4. Use your own entities

Replace the sample data with entities already in your scene, or your own array of `Cesium.Entity`-like objects with a resolvable `position`:

```javascript
// Everything currently in the viewer
await heatbox.setData(viewer.entities.values);

// Or a specific subset
const vehicles = Heatbox.filterEntities(viewer.entities.values, (e) => e.properties?.type?.getValue() === 'vehicle');
await heatbox.setData(vehicles);
```

`setData()` reuses `createFromEntities()`'s pipeline without throwing on an empty array (it clears the heatmap instead). Entities without a usable `position` are skipped, not treated as errors.

### 5. Common adjustments

```javascript
const heatbox = new Heatbox(viewer, {
  voxelSize: 30,             // meters; smaller = finer detail, more voxels
  autoVoxelSize: true,       // let the library pick a size instead (ignored if voxelSize is set)
  opacity: 0.7,
  colorMap: 'viridis',       // 'custom' | 'viridis' | 'inferno'
  showEmptyVoxels: false,    // render empty voxels too (costs more)
  maxRenderVoxels: 20000     // hard cap on rendered voxels for performance
});
```

Or start from a preset tuned for a common scenario, then override individual fields:

```javascript
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast',   // 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data'
  opacity: 0.9              // profile values still apply; explicit fields like this override them
});

console.log(Heatbox.listProfiles());
```

See [Key Capabilities in the README](../README.md#key-capabilities) for classification, temporal, Spatial ID, and layer aggregation, and the [API Reference](API.md) for the full option catalogue.

### 6. Inspect the result

```javascript
const stats = heatbox.getStatistics();
console.log(`${stats.renderedVoxels}/${stats.totalVoxels} voxels rendered`);
console.log(`${stats.nonEmptyVoxels} voxels contain data`);

console.log(heatbox.getDebugInfo()); // options, bounds, grid, and statistics snapshot
```

### 7. Troubleshooting

**Nothing renders / globe is black**: Usually a missing Cesium Ion token unrelated to `cesium-heatbox`. Either set `Cesium.Ion.defaultAccessToken` to a valid token, or use an imagery provider that doesn't require one (see [step 2](#2-set-up-a-cesium-viewer-if-you-dont-have-one-yet)).

**`new Heatbox(viewer, ...)` throws "CesiumJS Viewerが無効です" / "Invalid viewer"**: The first argument is not a valid `Cesium.Viewer`. Confirm the viewer finished constructing before passing it in.

**`createFromEntities()` throws "対象エンティティがありません" / "No entities"**: The array was empty, `null`, or every entity lacked a resolvable position. `setData()` handles this case silently (clears instead of throwing) if you prefer not to catch it.

**Rendering is slow with large datasets**: Lower `maxRenderVoxels`, set `autoVoxelSize: true`, or start from the `mobile-fast` / `dense-data` profile. See `getStatistics().selectionStrategy` and `renderBudgetTier` to see what the library already applied.

### 8. Next Steps

- [README — Key Capabilities](../README.md#key-capabilities): classification engine, temporal data, Spatial ID, layer aggregation
- [API Reference](API.md): full options, methods, and return types
- [Examples](../examples/README.md): runnable demos by feature
- [GitHub Wiki](https://github.com/hiro-nyon/cesium-heatbox/wiki): rendering strategy guides, performance tuning, pitfalls
- [Development Environment Setup](development-setup.md): if you plan to contribute to `cesium-heatbox` itself

---

## 日本語

**対象**: `cesium-heatbox` で最初のヒートマップを描画したい開発者
**所要時間**: 約10分
**前提条件**: Node.js 18以上、`Cesium.Viewer`を生成済みのアプリ、基本的なJavaScript知識

このガイドは、あなた自身のプロジェクトでヒートマップを表示するまでの手順です。ライブラリ自体の開発・リリース手順を探している場合は[開発環境セットアップ](development-setup.md)と[開発ガイド](development-guide.md)を参照してください。

### 目次

1. [インストール](#1-インストール)
2. [Cesium Viewerの準備（未作成の場合）](#2-cesium-viewerの準備未作成の場合)
3. [最初のヒートマップを描画](#3-最初のヒートマップを描画)
4. [自分のエンティティを使う](#4-自分のエンティティを使う)
5. [よくある調整](#5-よくある調整)
6. [結果を確認する](#6-結果を確認する)
7. [トラブルシューティング](#7-トラブルシューティング)
8. [次のステップ](#8-次のステップ)

---

### 1. インストール

```bash
npm install cesium-heatbox
```

`cesium-heatbox`は`cesium@^1.120.0`をpeer dependencyとして宣言しています。プロジェクトにまだCesiumJSが入っていない場合は、あわせてインストールしてください。

```bash
npm install cesium@^1.120.0
```

### 2. Cesium Viewerの準備（未作成の場合）

`cesium-heatbox`は既存の`Cesium.Viewer`に描画するライブラリで、Viewer自体は生成しません。すでにアプリに`viewer`インスタンスがある場合は[手順3](#3-最初のヒートマップを描画)へ進んでください。

Cesium Ionトークンなしで動く最小構成（「地球が真っ黒になる」よくあるつまずきを回避できます）:

```javascript
import * as Cesium from 'cesium';

Cesium.Ion.defaultAccessToken = null;

const viewer = new Cesium.Viewer('cesiumContainer', {
  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    credit: '© OpenStreetMap contributors © CARTO'
  }),
  terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  baseLayerPicker: false
});
```

動作するHTML一式は`examples/basic/index.html`を参照してください。

### 3. 最初のヒートマップを描画

`generateTestEntities()`（`cesium-heatbox`に同梱）を使うと、実データを用意しなくてもサンプルのポイントエンティティを生成してすぐに確認できます。

```javascript
import { Heatbox, generateTestEntities } from 'cesium-heatbox';

const bounds = {
  minLon: 139.68, maxLon: 139.70,
  minLat: 35.68, maxLat: 35.70,
  minAlt: 0, maxAlt: 200
};
generateTestEntities(viewer, bounds, 1000);

const heatbox = new Heatbox(viewer, {
  voxelSize: 50,
  opacity: 0.8
});

await heatbox.createFromEntities(viewer.entities.values);
await heatbox.fitView(null, { pitchDegrees: -35, paddingPercent: 0.1 });
```

東京・新宿付近に、エンティティ密度で色分けされたボクセルが表示されます。`createFromEntities()`は境界計算・ボクセルグリッド生成・分類・描画までを行い、`getStatistics()`と同じ統計情報オブジェクトで解決します。

### 4. 自分のエンティティを使う

サンプルデータの代わりに、シーンに既にあるエンティティや、`position`を解決できる独自の`Cesium.Entity`相当のオブジェクト配列を渡せます。

```javascript
// viewer内の全エンティティ
await heatbox.setData(viewer.entities.values);

// 特定のサブセットのみ
const vehicles = Heatbox.filterEntities(viewer.entities.values, (e) => e.properties?.type?.getValue() === 'vehicle');
await heatbox.setData(vehicles);
```

`setData()`は`createFromEntities()`と同じ処理経路を使いますが、空配列を渡してもエラーを投げず、代わりにヒートマップをクリアします。`position`を解決できないエンティティはエラーにせずスキップされます。

### 5. よくある調整

```javascript
const heatbox = new Heatbox(viewer, {
  voxelSize: 30,             // メートル単位。小さいほど精細だがボクセル数が増える
  autoVoxelSize: true,       // 自動サイズ決定に任せる（voxelSizeを指定した場合は無視される）
  opacity: 0.7,
  colorMap: 'viridis',       // 'custom' | 'viridis' | 'inferno'
  showEmptyVoxels: false,    // 空ボクセルも描画する（コスト増）
  maxRenderVoxels: 20000     // 描画ボクセル数の上限（パフォーマンス制御）
});
```

よくある用途向けのプリセットから始めて、必要な項目だけ上書きすることもできます。

```javascript
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast',   // 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data'
  opacity: 0.9              // プリセットの値は適用されたうえで、明示指定した項目が優先される
});

console.log(Heatbox.listProfiles());
```

分類エンジン・時系列データ・空間ID・レイヤ別集約については[READMEの主要機能](../README.md#主要機能)を、全オプションの一覧は[APIリファレンス](API.md)を参照してください。

### 6. 結果を確認する

```javascript
const stats = heatbox.getStatistics();
console.log(`${stats.renderedVoxels}/${stats.totalVoxels} 個のボクセルを描画`);
console.log(`${stats.nonEmptyVoxels} 個のボクセルにデータあり`);

console.log(heatbox.getDebugInfo()); // オプション・境界・グリッド・統計情報のスナップショット
```

### 7. トラブルシューティング

**何も描画されない/地球が真っ黒**: 多くの場合、`cesium-heatbox`とは無関係なCesium Ionトークン未設定が原因です。`Cesium.Ion.defaultAccessToken`に有効なトークンを設定するか、トークン不要な地図プロバイダーを使ってください（[手順2](#2-cesium-viewerの準備未作成の場合)参照）。

**`new Heatbox(viewer, ...)`が「CesiumJS Viewerが無効です」で例外を投げる**: 第一引数が有効な`Cesium.Viewer`ではありません。Viewerの生成が完了してから渡しているか確認してください。

**`createFromEntities()`が「対象エンティティがありません」で例外を投げる**: 配列が空、`null`、またはすべてのエンティティで`position`を解決できませんでした。例外を避けたい場合は代わりに`setData()`を使ってください（クリア動作になります）。

**大量データで描画が遅い**: `maxRenderVoxels`を下げる、`autoVoxelSize: true`にする、または`mobile-fast`/`dense-data`プロファイルから始めてください。`getStatistics().selectionStrategy`と`renderBudgetTier`で、ライブラリが実際に適用した設定を確認できます。

### 8. 次のステップ

- [README — 主要機能](../README.md#主要機能): 分類エンジン、時系列データ、空間ID、レイヤ別集約
- [APIリファレンス](API.md): 全オプション・メソッド・戻り値
- [サンプル](../examples/README.md): 機能別の実行可能なデモ
- [GitHub Wiki](https://github.com/hiro-nyon/cesium-heatbox/wiki): 描画戦略、パフォーマンスチューニング、落とし穴
- [開発環境セットアップ](development-setup.md): `cesium-heatbox`自体の開発に参加する場合
