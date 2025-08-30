# Development Guide for Beginners (開発初心者向けガイド)

[English](#english) | [日本語](#日本語)

## English

> **Note**: This library is not yet registered on npm. Please obtain it directly from GitHub.

**Target Audience**: Development beginners and those new to JavaScript/Node.js library development  
**Purpose**: Understand the development and release procedures for the cesium-heatbox project

### Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Git Basics](#git-basics)
3. [About npm (Node Package Manager)](#about-npm-node-package-manager)
4. [Version Management and Tagging](#version-management-and-tagging)
5. [Development Workflow](#development-workflow)
6. [Testing and Building](#testing-and-building)
7. [Release Process](#release-process)
8. [Troubleshooting](#troubleshooting)

#### Development Environment Setup

**Required Software:**

1. **Node.js (Required)**
   ```bash
   node --version  # v18.0.0 or higher required
   npm --version   # v8.0.0 or higher required
   ```

2. **Git (Required)**
   ```bash
   git --version
   ```

3. **Visual Studio Code (Recommended)**
   - Recommended extensions: JavaScript snippets, ESLint, Prettier, GitLens

**Project Setup:**
```bash
cd /path/to/cesium-heatbox
npm install
npm run dev
```

#### Git Basics

Git is a version control system for tracking code changes and enabling collaboration. Key concepts include repositories, commits, branches, tags, and remote/local repositories.

**Basic Commands:**
```bash
# Check status
git status
git diff

# Record changes
git add .
git commit -m "commit message"

# Sync with remote
git pull origin main
git push origin main

# Branch operations
git branch
git checkout -b feature/new-feature
git merge feature/new-feature
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

Examples:
feat(core): add data source selection functionality
fix(renderer): resolve voxel color interpolation issue
docs: update API documentation
```

#### About npm (Node Package Manager)

npm manages JavaScript packages and runs development scripts. Key concepts include package.json, dependencies, devDependencies, and scripts.

**Common Commands:**
```bash
# Package management
npm install package-name
npm install --save-dev package-name
npm uninstall package-name

# Script execution
npm run dev
npm run build
npm test
npm run lint

# Version management
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.1 → 0.2.0
npm version major  # 0.2.0 → 1.0.0
```

#### Development Workflow

**Daily Development Cycle:**
1. Morning: `git pull origin main`, `npm install`, `npm run dev`
2. Development: Edit code, `npm test`, `npm run lint`, `npm run build`
3. Completion: `git add .`, `git commit -m "message"`, `git push origin main`

**Feature Development Flow:**
1. Specification review
2. Design
3. Implementation
4. Testing
5. Documentation
6. Code review
7. Commit

#### Testing and Building

**Testing Types:**
- Unit tests: Individual function testing
- Integration tests: Component interaction testing

**Test Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Build Commands:**
```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run build:watch  # Watch mode
```

#### Release Process

**Preparation:**
```bash
npm test
npm run lint
npm run build
```

**Version Updates:**
```bash
# Alpha release
npm version 0.1.0-alpha.1 --no-git-tag-version
git add .
git commit -m "chore: bump version to 0.1.0-alpha.1"
git tag v0.1.0-alpha.1
git push origin main --tags

# Stable release
npm version 0.1.0 --no-git-tag-version
git tag v0.1.0
git push origin main --tags
```

**NPM Publishing:**
```bash
npm publish --tag alpha  # Alpha release
npm publish              # Stable release
```

#### Troubleshooting

**Common Issues:**
- npm install errors: Clear cache, delete node_modules, reinstall
- Test failures: Check detailed error messages, verify import paths
- Build errors: Check file paths, import statements, webpack config
- Git push errors: Pull latest changes, resolve conflicts

For detailed solutions, see the Japanese section below.

## 日本語

> **注意**: このライブラリは現在npm未登録です。GitHubから直接取得する必要があります。

**対象**: 開発初心者・JavaScript/Node.jsライブラリ開発が初めての方  
**目的**: cesium-heatboxプロジェクトの開発・リリース手順を理解する

## 目次

1. [開発環境の準備](#開発環境の準備)
2. [Git操作の基本](#git操作の基本)
3. [npm（Node Package Manager）について](#npmnode-package-managerについて)
4. [バージョン管理とタグ付け](#バージョン管理とタグ付け)
5. [開発ワークフロー](#開発ワークフロー)
6. [テストとビルド](#テストとビルド)
7. [リリース手順](#リリース手順)
8. [トラブルシューティング](#トラブルシューティング)

---

## 開発環境の準備

### 1. 必要なソフトウェア

#### Node.js（必須）
```bash
# バージョン確認
node --version  # v18.0.0以上が必要
npm --version   # v8.0.0以上が必要
```

**インストール方法**:
- [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロード
- インストーラーを実行して指示に従う

#### Git（必須）
```bash
# バージョン確認
git --version
```

**インストール方法**:
- [Git公式サイト](https://git-scm.com/)からダウンロード
- またはHomebrew: `brew install git`

#### Visual Studio Code（推奨）
- [VS Code公式サイト](https://code.visualstudio.com/)からダウンロード
- 推奨拡張機能:
  - JavaScript (ES6) code snippets
  - ESLint
  - Prettier
  - GitLens

### 2. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd /path/to/cesium-heatbox

# 依存関係のインストール
npm install

# 開発サーバーの起動テスト
npm run dev
```

---

## Git操作の基本

### Gitとは？
- **バージョン管理システム**: コードの変更履歴を記録・管理
- **協業ツール**: 複数人でのコード共有・統合
- **バックアップ**: コードの安全な保管

### 基本的なGitコマンド

#### 1. 状態確認
```bash
# 現在の状態を確認
git status

# 変更されたファイルを確認
git diff

# コミット履歴を確認
git log --oneline
```

#### 2. 変更の記録
```bash
# 変更をステージングエリアに追加
git add .                    # 全ファイル
git add src/Heatbox.js      # 特定ファイル

# コミット（変更を記録）
git commit -m "機能追加: データソース選択機能を実装"

# より詳細なコミットメッセージ
git commit -m "feat: add data source selection functionality

- Add createFromDataSource method
- Add data source switching capability
- Update API documentation
- Add unit tests for new features"
```

#### 3. リモートリポジトリとの同期
```bash
# リモートから最新版を取得
git pull origin main

# ローカルの変更をリモートに送信
git push origin main

# タグをプッシュ
git push origin --tags
```

### コミットメッセージの書き方

#### 推奨形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 例
```
feat(core): add data source selection functionality

Add methods for selecting specific data sources:
- createFromDataSource()
- switchDataSource()
- getAvailableDataSources()

This enables users to create heatmaps from specific
data sources instead of all entities in the viewer.

Closes #123
```

#### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: フォーマット変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: 雑務（依存関係更新など）

---

## npm（Node Package Manager）について

### npmとは？
- **パッケージ管理システム**: JavaScriptライブラリの管理
- **スクリプト実行**: 開発・ビルドコマンドの実行
- **公開プラットフォーム**: 作成したライブラリを世界に公開

### package.jsonの理解

#### 基本構造
```json
{
  "name": "cesium-heatbox",           // パッケージ名
  "version": "0.1.0",                // バージョン
  "description": "3D heatmap library", // 説明
  "main": "dist/cesium-heatbox.js",  // メインファイル
  "scripts": {                        // 実行可能コマンド
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "dependencies": {},                 // 本番環境で必要なパッケージ
  "devDependencies": {               // 開発時のみ必要なパッケージ
    "webpack": "^5.97.0",
    "jest": "^30.0.0"
  }
}
```

#### dependenciesとdevDependenciesの違い

**dependencies**:
- 本番環境で必要なパッケージ
- ライブラリを使用するユーザーにもインストールされる
- 例: lodash, moment

**devDependencies**:
- 開発時のみ必要なパッケージ
- ビルドツール、テストフレームワークなど
- 例: webpack, jest, eslint

**peerDependencies**:
- 使用者が別途インストールする必要があるパッケージ
- 例: cesium（このプロジェクトの場合）

### よく使うnpmコマンド

#### パッケージ管理
```bash
# パッケージをインストール
npm install package-name

# 開発用パッケージをインストール
npm install --save-dev package-name

# グローバルにインストール
npm install -g package-name

# パッケージを削除
npm uninstall package-name

# 依存関係を確認
npm list
npm outdated  # 古いパッケージを確認
```

#### スクリプト実行
```bash
# package.jsonのscriptsを実行
npm run dev      # 開発サーバー起動
npm run build    # ビルド実行
npm test         # テスト実行
npm run lint     # コード品質チェック
```

---

## バージョン管理とタグ付け

### セマンティックバージョニング

#### 形式: MAJOR.MINOR.PATCH
- **MAJOR**: 破壊的変更（既存の使い方が変わる）
- **MINOR**: 新機能追加（後方互換性あり）
- **PATCH**: バグ修正

#### 例
- `1.0.0` → `1.0.1`: バグ修正
- `1.0.1` → `1.1.0`: 新機能追加
- `1.1.0` → `2.0.0`: 破壊的変更

### プレリリース版

#### 形式: MAJOR.MINOR.PATCH-prerelease.number
- `0.1.0-alpha.1`: 開発初期版
- `0.1.0-beta.1`: 機能完成版
- `0.1.0-rc.1`: リリース候補版

### バージョン更新とタグ付け

#### 手動での更新
```bash
# package.jsonのバージョンを更新
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.1 → 0.2.0
npm version major    # 0.2.0 → 1.0.0

# プレリリース版
npm version prerelease --preid=alpha  # 0.1.0-alpha.1
npm version prerelease --preid=beta   # 0.1.0-beta.1
npm version prerelease --preid=rc     # 0.1.0-rc.1
```

#### タグの作成・管理
```bash
# タグを作成
git tag v0.1.0-alpha.1
git tag -a v0.1.0 -m "Initial release"

# タグを確認
git tag -l

# タグをプッシュ
git push origin v0.1.0-alpha.1
git push origin --tags  # 全タグ

# タグを削除
git tag -d v0.1.0-alpha.1      # ローカル
git push origin :v0.1.0-alpha.1 # リモート
```

---

## 開発ワークフロー

### 1. 日常的な開発サイクル

#### 朝の開始時
```bash
# 最新版を取得
git pull origin main

# 依存関係を更新（必要に応じて）
npm install

# 開発サーバーを起動
npm run dev
```

#### 機能開発時
```bash
# 新しいブランチを作成（オプション）
git checkout -b feature/data-source-selection

# コードを編集
# ... 開発作業 ...

# テストを実行
npm test

# リンティングを実行
npm run lint

# ビルドを確認
npm run build
```

#### 作業完了時
```bash
# 変更をコミット
git add .
git commit -m "feat: add data source selection functionality"

# リモートにプッシュ
git push origin main
# または
git push origin feature/data-source-selection
```

### 2. 機能追加の流れ

1. **仕様確認**: specification.mdで要件を確認
2. **設計**: 必要なファイル・クラス・メソッドを設計
3. **実装**: コードを記述
4. **テスト**: 単体テスト・統合テストを作成・実行
5. **ドキュメント**: API.mdやREADME.mdを更新
6. **レビュー**: コードの品質確認
7. **コミット**: 変更を記録

### 3. ブランチ戦略（初心者向け）

#### シンプルな戦略
```bash
# メインブランチで直接作業
git checkout main
git pull origin main
# 開発作業
git add .
git commit -m "message"
git push origin main
```

#### 機能別ブランチ戦略
```bash
# 機能開発用ブランチ作成
git checkout -b feature/new-feature
# 開発作業
git add .
git commit -m "message"
git push origin feature/new-feature

# 完了後、メインブランチに統合
git checkout main
git merge feature/new-feature
git push origin main
git branch -d feature/new-feature
```

---

## テストとビルド

### テストについて

#### なぜテストが必要？
- **品質保証**: バグの早期発見
- **回帰防止**: 既存機能の破壊を防止
- **仕様明確化**: コードの使い方を明示
- **リファクタリング**: 安全な改善

#### テストの種類

**単体テスト（Unit Test）**:
```javascript
// test/core/VoxelGrid.test.js
describe('VoxelGrid', () => {
  test('正しいボクセル数を計算する', () => {
    const bounds = { minLon: 0, maxLon: 100, minLat: 0, maxLat: 100 };
    const grid = new VoxelGrid(bounds, 20);
    expect(grid.numVoxelsX).toBe(5);
    expect(grid.numVoxelsY).toBe(5);
  });
});
```

**統合テスト（Integration Test）**:
```javascript
// test/integration/Heatbox.integration.test.js
describe('Heatbox Integration', () => {
  test('エンティティからヒートマップを作成', async () => {
    const entities = generateTestEntities(viewer, bounds, 100);
    const heatbox = new Heatbox(viewer);
    const stats = await heatbox.createFromEntities(entities);
    expect(stats.totalEntities).toBe(100);
  });
});
```

#### テストの実行
```bash
# 全テストを実行
npm test

# ウォッチモード（ファイル変更時に自動実行）
npm run test:watch

# カバレッジ（どの部分がテストされているか）
npm run test:coverage

# 特定のテストファイルのみ実行
npm test -- VoxelGrid.test.js
```

### ビルドについて

#### ビルドとは？
- **トランスパイル**: 新しいJavaScriptを古いブラウザで動くように変換
- **バンドル**: 複数のファイルを1つにまとめる
- **最適化**: コードサイズを削減、実行速度を向上
- **形式変換**: ES Modules → UMD、CommonJS

#### ビルドの実行
```bash
# 開発版ビルド
npm run build:dev

# 本番版ビルド（最適化あり）
npm run build

# 特定形式のみビルド
npm run build:esm    # ES Modules
npm run build:umd    # UMD（ブラウザ直接読み込み用）
npm run build:types  # TypeScript型定義

# 継続的ビルド（ファイル変更時に自動実行）
npm run build:watch
```

#### ビルド結果の確認
```bash
# dist/フォルダの内容確認
ls -la dist/

# ファイルサイズ確認
du -h dist/*

# 生成されたファイル
# - cesium-heatbox.js      (開発版)
# - cesium-heatbox.min.js  (本番版・最適化済み)
# - cesium-heatbox.umd.js  (UMD版)
# - cesium-heatbox.d.ts    (TypeScript型定義)
```

---

## リリース手順

### 1. リリース準備

#### コードの最終確認
```bash
# 全テストが通ることを確認
npm test

# リンティングエラーがないことを確認
npm run lint

# ビルドが成功することを確認
npm run build

# 型チェックが通ることを確認
npm run type-check
```

#### ドキュメントの更新
```bash
# 以下のファイルを更新
# - CHANGELOG.md: 変更内容を記録
# - README.md: 使用方法を更新
# - docs/API.md: API仕様を更新
# - package.json: バージョン情報を更新
```

### 2. バージョン更新とタグ付け

#### Alpha版リリース（開発初期）
```bash
# バージョンを0.1.0-alpha.1に更新
npm version 0.1.0-alpha.1 --no-git-tag-version

# 手動でタグを作成
git add .
git commit -m "chore: bump version to 0.1.0-alpha.1"
git tag v0.1.0-alpha.1

# GitHubにプッシュ
git push origin main
git push origin v0.1.0-alpha.1
```

#### Beta版リリース（機能完成後）
```bash
# バージョンを0.1.0-beta.1に更新
npm version 0.1.0-beta.1 --no-git-tag-version

# タグを作成してプッシュ
git add .
git commit -m "chore: bump version to 0.1.0-beta.1"
git tag v0.1.0-beta.1
git push origin main
git push origin v0.1.0-beta.1
```

#### 正式リリース（安定版）
```bash
# バージョンを0.1.0に更新
npm version 0.1.0 --no-git-tag-version

# タグを作成してプッシュ
git add .
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

### 3. NPMパッケージの公開

#### 公開前の確認
```bash
# パッケージ内容を確認
npm pack --dry-run

# 公開されるファイルを確認
npm publish --dry-run
```

#### 実際の公開
```bash
# Alpha版として公開
npm publish --tag alpha

# Beta版として公開
npm publish --tag beta

# 正式版として公開
npm publish
```

#### 公開後の確認
```bash
# パッケージ情報を確認
npm info cesium-heatbox

# インストールテスト
npm install cesium-heatbox@alpha
npm install cesium-heatbox@beta
npm install cesium-heatbox
```

### 4. CHANGELOG.mdの更新

#### 形式例
```markdown
# Changelog

## [0.1.0-alpha.1] - 2025-07-09

### Added
- 基本的なヒートマップ機能
- エンティティ処理とボクセル変換
- HSV色補間による可視化
- バッチ描画システム
- 基本的なテストスイート

### Changed
- なし

### Deprecated
- なし

### Removed
- なし

### Fixed
- なし

### Security
- なし
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. npm installでエラーが発生する

**現象**:
```bash
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /path/to/package.json
```

**解決方法**:
```bash
# 正しいディレクトリにいるか確認
pwd
ls -la package.json

# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. テストが失敗する

**現象**:
```bash
FAIL  test/Heatbox.test.js
● Test suite failed to run
```

**解決方法**:
```bash
# 詳細なエラーメッセージを確認
npm test -- --verbose

# 特定のテストファイルのみ実行
npm test -- Heatbox.test.js

# テストファイルのコードを確認
# - importパスが正しいか
# - モックが適切に設定されているか
# - 非同期処理が正しく待機されているか
```

#### 3. ビルドでエラーが発生する

**現象**:
```bash
ERROR in ./src/index.js
Module not found: Error: Can't resolve './Heatbox'
```

**解決方法**:
```bash
# ファイルパスを確認
ls -la src/

# import文を確認
grep -r "import.*Heatbox" src/

# webpack設定を確認
cat webpack.config.js
```

#### 4. Gitプッシュでエラーが発生する

**現象**:
```bash
error: failed to push some refs to 'origin'
```

**解決方法**:
```bash
# リモートの最新版を取得
git pull origin main

# コンフリクトがある場合は解決
git status
# コンフリクトファイルを編集
git add .
git commit -m "resolve conflicts"

# 再度プッシュ
git push origin main
```

#### 5. バージョンタグが重複する

**現象**:
```bash
fatal: tag 'v0.1.0' already exists
```

**解決方法**:
```bash
# 既存のタグを削除
git tag -d v0.1.0

# リモートのタグも削除
git push origin :v0.1.0

# 新しいタグを作成
git tag v0.1.0
git push origin v0.1.0
```

### 開発環境のリセット

#### 完全なリセット手順
```bash
# 1. 依存関係をクリア
rm -rf node_modules package-lock.json

# 2. ビルド成果物をクリア
rm -rf dist coverage

# 3. 依存関係を再インストール
npm install

# 4. 動作確認
npm test
npm run build
npm run dev
```

### ヘルプとリソース

#### 公式ドキュメント
- [Node.js公式ドキュメント](https://nodejs.org/docs/)
- [npm公式ドキュメント](https://docs.npmjs.com/)
- [Git公式ドキュメント](https://git-scm.com/docs)

#### 学習リソース
- [Git入門](https://git-scm.com/book/ja/v2)
- [npm入門](https://docs.npmjs.com/getting-started)
- [JavaScript開発環境構築](https://developer.mozilla.org/ja/docs/Learn/Tools_and_testing)

#### 質問・相談
- GitHub Issues: プロジェクト固有の問題
- Stack Overflow: 一般的な開発問題
- Discord/Slack: リアルタイムな質問

---

## まとめ

このガイドでは、cesium-heatboxプロジェクトの開発に必要な基本的な知識と手順を説明しました。

### 重要なポイント

1. **環境構築**: Node.js、Git、エディタを正しく設定
2. **バージョン管理**: セマンティックバージョニングとタグ付け
3. **開発サイクル**: テスト → ビルド → コミット → プッシュ
4. **リリース**: Alpha → Beta → 正式版の段階的リリース
5. **トラブル対応**: 問題発生時の基本的な対処法

### 次のステップ

1. specification.mdでプロジェクトの全体像を理解
2. 実際にコードを編集して動作確認
3. テストを追加して品質向上
4. 新機能の実装にチャレンジ
5. コミュニティとの交流

開発は試行錯誤の連続です。エラーが発生しても慌てず、このガイドを参考に一つずつ解決していきましょう。

---

**更新情報**
- 作成日: 2025年7月9日
- 対象バージョン: cesium-heatbox v0.1.0-alpha.1
- 次回更新: 新機能追加時
