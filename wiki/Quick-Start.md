# Quick Start

**日本語** | [English](#english)

5〜10分で動かすための手順です。お好みの方法を選んでください。

## English

Steps to get it running in 5-10 minutes. Choose your preferred method.

## A. npmからインストール（推奨） / Install from npm (Recommended)

### 日本語

#### ステップ1: パッケージをインストール
```bash
npm install cesium cesium-heatbox
```

#### ステップ2: インポートして使用
```javascript
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',
  autoVoxelSize: true,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 3.0],
    zScaleCompensation: true
  }
});

const entities = viewer.entities.values; // 既存のエンティティ
await heatbox.createFromEntities(entities);
```

### English

#### Step 1: Install Packages
```bash
npm install cesium cesium-heatbox
```

#### Step 2: Import and Use
```javascript
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',
  autoVoxelSize: true,
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [1.0, 3.0],
    zScaleCompensation: true
  }
});

const entities = viewer.entities.values; // existing entities
await heatbox.createFromEntities(entities);
```

## B. 既存プロジェクトに導入（GitHubから取得） / Add to Existing Project (from GitHub)

### 日本語

#### ステップ1: ライブラリを取得
```bash
# CesiumJSをインストール（未インストールの場合）
npm install cesium

# cesium-heatboxをGitHubからクローン
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### ステップ2: プロジェクトにコピー
```bash
# ビルド済みファイルをプロジェクトにコピー
cp dist/cesium-heatbox.umd.min.js /path/to/your/project/libs/
```

```javascript
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',
  autoVoxelSize: true,
  adaptiveOutlines: true
});

const entities = viewer.entities.values; // 既存のエンティティ
await heatbox.createFromEntities(entities);
```

### English

#### Step 1: Get the Library
```bash
# Install CesiumJS (if not already installed)
npm install cesium

# Clone cesium-heatbox from GitHub
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox
npm install
npm run build:umd
```

#### Step 2: Copy to Project
```bash
# Copy built file to your project
cp dist/cesium-heatbox.umd.min.js /path/to/your/project/libs/
```

```javascript
import Heatbox from 'cesium-heatbox';

const viewer = new Cesium.Viewer('cesiumContainer');
const heatbox = new Heatbox(viewer, {
  profile: 'desktop-balanced',
  autoVoxelSize: true,
  adaptiveOutlines: true
});

const entities = viewer.entities.values; // existing entities
await heatbox.createFromEntities(entities);
```

## C. CDN + UMD で試す（最小 HTML）
```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
<!-- CDNから読み込み -->
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>

<div id="cesiumContainer" style="width:100%;height:100%"></div>
<script>
  const viewer = new Cesium.Viewer('cesiumContainer');
  const heatbox = new CesiumHeatbox(viewer, {
    profile: 'mobile-fast',
    adaptiveOutlines: true
  });
  const entities = viewer.entities.values;
  heatbox.createFromEntities(entities);
  // 非同期の戻り値が必要な場合は Promise を扱ってください
  // heatbox.createFromEntities(entities).then(stats => console.log(stats));
</script>
```

### English
```html
<script src="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Cesium.js"></script>
<link href="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
<!-- Load from CDN -->
<script src="https://unpkg.com/cesium-heatbox@latest/dist/cesium-heatbox.umd.min.js"></script>

<div id="cesiumContainer" style="width:100%;height:100%"></div>
<script>
  const viewer = new Cesium.Viewer('cesiumContainer');
  const heatbox = new CesiumHeatbox(viewer, {
    profile: 'mobile-fast',
    adaptiveOutlines: true
  });
  const entities = viewer.entities.values;
  heatbox.createFromEntities(entities);
  // Handle Promise if you need async return value
  // heatbox.createFromEntities(entities).then(stats => console.log(stats));
</script>
```

## D. このリポジトリのサンプルを実行 / Run Repository Examples

### 日本語
```
npm install
npm run dev
```
ブラウザが開いたら UI から「Generate Entities」→「Create Heatmap」で動作確認できます。

### English
```bash
npm install
npm run dev
```
When the browser opens, use the UI: "Generate Entities" → "Create Heatmap" to test functionality.

## 次のステップ / Next Steps

### 日本語
- お好みの UI 制御と統計活用: [[Examples]]
- オプションや API の詳細: [[API-Reference]]

### English
- Custom UI controls and statistics usage: [[Examples]]
- Options and API details: [[API-Reference]]
