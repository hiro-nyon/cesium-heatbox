# Development Environment Setup (開発環境のセットアップ)

[English](#english) | [日本語](#日本語)

## English

> **Note**: This library is not yet registered on npm. Please obtain it directly from GitHub.

### Requirements

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox

# Install dependencies
npm install
```

### Development Commands

```bash
# Start development server
npm run dev

# Build (all formats)
npm run build

# ESM build only
npm run build:esm

# UMD build only
npm run build:umd

# Generate type definitions
npm run build:types

# Watch mode
npm run build:watch

# Run tests
npm test

# Test watch mode
npm run test:watch

# Test with coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Benchmark
npm run benchmark

# Generate documentation
npm run docs

# Cleanup
npm run clean
```

### Project Structure

```
cesium-heatbox/
├── src/                    # Source code
│   ├── index.js           # Entry point
│   ├── Heatbox.js         # Main class
│   ├── core/              # Core functionality
│   │   ├── CoordinateTransformer.js
│   │   ├── VoxelGrid.js
│   │   ├── DataProcessor.js
│   │   └── VoxelRenderer.js
│   └── utils/             # Utilities
│       ├── constants.js
│       ├── validation.js
│       └── sampleData.js
├── test/                  # Test files
├── examples/              # Usage examples
├── docs/                  # Documentation
├── types/                 # TypeScript type definitions
└── dist/                  # Build output
```

### Development Guidelines

#### Coding Standards

- Use ESLint Standard Style
- Document with JSDoc format
- Function names start with verbs
- Constants use UPPER_SNAKE_CASE
- Class names use PascalCase

#### Commit Messages

```
type(scope): description

Examples:
feat(core): add new voxel rendering algorithm
fix(utils): handle edge case in coordinate transformation
docs(api): update API documentation
test(heatbox): add comprehensive test cases
```

#### Branch Strategy

- `main`: Stable version
- `develop`: Development version
- `feature/*`: New feature development
- `hotfix/*`: Emergency fixes

### Testing

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- Heatbox.test.js

# Generate coverage report
npm run test:coverage
```

#### Writing Tests

```javascript
describe('MyClass', () => {
  let instance;
  
  beforeEach(() => {
    instance = new MyClass();
  });
  
  test('should do something', () => {
    const result = instance.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Debugging

#### Browser Debugging

```bash
# Start development server
npm run dev

# Access http://localhost:8080 in browser
```

#### Node.js Debugging

```bash
# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Access chrome://inspect in Chrome DevTools
```

### Building

#### Development Build

```bash
npm run build:esm
```

#### Production Build

```bash
npm run build
```

Output files:
- `dist/cesium-heatbox.js` - ESM development version
- `dist/cesium-heatbox.min.js` - ESM production version
- `dist/cesium-heatbox.umd.js` - UMD development version
- `dist/cesium-heatbox.umd.min.js` - UMD production version

### Release

#### Version Management

```bash
# Patch version
npm version patch

# Minor version
npm version minor

# Major version
npm version major

# Push release tags
git push origin main --tags
```

#### Automated Release

GitHub Actions automatically:
1. Runs tests
2. Performs builds
3. Publishes to NPM
4. Creates GitHub Releases

when tags are pushed.

### Common Issues and Solutions

**npm install fails:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**ESLint configuration issues:**
- Use ESLint 8.x (9.x not supported)
- Use `.eslintrc.js` format

**Test failures:**
- Check import paths
- Verify Cesium mocks in `test/setup.js`

For detailed troubleshooting, see the Japanese section below.

## 日本語

> **注意**: このライブラリは現在npm未登録です。GitHubから直接取得する必要があります。

## 必要な環境

- Node.js 18.0.0 以上
- npm 8.0.0 以上
- Git

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/hiro-nyon/cesium-heatbox.git
cd cesium-heatbox

# 依存関係をインストール
npm install
```

## 開発コマンド

```bash
# 開発サーバーを起動
npm run dev

# ビルド（全形式）
npm run build

# ESMビルドのみ
npm run build:esm

# UMDビルドのみ
npm run build:umd

# 型定義生成
npm run build:types

# ウォッチモード
npm run build:watch

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# リンティング
npm run lint
npm run lint:fix

# 型チェック
npm run type-check

# ベンチマーク
npm run benchmark

# ドキュメント生成
npm run docs

# クリーンアップ
npm run clean
```

## プロジェクト構造

```
cesium-heatbox/
├── src/                    # ソースコード
│   ├── index.js           # エントリーポイント
│   ├── Heatbox.js         # メインクラス
│   ├── core/              # コア機能
│   │   ├── CoordinateTransformer.js
│   │   ├── VoxelGrid.js
│   │   ├── DataProcessor.js
│   │   └── VoxelRenderer.js
│   └── utils/             # ユーティリティ
│       ├── constants.js
│       ├── validation.js
│       └── sampleData.js
├── test/                  # テストファイル
├── examples/              # 使用例
├── docs/                  # ドキュメント
├── types/                 # TypeScript型定義
└── dist/                  # ビルド出力
```

## 開発ガイドライン

### コーディング規約

- ESLint Standard Style を使用
- JSDoc形式でドキュメントを記述
- 関数名は動詞で始める
- 定数は UPPER_SNAKE_CASE
- クラス名は PascalCase

### コミットメッセージ

```
type(scope): description

feat(core): add new voxel rendering algorithm
fix(utils): handle edge case in coordinate transformation
docs(api): update API documentation
test(heatbox): add comprehensive test cases
```

### ブランチ戦略

- `main`: 安定版
- `develop`: 開発版
- `feature/*`: 新機能開発
- `hotfix/*`: 緊急修正

## テスト

### テストの実行

```bash
# 全テストを実行
npm test

# 特定のテストファイルを実行
npm test -- Heatbox.test.js

# カバレッジレポートを生成
npm run test:coverage
```

### テストの書き方

```javascript
describe('MyClass', () => {
  let instance;
  
  beforeEach(() => {
    instance = new MyClass();
  });
  
  test('should do something', () => {
    const result = instance.doSomething();
    expect(result).toBe(expected);
  });
});
```

## デバッグ

### ブラウザでのデバッグ

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:8080 にアクセス
```

### Node.js でのデバッグ

```bash
# Node.js デバッガーで実行
node --inspect-brk node_modules/.bin/jest --runInBand

# Chrome DevTools で chrome://inspect にアクセス
```

## ビルド

### 開発ビルド

```bash
npm run build:esm
```

### 本番ビルド

```bash
npm run build
```

出力ファイル:
- `dist/cesium-heatbox.js` - ESM開発版
- `dist/cesium-heatbox.min.js` - ESM本番版
- `dist/cesium-heatbox.umd.js` - UMD開発版
- `dist/cesium-heatbox.umd.min.js` - UMD本番版

## リリース

### バージョン管理

```bash
# パッチバージョンを上げる
npm version patch

# マイナーバージョンを上げる
npm version minor

# メジャーバージョンを上げる
npm version major

# リリースタグをプッシュ
git push origin main --tags
```

### 自動リリース

GitHub Actions により、タグがプッシュされると自動的に:
1. テストが実行される
2. ビルドが行われる
3. NPMに公開される
4. GitHub Releasesが作成される

## トラブルシューティング

### よくある問題

#### `npm install` が失敗する

**問題**: 依存関係の競合エラー
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解決方法**:
```bash
# 1. キャッシュをクリア
npm cache clean --force

# 2. node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 3. 再インストール
npm install
```

#### ESLint設定の問題

**問題**: ESLintの設定ファイルの形式が古い
```
Error: ESLint configuration in eslint.config.js is invalid
```

**解決方法**:
- ESLint 8.x系を使用（9.x系は非対応）
- `.eslintrc.js`形式を使用（フラット設定は未対応）

#### Cesiumの型定義の問題

**問題**: `@types/cesium`パッケージの警告
```
warn deprecated @types/cesium@1.70.4: This is a stub types definition. 
cesium provides its own type definitions, so you don't need this installed.
```

**解決方法**:
```bash
# @types/cesiumを削除（CesiumJS本体が型定義を提供）
npm uninstall @types/cesium
```

#### テストが失敗する

**問題**: Jest設定の問題
```
Unknown option "moduleNameMapping" with value
```

**解決方法**:
- `jest.config.js`で`moduleNameMapping`を`moduleNameMapper`に修正

**問題**: テストファイルのimportパスエラー
```
Cannot find module '../src/core/CoordinateTransformer.js'
```

**解決方法**:
- 相対パスを正しく設定（`../../src/core/...`）

**問題**: Cesiumオブジェクトの未定義エラー
```
TypeError: Cesium.Cartesian3 is not a constructor
```

**解決方法**:
- `test/setup.js`でCesiumのモックを適切に設定

## サポート

問題が発生した場合は、以下の方法でサポートを受けられます:

1. [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues) で報告
2. [Discussion](https://github.com/hiro-nyon/cesium-heatbox/discussions) で質問
3. メールでの問い合わせ

## コントリビューション

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

詳細は [CONTRIBUTING.md](contributing.md) を参照してください。
