# Temporal Samples / 時系列サンプル

このディレクトリは v1.2.0 の `temporal` オプションを使った動作例をまとめています。各 HTML は UMD ビルド（`dist/cesium-heatbox.umd.min.js`）を直接読み込み、`viewer.clock` と Heatbox の自動同期を確認できます。

## サンプル一覧

| ファイル | 説明 |
| --- | --- |
| `temporal-data.js` | 共通ユーティリティ。`temporal-flow.czml` を読み込み、24時間×3シナリオのスライスを生成します。 |
| `basic-temporal.html` | Cesium タイムラインと同期する最小構成（Per-Time スコープ）。 |
| `global-vs-per-time.html` | ラジオで Global/Per-Time を切り替え、統計の差を比較。 |
| `simulation.html` | 平日/イベント/週末のシナリオを動的切り替えし、`updateInterval` や `outOfRangeBehavior` を調整。 |

## 使い方

```bash
npm run build   # UMD バンドルを生成（HTMLから参照）
npm run dev     # http://localhost:8080/examples/temporal/basic-temporal.html などへアクセス
```

- タイムラインやアニメーション UI を有効化しているため、`viewer.clock.shouldAnimate` や `clock.multiplier` を変更するとその場で再生速度が変わります。
- 各サンプルは `common/demo.css` / `common/camera.js` に加え、`temporal-data.js` の `TemporalHeatboxDemo` API を利用してデータと CZML を共有しています。
