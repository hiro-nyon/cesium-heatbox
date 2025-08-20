# CesiumJS Heatbox

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/hiro-nyon/cesium-heatbox/workflows/CI/badge.svg)](https://github.com/hiro-nyon/cesium-heatbox/actions)

> **⚠️ 重要**: このライブラリは現在npm未登録です。GitHubから直接ダウンロードしてご利用ください。

CesiumJS環境内の既存エンティティを対象とした3Dボクセルベースヒートマップ可視化ライブラリです。

## 特徴

- **Entityベース**: 既存のCesium Entityから自動でデータを取得
- **自動範囲設定**: エンティティ分布から最適な立方体範囲を自動計算
- **最小ボクセル数**: 指定された範囲を内包する最小限のボクセル数で効率的に処理
- **相対的色分け**: データ内の最小値・最大値に基づく動的色分け
- **パフォーマンス最適化**: バッチ描画によるスムーズな3D表示

## インストール

> **注意**: このライブラリは現在npm未登録のため、以下の方法でインストールしてください。

### 方法1: GitHubから直接クローン

```bash
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

### 方法2: CDN経由で直接利用

```html
<!-- UMDバンドルを直接読み込み -->
<script src="https://raw.githubusercontent.com/hiro-nyon/cesium-heatbox/main/dist/cesium-heatbox.umd.min.js"></script>
```

### 将来的なnpm対応

npm登録を検討中です。登録後は以下のコマンドでインストール可能になります：

```bash
# 将来的に利用可能予定
npm install cesium-heatbox
```

## 基本的な使用方法

```javascript
import Heatbox from 'cesium-heatbox';

// Viewerが初期化済みの状態で
const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8
});

// エンティティからヒートマップを作成
const entities = viewer.entities.values;
const statistics = await heatbox.createFromEntities(entities);

console.log('作成完了:', statistics);
```

## API

### コンストラクタ

```javascript
const heatbox = new Heatbox(viewer, options);
```

**パラメータ**:
- `viewer` (Cesium.Viewer): CesiumJSビューワーインスタンス
- `options` (Object): 設定オプション

### 主要メソッド

- `createFromEntities(entities)`: エンティティからヒートマップを作成
- `setVisible(show)`: 表示/非表示の切り替え
- `clear()`: ヒートマップをクリア
- `getStatistics()`: 統計情報を取得

## サンプル

基本的な使用例は `examples/` フォルダを参照してください。

## ドキュメント

- [API リファレンス](docs/API.md)
- [クイックスタート](docs/quick-start.md)
- [はじめに](docs/getting-started.md)
- [開発ガイド](docs/development-guide.md)

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 貢献

プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](docs/contributing.md) を参照してください。
