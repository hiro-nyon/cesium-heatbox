# Quick Start

> **⚠️ 重要**: このライブラリは現在npm未登録です。以下の手順に従ってGitHubから取得してください。

5〜10分で動かすための手順です。お好みの方法を選んでください。

## A. 既存プロジェクトに導入（GitHubから取得）

### ステップ1: ライブラリを取得
```bash
# CesiumJSをインストール（未インストールの場合）
npm install cesium

# cesium-heatboxをGitHubからクローン
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

### ステップ2: プロジェクトにコピー
```bash
# ビルド済みファイルをプロジェクトにコピー
cp dist/cesium-heatbox.umd.min.js /path/to/your/project/libs/
```

```javascript
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, { voxelSize: 25, opacity: 0.8 });

const entities = viewer.entities.values; // 既存のエンティティ
await heatbox.createFromEntities(entities);
```

## B. CDN + UMD で試す（最小 HTML）
```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
<!-- GitHubのrawファイルから直接読み込み -->
<script src="https://raw.githubusercontent.com/hiro-nyon/cesium-heatbox/main/dist/cesium-heatbox.umd.min.js"></script>

<div id="cesiumContainer" style="width:100%;height:100%"></div>
<script>
  const viewer = new Cesium.Viewer('cesiumContainer');
  const heatbox = new CesiumHeatbox(viewer, { voxelSize: 30 });
  const entities = viewer.entities.values;
  heatbox.createFromEntities(entities);
  // 非同期の戻り値が必要な場合は Promise を扱ってください
  // heatbox.createFromEntities(entities).then(stats => console.log(stats));
<\/script>
```

## C. このリポジトリのサンプルを実行
```
npm install
npm run dev
```
ブラウザが開いたら UI から「Generate Entities」→「Create Heatmap」で動作確認できます。

## 次のステップ
- お好みの UI 制御と統計活用: [[Examples]]
- オプションや API の詳細: [[API-Reference]]
