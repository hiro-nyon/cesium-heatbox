# Cesium Heatbox Playground v0.1.7

このディレクトリは、Cesium Heatbox v0.1.6ライブラリの本番環境テスト・デモ環境です。

注: プレイグラウンドはデフォルトでCartoDB Light (Positron) タイルを背景に使用し、Cesium ionトークンは不要です（地形はEllipsoidTerrainProvider）。

## 🆕 v0.1.7 新機能対応（UI整理）

- 適応的枠線制御: `adaptiveOutlines` と `outlineWidthPreset`（uniform/adaptive-density/topn-focus）
- 表示モード: `outlineRenderMode`（standard/inset/emulation-only）
- 透明度resolver: `boxOpacityResolver` / `outlineOpacityResolver` をプリセットで選択可能（密度ベース/TopNベース）

- **枠線重なり対策 (voxelGap)**: ボクセル間のギャップをメートル単位で調整し、枠線の重なりを軽減
- **枠線透明度制御 (outlineOpacity)**: アウトラインの透明度を滑らかに調整して視認性を改善
- **動的枠線太さ (outlineWidthResolver)**: 密度やTopNフラグに応じてボクセル毎に枠線太さを自動調整
- **知覚均等カラーマップ/二極性/TopN**: v0.1.5の機能も引き続き利用可能
- **v0.1.4機能継承**: 自動ボクセルサイズ決定・統計情報拡充・パフォーマンス最適化

UIは次のセクションに整理しました:
- 表示設定: 自動/手動グリッド、空ボクセル、枠線のみ、高さベース
- 色設定: カラーマップ、カスタム色、二極性とピボット
- 枠線・見た目: 描画モード、インセット枠線、ギャップ、透明度、太さモード、太線エミュレーション
- 適応表示: 適応的枠線制御、プリセット、透明度resolverのプリセット
- 強調表示: TopN と 非TopNの減衰量
- 詳細設定: デバッグ/境界表示、テストツール

## ファイル構成

- `index.html` - メインのHTMLファイル
- `app.js` - アプリケーションのメインロジック（UI整理に対応）
- `sample-data.geojson` - テスト用のGeoJSONサンプルデータ
- `README.md` - このファイル

## 使用方法

### 1. 背景タイル（OSM）について

このプレイグラウンドは、OpenStreetMapのタイル (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) を既定の背景として使用します。Cesium ionのアクセストークン設定は不要です。

注意: 公開環境で高トラフィックが見込まれる場合は、OSM公式タイルの利用ポリシーに配慮し、MapTilerや他のタイル配信サービス（キー付き）への切り替えを検討してください。

### 2. 基本的な起動

```bash
# プロジェクトルートから
cd playground

# 簡単なHTTPサーバーを起動（Python 3の場合）
python -m http.server 8000

# または Node.js の場合
npx http-server -p 8000

# ブラウザで以下にアクセス
# http://localhost:8000
```

### 2. 機能説明

#### データ読み込み
- **ファイル読み込み**: GeoJSONファイルやJSONファイルを読み込み
- **サンプルデータ**: 東京周辺のランダムなサンプルデータを生成
- **テストデータ**: ライブラリ内蔵のテストデータ生成機能を使用

#### ヒートマップ設定（ダイジェスト）
- **グリッドサイズ/自動**: 手動または自動で最適化（v0.1.4）
- **高さベース表現**: 密度を高さで直感的に表現
- **空のボクセル**: 非データボクセルを透明度付きで表示
- **カラーマップ**: Viridis/Inferno/カスタム、二極性（ピボット）
- **TopN**: 上位Nを強調、非TopNは減衰
- **アウトライン**: 透明度、太さ（自動/手動）、ギャップ
- **太線エミュ**: WebGLの制限回避の太線表示（TopN/非TopN/全体）
- **インセット枠線**: 内側オフセット（all/topN）、厚みフレーム埋め込み
- **デバッグ**: ログ出力/境界ボックス表示

#### 操作
- **ヒートマップ作成**: 現在のデータと設定でヒートマップを生成
- **クリア**: ヒートマップを削除
- **表示/非表示**: ヒートマップの表示状態を切り替え
- **データ出力**: 現在のデータをJSONファイルとして出力

### 3. データ形式

#### GeoJSONの例
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "weight": 95,
        "category": "交通"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [139.7673, 35.6812, 50]
      }
    }
  ]
}
```

#### エンティティ配列の例
```json
[
  {
    "position": [139.7673, 35.6812, 50],
    "weight": 95,
    "properties": {
      "category": "交通"
    }
  }
]
```

### 4. v0.1.7/0.1.6 新機能の使用方法

#### 適応的枠線制御（v0.1.7）
```javascript
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density', // or 'topn-focus' | 'uniform'
  outlineRenderMode: 'standard' // or 'inset' | 'emulation-only'
});
```

#### 透明度resolver（v0.1.7）
```javascript
const heatbox = new Heatbox(viewer, {
  boxOpacityResolver: ({ normalizedDensity, isTopN }) => Math.max(0.2, Math.min(1.0, 0.3 + normalizedDensity * 0.7)),
  outlineOpacityResolver: ({ isTopN }) => isTopN ? 1.0 : 0.5
});
```

#### 枠線重なり対策 / 透明度
```javascript
const heatbox = new Heatbox(viewer, {
  voxelGap: 4.0,        // ボクセル間を4m空ける（重なり軽減）
  outlineOpacity: 0.6   // 枠線をやや透明に
});
```

#### 動的枠線太さ（密度適応）
```javascript
const heatbox = new Heatbox(viewer, {
  outlineWidthResolver: ({ isTopN, normalizedDensity }) => {
    if (isTopN) return 6;          // TopNは太め
    if (normalizedDensity > 0.7) return 1; // 高密度は細く
    if (normalizedDensity > 0.3) return 2; // 中密度は標準
    return 3;                      // 低密度は太め
  }
});
```

#### 太線エミュレーション（UI）
- **無効**: 標準の枠線（WebGL制限により実質1px程度）
- **TopNのみ**: 密度上位のボクセルのみポリラインによる太線描画
- **TopN以外のみ**: 密度上位以外のボクセルを太線描画
- **すべて太線（自動インセット適用）**: 全ボクセルを太線で描画し、重なり防止のため自動的に内側オフセット（2m）と厚い枠線表示を適用

#### 厚い枠線表示（フレーム埋め込み）
WebGLの1px制限を回避する新機能です。インセット枠線とメインボックスの間を12個のフレームボックスで埋めることで、視覚的に厚い枠線を実現します。
- **手動有効化**: 「厚い枠線表示（フレーム埋め込み）」チェックボックス
- **自動有効化**: 「すべて太線」選択時に自動的に有効化される

#### 枠線太さモード（UI）
- 「枠線太さモード」で「自動（密度に応じて調整）」を選択すると、v0.1.6の`outlineWidthResolver`により密度やTopNに応じて太さが変化します。
  - **「すべて太線」と組み合わせ時**: TopN=6px、その他=4pxで全体的に太く表示
- 「手動（固定太さ）」を選ぶと、スライダーで設定した値が`outlineWidth`として適用され、すべてのボクセルに同じ太さを適用します。

#### 知覚均等カラーマップ
```javascript
// Viridisカラーマップ（科学的可視化標準）
const heatbox = new Heatbox(viewer, {
  colorMap: 'viridis'  // 濃紫～黄色のグラデーション
});

// Infernoカラーマップ（暗い背景に適合）
const heatbox = new Heatbox(viewer, {
  colorMap: 'inferno'  // 黒～赤～黄色のグラデーション
});

// カスタムカラー（従来通り）
const heatbox = new Heatbox(viewer, {
  colorMap: 'custom',
  minColor: [0, 128, 255],  // 青
  maxColor: [255, 0, 0]     // 赤
});
```

#### 二極性データ対応
```javascript
// 正負値データの可視化
const heatbox = new Heatbox(viewer, {
  diverging: true,        // 二極性モード有効
  divergingPivot: 0,      // 中心値（通常は0）
  colorMap: 'viridis'     // 基本カラーマップ
});

// 温度データの例（氷点を中心）
const heatbox = new Heatbox(viewer, {
  diverging: true,
  divergingPivot: 0,      // 氷点0度
  // 自動的に青-白-赤配色
});
```

#### TopN強調表示（非TopNの減衰量）
```javascript
// 密度上位5個のボクセルのみを強調表示
const heatbox = new Heatbox(viewer, {
  highlightTopN: 5,
  // 非TopNの不透明度をどれだけ減衰させるか（0〜1）
  highlightStyle: { boostOpacity: 0.9 }
});
```

#### デバッグ境界制御（v0.1.5）
```javascript
// ログ出力のみでボックス非表示
const heatbox = new Heatbox(viewer, {
  debug: true  // 従来通り（ボックス表示含む）
});

// 個別制御（v0.1.5）
const heatbox = new Heatbox(viewer, {
  debug: {
    showBounds: false  // ログのみ、ボックス非表示
  }
});
```

#### v0.1.4 自動ボクセルサイズ機能（継承）
```javascript
// 自動サイズ決定（新規ユーザー推奨）
const heatbox = new Heatbox(viewer, {
  autoVoxelSize: true  // データに応じて最適サイズを自動決定
});

// 統計情報確認
const stats = heatbox.getStatistics();
if (stats.autoAdjusted) {
  console.log(`Auto-adjusted: ${stats.originalVoxelSize}m → ${stats.finalVoxelSize}m`);
}
```

### 5. トラブルシューティング

#### CORSエラーが発生する場合
- ローカルHTTPサーバーを使用してください
- `file://` プロトコルでは動作しません

#### データが表示されない場合
- ブラウザのデベロッパーツールでエラーを確認
- データの座標系が正しいか確認（WGS84, 度単位）
- ウェイト値が数値であることを確認

#### パフォーマンスの問題
- データ点数を減らす
- グリッドサイズを小さくする
- WebGLのサポート状況を確認

### 6. 開発者向け情報

#### ライブラリの更新
```bash
# cesium-heatbox ディレクトリで
npm run build

# playground はビルド済みのファイルを参照
```

#### カスタマイズ
- `app.js` を編集してカスタム機能を追加
- `index.html` のUIを変更
- 新しいサンプルデータを追加

## 既知の問題

- 大量のデータ（10,000点以上）では処理が重くなる場合があります
- 一部のモバイルデバイスでWebGLパフォーマンスが低下する可能性があります
- Cesium ion トークンが必要な場合があります

## ライセンス

このプレイグラウンドは、Cesium Heatboxライブラリと同じライセンスで提供されます。
