<!-- Generated from README.ja.md by npm run wiki:sync. Edit the canonical source, not this page. -->

# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)
[![Version](https://img.shields.io/github/package-json/v/hiro-nyon/cesium-heatbox?label=version)](https://github.com/hiro-nyon/cesium-heatbox/blob/main/package.json)
[![npm](https://img.shields.io/npm/v/cesium-heatbox)](https://www.npmjs.com/package/cesium-heatbox)

[English](Home) | 日本語

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

## 互換性

- 対応する最小Cesiumバージョン: `^1.120.0`
- CI では `cesium@^1.120.0` と `cesium@latest` の両方を検証

## クイックスタート

```javascript
import { Heatbox } from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: 100,
  opacity: 0.8
});

// エンティティからヒートマップを作成
await heatbox.createFromEntities(viewer.entities.values);

// データ境界にカメラをフィット
await heatbox.fitView(null, { paddingPercent: 0.1, pitchDegrees: -35 });

// 統計情報の確認
console.log(heatbox.getStatistics());
```

### 実行時の高度な制御

v0.1.12 で追加された実行時制御は、互換性を保って利用できます。

- `fitViewOptions.headingDegrees` と `fitViewOptions.pitchDegrees` でカメラ方向を指定します。
- `outlineRenderMode` と `emulationScope` は、非推奨の `outlineEmulation` を置き換えます。
- `performanceOverlay` は `togglePerformanceOverlay()` または `setPerformanceOverlayEnabled()` で実行中に切り替えられます。
- `getEffectiveOptions()` で、正規化後の現在の設定を取得できます。

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

詳細は[APIリファレンス — 分類](API)を参照してください。

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
    outOfRangeBehavior: 'clear',    // または 'hold'
    interpolate: true               // スライス間ギャップの数値を補間
  }
});
```

- オーバーラップ解決: `prefer-earlier`、`prefer-later`、`skip`
- 二分探索+キャッシュによる効率的な時間検索
- `updateValues()` は既存グリッドに収まる更新を軽量経路で処理
- `dataSource(currentTime, context)` で lazy loading を追加可能
- `useWorker: true` で補間と時系列統計の前処理を worker に逃がせます
- デモは baseline 再生、Global/Per-Time 比較、シナリオ切替、補間/lazy loading の拡張フローまで含みます
- デモ: `examples/temporal/README.md`

詳細は[APIリファレンス — 時系列](API)を参照してください。

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

#### プロバイダー

Ouranos公式プロバイダーは配布物の遅延チャンクに同梱されるため、追加パッケージのインストールは不要です。チャンクを読み込めない場合は、内蔵Web Mercatorフォールバックへ自動的に切り替わります。

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
console.log(stats.spatialId.provider); // 公式provider利用時は "ouranos-gex"、内蔵フォールバック時は null
```

#### トラブルシューティング

- `dist/`をコピーまたはセルフホストする場合は、番号付き遅延チャンクもESM・CJS・UMD本体と一緒に配置してください。
- 統計の`provider`が`null`の場合はブラウザーのネットワークログを確認してください。遅延チャンクが見つからないと内蔵フォールバックへ切り替わります。

#### 制限事項

- ±85.0511°（Web Mercator限界）内で正常動作
- 日付変更線対応: 将来バージョンで実装予定

詳細は[空間ID使用例](https://github.com/hiro-nyon/cesium-heatbox/blob/main/examples/spatial-id/README.md)を参照してください。

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

詳細は[集約使用例](https://github.com/hiro-nyon/cesium-heatbox/blob/main/examples/aggregation/README.md)を参照してください。

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
| `updateValues(entities, runtimeOptions?)` | 既存グリッドを再利用できる場合の軽量更新 |
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

詳細は[APIリファレンス](API)を参照してください。

## サンプル

| カテゴリ | 説明 | 場所 |
|----------|------|------|
| Basic | はじめに | `examples/basic/index.html` |
| Classification | 色分けスキームデモ | `examples/advanced/README.md` |
| Temporal | 時系列データ | `examples/temporal/README.md` |
| Spatial ID | タイルグリッドモード | `examples/spatial-id/README.md` |
| Aggregation | レイヤ内訳 | `examples/aggregation/README.md` |
| Rendering | ワイヤーフレーム、高さベース | `examples/rendering/README.md` |
| Performance | 適応制御、オーバーレイ | `examples/observability/README.md` |

## ドキュメント

**ライブラリを使い始める**

- [クイックスタート](Quick-Start) — 10〜15分でインストールから初回描画まで
- [APIリファレンス](API) — オプション、メソッド、戻り値の完全な一覧
- [移行ガイド](https://github.com/hiro-nyon/cesium-heatbox/blob/main/MIGRATION.md) — 既存コードのアップグレード

**機能を深掘りする**

- [ドキュメント索引](https://github.com/hiro-nyon/cesium-heatbox/blob/main/docs/README.md) — 読者・目的別に整理したガイド一覧
- [GitHub Wiki](https://github.com/hiro-nyon/cesium-heatbox/wiki) — 描画戦略、性能、空間ID、落とし穴、用語集
- [ロードマップ](https://github.com/hiro-nyon/cesium-heatbox/blob/main/ROADMAP.md)と[変更履歴](Release-Notes)

**アーキテクチャを理解する**

- [現行ランタイムアーキテクチャ](https://github.com/hiro-nyon/cesium-heatbox/blob/main/docs/adr/ADR-0019-v1.3.7-current-runtime-architecture.md) — ADR-0019（英語）: サブシステムの責務、CesiumJS統合境界、既知の制約。まずここから
- [描画アーキテクチャ](https://github.com/hiro-nyon/cesium-heatbox/blob/main/docs/adr/ADR-0020-v1.3.0-incremental-entity-rendering.md) — ADR-0020（英語）: 差分Entityライフサイクルとカメラ考慮の描画計画
- [時系列アーキテクチャ](https://github.com/hiro-nyon/cesium-heatbox/blob/main/docs/adr/ADR-0021-v1.3.2-asynchronous-temporal-pipeline.md) — ADR-0021（英語）: 非同期時系列パイプラインと軽量更新
- [ADR索引](https://github.com/hiro-nyon/cesium-heatbox/blob/main/docs/adr/README.md) — 全ADRの一覧（Status と Implementation State 付き）

**開発・貢献する**

- [開発環境セットアップ](Development-Setup)
- [開発ガイド](Development-Guide)
- [コントリビューションガイド](https://github.com/hiro-nyon/cesium-heatbox/blob/main/CONTRIBUTING.md)

## ライセンス

MIT License — 詳細は[LICENSE](https://github.com/hiro-nyon/cesium-heatbox/blob/main/LICENSE)を参照してください。

## 貢献

プロジェクトへの貢献を歓迎します！詳細は[CONTRIBUTING.md](https://github.com/hiro-nyon/cesium-heatbox/blob/main/CONTRIBUTING.md)を参照してください。
