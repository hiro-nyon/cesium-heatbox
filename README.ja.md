# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)
[![Version](https://img.shields.io/github/package-json/v/hiro-nyon/cesium-heatbox?label=version)](https://github.com/hiro-nyon/cesium-heatbox/blob/main/package.json)
[![npm](https://img.shields.io/npm/v/cesium-heatbox)](https://www.npmjs.com/package/cesium-heatbox)

[English](README.md) | 日本語

[CesiumJS](https://cesium.com/cesiumjs/)環境内の既存エンティティを対象とした3Dボクセルベースヒートマップ可視化ライブラリです。サーバー処理や事前タイル化は不要で、`Cesium.Entity`から直接ボリュメトリックヒートマップを生成します。

## デモ

**Playground:** https://hiro-nyon.github.io/cesium-heatbox/

> 背景タイル: CartoDB Light（OSMベース）。高トラフィック時はタイルポリシーにご配慮ください。デモは`gh-pages`ブランチに静的ファイルのみを配置しています。

## 特徴

- **Entityベース** — 既存の`Cesium.Entity`から自動でデータを取得
- **真の3Dボクセル** — Z方向（高度）の分布を体積として可視化
- **自動範囲設定** — エンティティ分布から最適なバウンディングボックスとボクセルサイズを自動計算
- **分類エンジン** — 7方式: linear / log / equal-interval / quantize / threshold / quantile / jenks
- **空間ID対応** — METI準拠タイルグリッドモード（Ouranos-GEX統合または内蔵フォールバック）
- **時系列データ対応** — Cesium Clockと同期したヒートマップ更新（グローバル/個別分類）
- **レイヤ別集約** — カテゴリ・プロパティ・カスタムロジックによるボクセル内エンティティの内訳
- **適応的レンダリング** — 密度/カバレッジ/ハイブリッド選択、自動レンダリング予算、端末ティア検出
- **設定プロファイル** — `mobile-fast`、`desktop-balanced`、`dense-data`、`sparse-data`プリセット
- **パフォーマンス監視** — リアルタイムFPS、描画時間、メモリ使用量オーバーレイ

## インストール

### npm（推奨）

```bash
npm install cesium-heatbox
```

### CDN

```html
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>
```

### ソースからビルド

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build
```

## クイックスタート

```javascript
import { Heatbox } from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: { x: 1000, y: 1000, z: 100 },
  opacity: 0.8
});

// エンティティからヒートマップを作成
await heatbox.createFromEntities(viewer.entities.values);

// データ境界にカメラをフィット
await heatbox.fitView(null, { paddingPercent: 0.1, pitchDegrees: -35 });

// 統計情報の確認
console.log(heatbox.getStatistics());
```

## 主要機能

<details>
<summary><strong>分類エンジン</strong></summary>

7つの分類方式による宣言的な色分け制御。`classificationTargets`でcolor / opacity / widthを個別に有効化し、`adaptiveParams`で不透明度や線幅を補間します。

```javascript
const heatbox = new Heatbox(viewer, {
  classification: {
    enabled: true,
    scheme: 'quantile',   // linear | log | equal-interval | quantize | threshold | quantile | jenks
    classes: 5,
    colorMap: ['#0f172a', '#1d4ed8', '#22d3ee', '#f97316', '#facc15'],
    classificationTargets: { color: true, opacity: true, width: true }
  },
  adaptiveParams: {
    boxOpacityRange: [0.35, 0.95],
    outlineWidthRange: [1, 5]
  }
});

await heatbox.createFromEntities(entities);

// 分類統計
const stats = heatbox.getStatistics().classification;
console.log(stats.breaks);      // 自動計算された区切り
console.log(stats.histogram);   // { bins, counts }

// 凡例
const legendEl = heatbox.createLegend();
```

- `threshold`スキームのみ`thresholds`配列が必須。他のスキームはデータから自動で区切りを導出します。
- `colorMap`は単色の配列、または`{ position, color }`形式のストップ配列を指定できます。
- 統計情報には`domain` / `quantiles` / `jenksBreaks` / `ckmeansClusters` / `histogram` / `breaks`が含まれます。
- インタラクティブデモ: `examples/advanced/classification-demo.html`

詳細は[APIリファレンス — 分類](docs/API.md)を参照してください。

</details>

<details>
<summary><strong>時系列データ対応</strong></summary>

Cesium Clockと同期してボクセルヒートマップをフレーム単位またはスロットル制御で更新。グローバル分類（全時間スライス共通のmin/max）または個別再計算をサポートします。

```javascript
const heatbox = new Heatbox(viewer, {
  temporal: {
    enabled: true,
    data: [
      { start: '2024-01-01T00:00:00Z', stop: '2024-01-01T06:00:00Z', data: morningEntities },
      { start: '2024-01-01T06:00:00Z', stop: '2024-01-01T12:00:00Z', data: afternoonEntities }
    ],
    classificationScope: 'global',  // または 'per-time'
    updateInterval: 1000,           // ミリ秒スロットル
    outOfRangeBehavior: 'clear'     // または 'hold'
  }
});
```

- オーバーラップ解決: `prefer-earlier`、`prefer-later`、`skip`
- 二分探索+キャッシュによる効率的な時間検索
- デモ: `examples/temporal/`

詳細は[APIリファレンス — 時系列](docs/API.md)を参照してください。

</details>

<details>
<summary><strong>空間ID対応</strong></summary>

METI準拠の空間ID（Ouranos-GEX）に基づくタイルグリッドモードで、地理空間を考慮したボクセル配置を実現します。

```javascript
const heatbox = new Heatbox(viewer, {
  spatialId: {
    enabled: true,
    mode: 'tile-grid',
    provider: 'ouranos-gex',
    zoomControl: 'auto',
    zoomTolerancePct: 10
  },
  voxelSize: 30  // 目標ボクセルサイズ（メートル）
});
```

#### インストールオプション

**オプション1: 内蔵フォールバック（推奨）** — 追加インストール不要。Ouranoscが利用できない場合、内蔵のWeb Mercatorベース変換が自動的に使用されます。

**オプション2: Ouranos公式ライブラリ（高精度）**

```bash
npm install ouranos-gex-lib-for-javascript@github:ouranos-gex/ouranos-gex-lib-for-JavaScript --no-save
npx cesium-heatbox-install-ouranos
```

#### ズームレベルとセルサイズの関係

| ズーム | セルサイズ（赤道） | 用途例 |
|--------|-------------------|--------|
| 15     | ~1220 m           | 広域エリア |
| 20     | ~38 m             | 都市ブロック |
| 25     | ~1.2 m            | 建物・詳細 |
| 30     | ~3.7 cm           | 超高精度 |

#### 確認方法

```javascript
const stats = heatbox.getStatistics();
console.log(stats.spatialIdProvider); // "ouranos-gex" または "fallback"
```

#### トラブルシューティング

- `node_modules/ouranos-gex-lib-for-javascript/dist/index.js`が存在しない場合は`npx cesium-heatbox-install-ouranos`を実行してください。
- webpackの警告`Module not found: Can't resolve 'ouranos-gex-lib-for-javascript'`はオプショナル依存のため正常です。

#### 制限事項

- ±85.0511°（Web Mercator限界）内で正常動作
- 日付変更線対応: 将来バージョンで実装予定

詳細は[空間ID使用例](examples/spatial-id/)を参照してください。

</details>

<details>
<summary><strong>レイヤ別集約</strong></summary>

ボクセル内のエンティティをカテゴリ・種別・カスタムロジックで集約。各ボクセルのレイヤ内訳と支配的レイヤを追跡します。

```javascript
const heatbox = new Heatbox(viewer, {
  aggregation: {
    enabled: true,
    byProperty: 'buildingType',
    showInDescription: true,
    topN: 10
  }
});

await heatbox.createFromEntities(entities);
console.log(heatbox.getStatistics().layers);
// [{ key: 'residential', total: 5234 }, { key: 'commercial', total: 2103 }, ...]
```

#### カスタムリゾルバ

```javascript
aggregation: {
  enabled: true,
  keyResolver: (entity) => {
    const hour = new Date(entity.timestamp).getHours();
    return hour < 12 ? 'morning' : 'afternoon';
  }
}
```

#### ベストプラクティス

- カテゴリカルキーを使用（タイムスタンプやIDなどの連続値は避ける）
- ボクセルあたりのユニークレイヤ数は100未満を推奨
- `keyResolver`は文字列を返すべき。エラー時は`'unknown'`にフォールバック

#### パフォーマンス

- メモリ: ボクセルあたりのユニークレイヤあたり ~8–16バイト
- 処理時間: 有効時 ≤ +10%オーバーヘッド、無効時オーバーヘッドなし

詳細は[集約使用例](examples/aggregation/)を参照してください。

</details>

## なぜHeatbox?

| 強み | 説明 |
|------|------|
| **真の3D** | 体積ボクセルが2Dヒートマップテクスチャでは失われる高度情報を保持 |
| **Entityベース** | `Cesium.Entity`から直接動作。事前タイル化、サーバー処理、フォーマット変換不要 |
| **インフラ不要** | 純粋なクライアントサイドライブラリ。`npm install`だけで開始可能 |

**適していないケース:**
- 数十万〜数百万スケールのボクセルを恒常的に描画 → GPUボリュームレンダリングや3D Tilesを検討
- 連続体の科学可視化（CT / CFD等） → 専用のボリュームレンダリング手法が適合

## API概要

| メソッド | 説明 |
|----------|------|
| `new Heatbox(viewer, options)` | インスタンス作成 |
| `createFromEntities(entities)` | ヒートマップ作成（非同期、統計情報を返却） |
| `setData(entities)` | データ設定と描画 |
| `updateOptions(newOptions)` | オプション更新と再描画 |
| `setVisible(show)` | 表示/非表示切り替え |
| `clear()` | ヒートマップをクリア |
| `destroy()` | 全リソースを解放 |
| `fitView(bounds?, options?)` | データ境界にカメラをフィット |
| `getStatistics()` | レンダリング統計を取得 |
| `getDebugInfo()` | デバッグ情報を取得 |
| `createLegend(container?)` | インタラクティブ凡例要素を作成 |
| `Heatbox.listProfiles()` | 利用可能な設定プロファイル一覧（静的） |
| `Heatbox.getProfileDetails(name)` | プロファイル設定詳細を取得（静的） |

詳細は[APIリファレンス](docs/API.md)を参照してください。

## サンプル

| カテゴリ | 説明 | 場所 |
|----------|------|------|
| Basic | はじめに | `examples/basic/` |
| Classification | 色分けスキームデモ | `examples/advanced/` |
| Temporal | 時系列データ | `examples/temporal/` |
| Spatial ID | タイルグリッドモード | `examples/spatial-id/` |
| Aggregation | レイヤ内訳 | `examples/aggregation/` |
| Rendering | ワイヤーフレーム、高さベース | `examples/rendering/` |
| Performance | 適応制御、オーバーレイ | `examples/observability/` |

## ドキュメント

- [APIリファレンス](docs/API.md)
- [クイックスタート](docs/quick-start.md)
- [はじめに](docs/getting-started.md)
- [移行ガイド](MIGRATION.md)
- [開発ガイド](docs/development-guide.md)
- [コントリビューティング](CONTRIBUTING.md)
- [変更履歴](CHANGELOG.md)
- [ロードマップ](ROADMAP.md)

## ライセンス

MIT License — 詳細は[LICENSE](LICENSE)を参照してください。

## 貢献

プロジェクトへの貢献を歓迎します！詳細は[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。
