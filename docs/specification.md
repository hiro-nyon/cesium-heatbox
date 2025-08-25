# CesiumJS Heatbox ライブラリ仕様書

> **⚠️ 注意**: このライブラリは現在npm未登録です。GitHubから直接取得する必要があります。

**バージョン**: 0.1.5  
**最終更新**: 2025年10月  
**作成者**: hiro-nyon  

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術仕様](#技術仕様)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [API仕様](#api仕様)
5. [パフォーマンス要件](#パフォーマンス要件)
6. [エラーハンドリング](#エラーハンドリング)
7. [UI/UX仕様](#uiux仕様)
8. [テスト仕様](#テスト仕様)
9. [実装ガイドライン](#実装ガイドライン)
10. [制約事項](#制約事項)
11. [将来的な拡張](#将来的な拡張)

---

## プロジェクト概要

### 目的

CesiumJS環境内の既存エンティティを対象とした3Dボクセルベースヒートマップ可視化ライブラリ「Heatbox」を開発する。地理的空間内のエンティティ分布を固定サイズのボクセルで分割し、各ボクセル内のエンティティ密度を3D空間で可視化することで、空間的なデータ分析を支援する。

### 基本方針

- **Entityベース**: 既存のCesium Entityから自動でデータを取得
- **自動範囲設定**: エンティティ分布から最適な直方体（AABB）範囲を自動計算
- **最小ボクセル数**: 指定された範囲を内包する最小限のボクセル数で効率的に処理
- **相対的色分け**: データ内の最小値・最大値に基づく動的色分け
- **段階的開発**: v0.1.0では基本機能に集中し、将来的に拡張

### 対象ユーザー

- CesiumJSを使用した地理空間アプリケーション開発者
- 3D空間でのデータ密度分析が必要な研究者・アナリスト
- 建築・都市計画分野での3D可視化を行う専門家

---

## 技術仕様

### 技術スタック

#### 開発環境
- **モジュールシステム**: ESモジュール（ES6 import/export）
- **ビルドツール**: Webpack 5
- **トランスパイラ**: Babel（ES2015+対応）
- **テストフレームワーク**: Jest
- **リンター**: ESLint（JavaScript Standard Style）
- **パッケージマネージャー**: npm
- **型チェック**: TypeScript（型定義ファイル）

#### 依存関係管理

##### peerDependencies
```json
{
  "cesium": "^1.120.0"
}
```

##### devDependencies
```json
{
  "@babel/core": "^7.26.0",
  "@babel/preset-env": "^7.26.0",
  "@babel/preset-typescript": "^7.26.0",
  "@babel/eslint-parser": "^7.25.0",
  "@types/node": "^22.10.0",
  "@types/cesium": "^1.130.0",
  "@typescript-eslint/eslint-plugin": "^8.15.0",
  "@typescript-eslint/parser": "^8.15.0",
  "babel-jest": "^30.0.0",
  "babel-loader": "^9.2.0",
  "eslint": "^9.15.0",
  "eslint-config-standard": "^17.1.0",
  "eslint-plugin-jest": "^29.0.0",
  "jest": "^30.0.0",
  "jsdoc": "^4.0.4",
  "typescript": "^5.7.0",
  "webpack": "^5.97.0",
  "webpack-cli": "^6.0.0",
  "webpack-dev-server": "^5.2.0",
  "eslint-webpack-plugin": "^4.2.0"
}
```

##### dependencies
```json
{}
```
※ 軽量化のため、runtime dependenciesは使用しない

#### 対応モジュール形式

##### ESモジュール（推奨）
```javascript
// モダンブラウザ・Node.js環境向け
import Heatbox from 'cesium-heatbox';
import { generateTestEntities } from 'cesium-heatbox';
```

##### UMD（レガシー対応）
```html
<!-- ブラウザ直接読み込み -->
<script src="cesium-heatbox.umd.js"></script>
<script>
  const heatbox = new CesiumHeatbox(viewer);
</script>
```

##### CommonJS（Node.js環境）
```javascript
// 古いNode.js環境
const Heatbox = require('cesium-heatbox');
```

#### TypeScript型定義

```typescript
// types/index.d.ts
declare module 'cesium-heatbox' {
  export interface HeatboxOptions {
    voxelSize?: number;
    opacity?: number;
    emptyOpacity?: number;
    showOutline?: boolean;
    showEmptyVoxels?: boolean;
    minColor?: [number, number, number];
    maxColor?: [number, number, number];
    maxRenderVoxels?: number;
    batchMode?: 'auto' | 'primitive' | 'entity';
  }

  export interface HeatboxStatistics {
    totalVoxels: number;
    renderedVoxels: number;
    nonEmptyVoxels: number;
    emptyVoxels: number;
    totalEntities: number;
    minCount: number;
    maxCount: number;
    averageCount: number;
  }

  export default class Heatbox {
    constructor(viewer: any, options?: HeatboxOptions);
    setData(entities: any[]): void;
    updateOptions(newOptions: HeatboxOptions): void;
    setVisible(show: boolean): void;
    clear(): void;
    destroy(): void;
    getStatistics(): HeatboxStatistics | null;
    getBounds(): object | null;
  }

  export function createHeatbox(viewer: any, options: HeatboxOptions): Heatbox;
  export function getAllEntities(viewer: any): any[];
  export function generateTestEntities(viewer: any, bounds: any, count?: number): any[];
  export function getEnvironmentInfo(): object;
}
```

#### ビルド設定

##### Webpack設定
```javascript
// webpack.config.js
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 
        'cesium-heatbox.min.js' : 
        'cesium-heatbox.js',
      library: {
        name: 'CesiumHeatbox',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'this',
      clean: true
    },
    
    externals: {
      cesium: {
        commonjs: 'cesium',
        commonjs2: 'cesium',
        amd: 'cesium',
        root: 'Cesium'
      }
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ["> 1%", "last 2 versions", "not dead"]
                  }
                }]
              ]
            }
          }
        }
      ]
    },
    
    plugins: [
      new ESLintPlugin({
        extensions: ['js'],
        configType: 'eslintrc',
        fix: true
      })
    ],
    
    resolve: {
      extensions: ['.js']
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
      minimize: isProduction
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'examples'),
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true
    }
  };
};
```

##### Babel設定
```json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": ["> 1%", "last 2 versions", "not dead"]
      },
      "modules": false
    }],
    "@babel/preset-typescript"
  ],
  "env": {
    "test": {
      "presets": [
        ["@babel/preset-env", {
          "targets": { "node": "current" }
        }],
        "@babel/preset-typescript"
      ]
    }
  }
}
```

##### ESLint設定（最新フラット設定）
```javascript
// eslint.config.js (ESLint 9.0+対応)
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        Cesium: 'readonly'
      }
    },
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules
    }
  },
  {
    files: ['test/**/*.js', 'test/**/*.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off'
    }
  }
];
```

##### Jest設定
```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  moduleNameMapping: {
    '^@/(.*)': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/index.{js,ts}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\.(js|ts)': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/test/**/*.{test,spec}.{js,ts}'
  ]
};
```

##### TypeScript設定
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "declarationDir": "./types",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test"
  ]
}
```

#### 対応ブラウザ

##### 最小要件
- **Chrome**: 90+
- **Firefox**: 90+
- **Safari**: 14+
- **Edge**: 90+

##### 推奨環境
- **Chrome**: 100+（最新版）
- **Firefox**: 100+（最新版）
- **Safari**: 15+
- **Edge**: 100+（最新版）

#### Node.js要件

##### 開発環境
- **Node.js**: 18.0.0+
- **npm**: 8.0.0+

##### ランタイム要件
- **ESM対応**: Node.js 14.0.0+
- **型チェック**: TypeScript 4.5.0+

### 座標系と変換

#### 入力座標系
- **WGS84地理座標**: 経度（度）、緯度（度）、高度（メートル）
- **Cesium Entity.position**: Cartesian3またはPropertyによる位置情報

#### 内部処理座標系
- **ローカル直交座標系**: East-North-Up (ENU) 座標系
- **変換方法**: `Cesium.Transforms.eastNorthUpToFixedFrame()`
- **単位**: メートル

#### 座標変換の実装

```javascript
// 度からメートルへの概算変換
const lonRangeMeters = (maxLon - minLon) * 111000 * Math.cos(centerLat_rad);
const latRangeMeters = (maxLat - minLat) * 111000;

// ボクセルインデックス計算
const voxelX = Math.floor(
    (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * grid.numVoxelsX
);
const voxelY = Math.floor(
    (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) * grid.numVoxelsY
);
const voxelZ = Math.floor(
    (alt - bounds.minAlt) / (bounds.maxAlt - bounds.minAlt) * grid.numVoxelsZ
);
```

### データ処理アルゴリズム

#### 処理フロー

1. **Entity範囲計算**: `CoordinateTransformer.calculateBounds(entities)`
   - 全エンティティの3D Bounding Boxを計算
   - 有効な位置情報を持つエンティティのみを対象
   
2. **ボクセルグリッド生成**: `VoxelGrid.createGrid(bounds, voxelSize)`
   - 範囲を内包する最小のボクセルグリッドを生成
   - ボクセル数 = ceil(範囲_メートル / ボクセルサイズ_メートル)
   
3. **エンティティ分類**: `DataProcessor.classifyEntitiesIntoVoxels(entities, bounds, grid)`
   - 各エンティティのボクセルインデックスを計算
   - Map構造でボクセルごとのエンティティリストを管理
   
4. **統計計算**: `DataProcessor.calculateStatistics(voxelData, grid)`
   - 密度の最小値・最大値・平均値を計算
   - 空ボクセル数もカウント
   
5. **可視化**: `VoxelRenderer.render(voxelData, bounds, grid, stats)`
   - **描画はCesium.Entity.BoxをGeometryInstance + Primitiveでバッチ化して行う**
   - 密度に応じた色分けを適用

### ボクセル管理

#### ボクセルサイズ仕様
- **推奨範囲**: 10-100メートル
- **デフォルト値**: 20メートル
- **用途別推奨値**:
  - 5-10m: 建物内部解析（超詳細）
  - 10-20m: 建物レベル解析
  - 20-50m: 街区レベル解析
  - 50-100m: 地区レベル解析

#### 空ボクセル処理
- **デフォルト**: 非表示（パフォーマンス重視）
- **オプション**: 表示可能（全体構造把握用）
- **空ボクセル色**: `Cesium.Color.LIGHTGRAY`
- **空ボクセル透明度**: 0.01-0.2（ユーザー調整可能）

#### 色分けアルゴリズム
- **カラーマップ**: HSV補間による線形色分け
- **デフォルト色範囲**: 
  - minColor: [0, 32, 255] （青系）
  - maxColor: [255, 64, 0] （赤系）
- **正規化**: 密度の最小値・最大値から相対的色分け
- **極値処理**: 高密度点の視認性を最適化

#### バッチ描画実装（VoxelRenderer.js）

```javascript
class VoxelRenderer {
  createBatchedVoxels(voxelData, options) {
    const instances = [];
    const { minCount, maxCount } = this.statistics;
    
    voxelData.forEach((voxel) => {
      // HSV補間による色計算
      const normalizedDensity = (voxel.count - minCount) / (maxCount - minCount);
      const hue = (1.0 - normalizedDensity) * 240; // 青(240°) → 赤(0°)
      const saturation = 0.8 + normalizedDensity * 0.2; // 彩度調整
      const brightness = 0.7 + normalizedDensity * 0.3; // 明度調整
      
      const color = Cesium.Color.fromHsl(hue / 360, saturation, brightness);
      
      // GeometryInstance作成
      const instance = new Cesium.GeometryInstance({
        geometry: new Cesium.BoxGeometry({
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          dimensions: new Cesium.Cartesian3(
            grid.cellSizeX,
            grid.cellSizeY,
            grid.cellSizeZ
          )
        }),
        modelMatrix: Cesium.Matrix4.multiplyByTranslation(
          Cesium.Transforms.eastNorthUpToFixedFrame(voxel.worldPosition),
          new Cesium.Cartesian3(0, 0, grid.cellSizeZ / 2),
          new Cesium.Matrix4()
        ),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            color.withAlpha(this.options.opacity)
          )
        }
      });
      
      instances.push(instance);
    });
    
    // Primitive作成（バッチ描画）
    const primitive = new Cesium.Primitive({
      geometryInstances: instances,
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: true,
        translucent: this.options.opacity < 1.0
      }),
      allowPicking: true
    });
    
    return primitive;
  }
}
```

---

## アーキテクチャ設計

### プロジェクト構造

```
cesium-heatbox/
├── package.json                 # パッケージ設定・依存関係
├── webpack.config.js           # Webpackビルド設定
├── babel.config.js             # Babel設定
├── jest.config.js              # Jest設定
├── .eslintrc.js               # ESLint設定
├── tsconfig.json              # TypeScript設定
├── README.md                  # プロジェクト概要
├── LICENSE                    # MITライセンス
├── CHANGELOG.md               # 変更履歴
├── .gitignore                 # Git除外設定
├── .github/                   # GitHub Actions
│   └── workflows/
│       ├── ci.yml            # CI/CDパイプライン
│       └── release.yml       # リリース自動化
├── src/                       # ソースコード
│   ├── index.js              # メインエントリーポイント
│   ├── Heatbox.js            # 主要クラス
│   ├── core/                 # 核心機能
│   │   ├── CoordinateTransformer.js
│   │   ├── VoxelGrid.js
│   │   ├── DataProcessor.js
│   │   └── VoxelRenderer.js
│   └── utils/                # ユーティリティ
│       ├── sampleData.js
│       ├── validation.js
│       └── constants.js
├── dist/                      # ビルド出力
│   ├── cesium-heatbox.js
│   ├── cesium-heatbox.min.js
│   ├── cesium-heatbox.umd.js
│   └── cesium-heatbox.d.ts
├── types/                     # TypeScript型定義
│   └── index.d.ts
├── test/                      # テストコード
│   ├── Heatbox.test.js
│   ├── integration/
│   └── fixtures/
├── examples/                  # 使用例
│   ├── basic/
│   │   ├── index.html
│   │   └── app.js
│   ├── advanced/
│   └── performance/
├── docs/                      # ドキュメント
│   ├── API.md
│   ├── getting-started.md
│   ├── examples.md
│   └── contributing.md
└── tools/                     # 開発ツール
    ├── build.js
    ├── test-coverage.js
    └── benchmark.js
```

### ビルドプロセス

#### 開発ビルド
```bash
# 開発サーバー起動
npm run dev

# ウォッチモード
npm run build:watch

# リンティング
npm run lint
npm run lint:fix
```

#### 本番ビルド
```bash
# 全ての形式でビルド
npm run build

# ESM版のみ
npm run build:esm

# UMD版のみ  
npm run build:umd

# 型定義生成
npm run build:types
```

#### 品質チェック
```bash
# テスト実行
npm test
npm run test:watch
npm run test:coverage

# 型チェック
npm run type-check

# パフォーマンステスト
npm run benchmark
```

### 配布仕様

#### NPMパッケージ構成（現行）
```json
{
  "name": "cesium-heatbox",
  "version": "0.1.4",
  "main": "dist/cesium-heatbox.umd.min.js",
  "module": "dist/cesium-heatbox.min.js",
  "types": "types/index.d.ts",
  "browser": "dist/cesium-heatbox.umd.min.js",
  "files": [
    "dist/",
    "types/",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/cesium-heatbox.min.js",
      "require": "./dist/cesium-heatbox.umd.min.js",
      "default": "./dist/cesium-heatbox.umd.min.js"
    }
  }
}
```

#### CDN配布
```html
<!-- jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/cesium-heatbox@0.1.0/dist/cesium-heatbox.min.js"></script>

<!-- unpkg CDN -->
<script src="https://unpkg.com/cesium-heatbox@0.1.0/dist/cesium-heatbox.min.js"></script>
```

### クラス構造

```javascript
class Heatbox {
    constructor(viewer, options)
    setData(entities)
    updateOptions(newOptions)
    setVisible(show)
    clear()
    destroy()
    getStatistics()
    getBounds()
}
```

### データ構造

#### Bounds（境界情報）
```javascript
const bounds = {
    minLon: number,     // 最小経度
    maxLon: number,     // 最大経度
    minLat: number,     // 最小緯度
    maxLat: number,     // 最大緯度
    minAlt: number,     // 最小高度
    maxAlt: number,     // 最大高度
    centerLon: number,  // 中心経度
    centerLat: number,  // 中心緯度
    centerAlt: number   // 中心高度
};
```

#### Grid（グリッド情報）
```javascript
const grid = {
    numVoxelsX: number,        // X方向ボクセル数
    numVoxelsY: number,        // Y方向ボクセル数
    numVoxelsZ: number,        // Z方向ボクセル数
    totalVoxels: number,       // 総ボクセル数
    voxelSizeMeters: number,   // ボクセルサイズ（メートル）
    lonRangeMeters: number,    // 経度範囲（メートル）
    latRangeMeters: number,    // 緯度範囲（メートル）
    altRangeMeters: number     // 高度範囲（メートル）
};
```

#### VoxelData（ボクセルデータ）
```javascript
const voxelData = new Map(); // Key: "x,y,z", Value: VoxelInfo

const voxelInfo = {
    x: number,              // ボクセルX座標
    y: number,              // ボクセルY座標  
    z: number,              // ボクセルZ座標
    entities: Entity[],     // 含まれるエンティティ配列
    count: number          // エンティティ数
};
```

---

## API仕様

### コンストラクタ

```javascript
new Heatbox(viewer, options)
```

**パラメータ**:
- `viewer` (Cesium.Viewer): CesiumJSビューワーインスタンス
- `options` (Object): 設定オプション

**オプション**:
```javascript
const options = {
    voxelSize: 20,                    // 目標ボクセルサイズ（メートル）（実寸は cellSizeX/Y/Z）
    opacity: 0.8,                     // データボクセルの透明度
    emptyOpacity: 0.03,               // 空ボクセルの透明度
    showOutline: true,                // アウトライン表示
    showEmptyVoxels: false,           // 空ボクセル表示
    minColor: [0, 32, 255],          // 最小密度の色（RGB）
    maxColor: [255, 64, 0],          // 最大密度の色（RGB）
    maxRenderVoxels: 50000,          // 最大描画ボクセル数
    batchMode: 'auto'                // 'auto' | 'primitive' | 'entity'
};
```

### 主要メソッド

#### setData(entities)

```javascript
heatbox.setData(entities);
```

**パラメータ**:
- `entities` (Array<Cesium.Entity>): 対象エンティティ配列

**説明**:
エンティティ配列からヒートマップデータを作成し、描画します。このメソッドは非同期ではありません。処理が完了すると、`getStatistics()`で統計情報を取得できます。

#### updateOptions(newOptions)

```javascript
heatbox.updateOptions({ voxelSize: 30 });
```

**パラメータ**:
- `newOptions` (Object): 更新したいオプション

**説明**:
既存のヒートマップのオプションを更新し、再描画します。

#### その他のメソッド

```javascript
// 表示/非表示切り替え
heatbox.setVisible(true/false);

// 統計情報取得
const stats = heatbox.getStatistics();

// 境界情報取得
const bounds = heatbox.getBounds();

// 全クリア
heatbox.clear();

// インスタンス破棄
heatbox.destroy();
```

### ユーティリティ関数

```javascript
// Heatboxインスタンスを生成するヘルパー関数
const heatbox = createHeatbox(viewer, options);

// 全エンティティ取得
const allEntities = getAllEntities(viewer);

// テスト用エンティティ生成
const testEntities = generateTestEntities(viewer, bounds, count);

// 環境情報取得
const envInfo = getEnvironmentInfo();
```

---

## パフォーマンス要件

### 処理時間目標

| エンティティ数 | 処理時間目標 | ボクセル数目安 | Instanced FPS |
|---------------|-------------|---------------|---------------|
| 100-500       | < 1秒       | < 5,000       | ≥ 60          |
| 500-1,500     | < 3秒       | < 15,000      | ≥ 58          |
| 1,500-3,000   | < 5秒       | < 30,000      | ≥ 56          |
| 3,000+        | < 10秒      | < 50,000      | ≥ 55          |

### メモリ使用量

- **基本メモリ**: 10-20MB（ライブラリ本体）
- **ボクセルデータ**: (2KB × 非空ボクセル) + (0.2KB × 空ボクセル)
- **最大推奨**: 100MB以下

### 制限値

```javascript
const performanceLimits = {
    maxEntities: 5000,              // 処理可能な最大エンティティ数
    maxVoxels: 50000,              // 描画可能な最大ボクセル数
    maxEmptyVoxelsRendered: 10000,  // 空ボクセル描画上限
    minVoxelSize: 5,               // 最小ボクセルサイズ（メートル）
    maxVoxelSize: 1000,            // 最大ボクセルサイズ（メートル）
    warningThreshold: 30000        // 警告表示のボクセル数閾値
};
```

### 最適化手法

1. **スパース表現**: 空ボクセルは必要時のみ描画
2. **視野外カリング**: 画面外のボクセルをスキップ
3. **LOD考慮**: 距離に応じた詳細度調整（将来実装）
4. **バッチ処理**: エンティティの一括処理

---

## エラーハンドリング

### エラー分類と対応

#### 入力データエラー
```javascript
// エンティティなし
if (entities.length === 0) {
    throw new Error('対象エンティティがありません');
}

// 無効な位置情報
if (!position || isNaN(position.x)) {
    console.warn(`エンティティ ${index} の位置が無効です`);
    continue; // スキップして処理継続
}
```

#### リソース制限エラー
```javascript
// ボクセル数上限超過
if (totalVoxels > maxVoxels) {
    throw new Error(
        `ボクセル数が上限(${maxVoxels})を超えています: ${totalVoxels}個\n` +
        `ボクセルサイズを${recommendedSize}m以上に増やしてください`
    );
}

// メモリ不足警告
if (estimatedMemory > warningThreshold) {
    console.warn(
        `推定メモリ使用量: ${estimatedMemory}MB\n` +
        `パフォーマンスが低下する可能性があります`
    );
}
```

#### システムエラー
```javascript
// Viewer未初期化
if (!this.viewer) {
    throw new Error('CesiumJS Viewerが初期化されていません');
}

// WebGL対応チェック
if (!viewer.scene.canvas.getContext('webgl')) {
    throw new Error('WebGLがサポートされていません');
}
```

### エラー回復処理

1. **Graceful Degradation**: 制限超過時は描画数を制限（`maxRenderVoxels`）。v0.1.4 からは `autoVoxelSize` によりボクセルサイズの自動調整に対応。
2. **部分処理継続**: 一部エンティティの処理失敗時も継続
3. **リソース解放**: エラー時も確実にメモリ・リソースを解放

---

## UI/UX仕様

### 推奨設定値

```javascript
const defaultSettings = {
    voxelSize: 20,              // 東京駅規模に最適
    entityCount: 800,           // バランスの良い数
    opacity: 0.8,               // データボクセル
    emptyOpacity: 0.03,         // 空ボクセル
    showOutline: true,          // 境界線表示
    showEmptyVoxels: false      // 空ボクセル非表示
};
```

### コントロール範囲

```javascript
const controlRanges = {
    voxelSize: { 
        min: 10, max: 100, step: 5,
        sliderRange: [10, 50]    // UIスライダーの推奨範囲
    },
    entityCount: { 
        min: 50, max: 3000, step: 50,
        recommended: [200, 1500]  // 推奨範囲
    },
    opacity: { 
        min: 0.1, max: 1.0, step: 0.1,
        dataVoxel: [0.5, 1.0],   // データボクセル推奨
        emptyVoxel: [0.01, 0.2]  // 空ボクセル推奨
    }
};
```

### ユーザーフィードバック

#### 進捗表示
- エンティティ処理中: 「テストエンティティを生成中...」
- ボクセル作成中: 「ヒートマップを作成中...」
- 完了時: 「作成完了: XXX個の非空ボクセル」

#### 統計情報表示
```javascript
const statisticsUI = {
    format: `
        総ボクセル数: ${stats.totalVoxels.toLocaleString()}
        表示ボクセル数: ${stats.renderedVoxels.toLocaleString()}
        非空ボクセル数: ${stats.nonEmptyVoxels.toLocaleString()}
        総エンティティ数: ${stats.totalEntities.toLocaleString()}
        最小密度: ${stats.minCount}
        最大密度: ${stats.maxCount}
        平均密度: ${stats.averageCount.toFixed(2)}
    `,
    updateTiming: "リアルタイム更新"
};
```

#### エラーメッセージ
- 具体的な原因と対処法を含む
- ユーザーが理解しやすい平易な表現
- 推奨設定値の提示

---

## テスト仕様

### 単体テスト

#### カバレッジ要件
- **最小カバレッジ**: 80%
- **重要メソッド**: 95%以上
- **エラーハンドリング**: 100%

#### テストケース
```javascript
describe('Heatbox', () => {
    // 正常系テスト
    test('基本的なヒートマップ作成', () => {});
    test('異なるボクセルサイズでの動作', () => {});
    test('空ボクセル表示の切り替え', () => {});
    
    // 異常系テスト
    test('エンティティなしでのエラー処理', () => {});
    test('無効な位置情報の処理', () => {});
    test('メモリ上限超過時の処理', () => {});
});
```

### パフォーマンステスト

#### ベンチマークスイート（Vitest + @vitest/bench）

```bash
# FPSとメモリをCSV出力
npm run benchmark
```

#### 測定項目
- 処理時間（エンティティ数別）
- メモリ使用量
- 描画フレームレート
- ブラウザ別の性能差

#### ベンチマーク設定
```javascript
// vitest.bench.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    benchmark: {
      include: ['test/benchmark/**/*.bench.{js,ts}'],
      outputFile: './benchmark-results.csv',
      reporters: ['verbose', 'csv']
    }
  }
});
```

#### ベンチマーク環境
- **CPU**: Intel i5 8th gen以上
- **メモリ**: 8GB以上
- **GPU**: WebGL 2.0対応
- **ブラウザ**: Chrome 90+, Firefox 90+, Safari 14+

### 統合テスト

#### テストシナリオ
1. 東京駅周辺での実データテスト
2. 大量エンティティでの負荷テスト
3. **極値ケース（100mボクセル×500m範囲）**: 新E2Eテストシナリオ
4. 異なる地理的範囲でのテスト
5. ユーザーインタラクションテスト

#### 極値ケース詳細
```javascript
// test/e2e/extreme-cases.test.js
describe('極値ケーステスト', () => {
  test('100mボクセル×500m範囲での性能', async () => {
    const bounds = { /* 500m × 500m range */ };
    const options = { voxelSize: 100 };
    const entities = generateTestEntities(viewer, bounds, 1000);
    
    const startTime = performance.now();
    await heatmap.createFromEntities(entities);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(3000); // 3秒以内
    expect(heatmap.getStatistics().renderedVoxels).toBeLessThan(125); // 5×5×5
  });
});
```

---

## 実装ガイドライン

### コーディング規約

#### ESLint設定
```javascript
module.exports = {
    extends: ['standard'],
    rules: {
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error'
    },
    globals: {
        Cesium: 'readonly'
    }
};
```

#### JSDoc規約
```javascript
/**
 * エンティティからヒートマップを作成
 * @param {Array<Cesium.Entity>} entities - 対象エンティティ配列
 * @returns {Promise<Object>} 統計情報
 * @throws {Error} エンティティが空の場合
 * @example
 * const stats = await heatbox.createFromEntities(entities);
 */
```

### 数学的背景

#### 座標変換の理論
- **WGS84楕円体**: a=6378137m, f=1/298.257223563
- **緯度1度の距離**: 約111,000m
- **経度1度の距離**: 約111,000m × cos(緯度)

#### ボクセル分割アルゴリズム
```javascript
// 3D空間の均等分割
const voxelIndex = {
    x: Math.floor((position.x - minX) / voxelSize),
    y: Math.floor((position.y - minY) / voxelSize), 
    z: Math.floor((position.z - minZ) / voxelSize)
};
```

### ベストプラクティス

1. **メモリ管理**: 大量のボクセル生成時はバッチ処理
2. **エラー処理**: 処理継続可能なエラーは警告レベル
3. **パフォーマンス**: 重い処理は非同期で実行
4. **ユーザビリティ**: 進捗表示と中断機能の提供

---

## 制約事項

### 技術的制約

#### システム要件
- **CesiumJS**: 1.120.0以上
- **Node.js**: 18.0.0以上（開発環境）
- **WebGL**: 2.0対応ブラウザ
- **メモリ**: 4GB以上推奨

#### 機能制約
- **固定ボクセルサイズ**: 均一サイズのみサポート
- **リアルタイム更新**: 未対応（v0.1.0）
- **データ永続化**: セッション内のみ
- **並列処理**: WebWorker未対応

### 地理的制約

#### 座標系制限
- **極地対応**: 極地付近では精度低下
- **日付変更線**: 180度跨ぎでの特別処理が必要
- **高度範囲**: 地下・成層圏での使用は未検証

#### スケール制限
```javascript
const scaleConstraints = {
    minimumArea: "10m × 10m",      // 最小解析範囲
    maximumArea: "10km × 10km",    // 最大解析範囲
    recommendedArea: "100m-1km",    // 推奨範囲
    heightRange: "0-1000m"         // 推奨高度範囲
};
```

### パフォーマンス制約

#### ハードウェア要件
- **GPU**: WebGL対応必須
- **RAM**: 8GB以上推奨
- **CPU**: マルチコア推奨

#### ソフトウェア制約
- **ブラウザメモリ制限**: 通常2-4GB
- **WebGL制限**: 最大テクスチャサイズ等
- **JavaScript実行時間**: 長時間処理でのブラウザ応答停止

---

## 将来的な拡張

### v0.2.0 計画機能

#### 動的機能
- **リアルタイム更新**: エンティティ変更の自動反映
- **アニメーション**: 時系列データの再生機能
- **インタラクション**: ボクセルクリック・ホバーイベント

#### データソース選択機能
- **データソース指定**: 特定のデータソースのエンティティのみでヒートマップ生成
  - `createFromDataSource(viewer, dataSource, options)`: 指定したデータソースから生成
  - `createFromDataSourceByName(viewer, dataSourceName, options)`: 名前指定での生成
- **データソース切り替え**: 複数のデータソース間でのヒートマップ比較
  - `switchDataSource(dataSource)`: 動的なデータソース切り替え
  - `updateFromDataSource(dataSource)`: 指定データソースでの更新
- **データソース統合**: 複数のデータソースを組み合わせたヒートマップ作成
  - `createFromMultipleDataSources(viewer, dataSources, options)`: 複数データソース統合
  - `addDataSource(dataSource)`: 追加データソースの結合
- **データソース管理**: データソースの一覧表示・名前検索機能
  - `getAvailableDataSources()`: 利用可能なデータソース一覧取得
  - `findDataSourceByName(name)`: 名前によるデータソース検索
  - `getDataSourceInfo(dataSource)`: データソース詳細情報取得

#### カスタマイゼーション
- **カスタム色スケール**: グラデーション、カテゴリ別色分け
- **フィルタリング**: 属性による条件絞り込み
- **エクスポート**: PNG、データCSV出力

### v0.3.0 計画機能

#### 高度な解析
- **階層ボクセル**: 異なる詳細度レベル（LOD）
- **統計解析**: 分散、相関係数等の高度統計
- **補間機能**: 3D空間での密度補間

#### パフォーマンス最適化
- **WebWorker**: バックグラウンド処理
- **★★★ WebGPU対応調査**: 次世代GPU演算の導入検討
- **★★★ カラーLUTテクスチャ化**: 色分け処理のGPU最適化

### 長期ロードマップ

#### v1.0.0 機能
- **プロダクション品質**: エンタープライズ環境対応
- **プラグインシステム**: サードパーティ拡張
- **クラウド連携**: データベース直接接続

#### 研究開発項目
- **機械学習統合**: 異常検知、パターン認識
- **AR/VR対応**: WebXR環境での3D表示
- **分散処理**: 大規模データの並列解析

---

## CI/CD・リリース管理

### 継続的インテグレーション

#### GitHub Actions設定
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
      
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

#### 品質ゲート
- **リンティング**: ESLint Standard設定
- **型チェック**: TypeScript strict mode
- **テストカバレッジ**: 80%以上
- **ビルド成功**: 全対応形式
- **パフォーマンス**: ベンチマーク基準内

### リリースプロセス

#### セマンティックバージョニング
```
MAJOR.MINOR.PATCH

- MAJOR: 破壊的変更
- MINOR: 新機能追加（後方互換あり）
- PATCH: バグフィックス
```

#### リリース手順
```bash
# 1. 機能完成・テスト完了
npm run test:all
npm run build:all

# 2. バージョン更新
npm version patch|minor|major

# 3. CHANGELOG更新
npm run changelog

# 4. リリース
git push origin main --tags
npm publish
```

#### 自動リリース
```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build:all
      - run: npm test:all
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      - uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### デプロイメント戦略

#### 段階的リリース
1. **Alpha版**: 内部テスト用（@alpha タグ）
2. **Beta版**: 限定ユーザー向け（@beta タグ）
3. **RC版**: リリース候補（@rc タグ）
4. **Stable版**: 本番リリース（@latest タグ）

#### ロールバック計画
- **緊急時**: 前バージョンへの即座復旧
- **非互換性**: 移行ガイドの提供
- **データ保護**: 設定・データの下位互換

### 監視・メトリクス

#### 使用統計
- **NPMダウンロード数**: 週次・月次
- **GitHub Star数**: 人気度指標
- **Issue・PR数**: 開発活動度

#### 品質メトリクス
- **テストカバレッジ**: 継続的向上
- **パフォーマンス**: ベンチマーク推移
- **バンドルサイズ**: サイズ増加監視

---

## 付録

### A. 設定例

#### 小規模解析（建物レベル）
```javascript
const buildingLevelConfig = {
    voxelSize: 10,
    area: "100m × 100m",
    entities: 500,
    useCase: "建物内人流解析"
};
```

#### 中規模解析（街区レベル）
```javascript
const blockLevelConfig = {
    voxelSize: 25,
    area: "500m × 500m", 
    entities: 1500,
    useCase: "商業地区分析"
};
```

#### 大規模解析（地区レベル）
```javascript
const districtLevelConfig = {
    voxelSize: 50,
    area: "1km × 1km",
    entities: 3000,
    useCase: "都市計画支援"
};
```

### B. トラブルシューティング

#### よくある問題と解決策

**問題**: メモリ不足エラー
**解決**: ボクセルサイズを2倍に増やす、エンティティ数を削減

**問題**: 処理が遅い
**解決**: 空ボクセル表示をオフ、ボクセル数を1万個以下に

**問題**: 色が表示されない
**解決**: 透明度設定を確認、最小・最大密度の差を確認

### C. 参考資料

- [CesiumJS公式ドキュメント](https://cesium.com/learn/)
- [WebGL仕様書](https://www.khronos.org/webgl/)
- [WGS84座標系について](https://ja.wikipedia.org/wiki/WGS84)
- [3D可視化のベストプラクティス](https://example.com/3d-viz)

---

**ドキュメント管理**
- **作成日**: 2025年7月
- **バージョン**: v0.1.1-spec
- **次回更新予定**: v0.1.1リリース後
