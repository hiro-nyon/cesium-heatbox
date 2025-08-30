# Git & NPM Reference (Git & NPM リファレンス)

[English](#english) | [日本語](#日本語)

## English

**Target Audience**: Reference for development beginners  
**Purpose**: Quick reference for basic Git, NPM, and Node.js operations

### Table of Contents

1. [Git Operations Reference](#git-operations-reference)
2. [NPM Operations Reference](#npm-operations-reference)
3. [Version Management](#version-management)
4. [Project Management](#project-management)
5. [Troubleshooting](#troubleshooting)

#### Git Operations Reference

**Basic Concepts:**
- **Repository**: Storage location for project history
- **Commit**: Snapshot recording changes
- **Branch**: Development branching (main branch is default)
- **Tag**: Label for specific commits (for version management)
- **Remote**: Online repository (GitHub, etc.)
- **Local**: Repository on your computer

**Commonly Used Commands:**

Status checking:
```bash
git status              # Check current status
git diff                # Check file differences
git log --oneline       # Check commit history
```

Recording changes:
```bash
git add filename.js     # Stage specific file
git add .              # Stage all files
git commit -m "message" # Create commit
git commit --amend     # Modify previous commit
```

Remote synchronization:
```bash
git pull origin main    # Get latest from remote
git push origin main    # Send local changes to remote
```

Branch operations:
```bash
git branch                           # List branches
git checkout -b feature/new-feature  # Create and switch to new branch
git merge feature/new-feature        # Merge branch
git branch -d feature/new-feature    # Delete branch
```

Tag operations:
```bash
git tag                    # List tags
git tag v1.0.0            # Create tag
git tag -a v1.0.0 -m "msg" # Create annotated tag
git push origin v1.0.0     # Push tag to remote
git push origin --tags     # Push all tags
```

**Commit Message Guidelines:**

Format:
```
<type>(<scope>): <subject>
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Code style changes
- `refactor`: Refactoring
- `test`: Test additions/fixes
- `chore`: Maintenance tasks

Good examples:
```bash
git commit -m "feat(core): add data source selection functionality"
git commit -m "fix(renderer): resolve voxel color interpolation issue"
git commit -m "docs: update API documentation for new methods"
```

#### NPM Operations Reference

**Basic Concepts:**
- **package.json**: Project configuration file
- **node_modules**: Storage for installed packages
- **package-lock.json**: Detailed dependency information
- **dependencies**: Packages needed in production
- **devDependencies**: Packages needed only during development
- **scripts**: Commands executable with npm run

**Package Management:**

Installation:
```bash
npm install                    # Install all dependencies from package.json
npm install package-name       # Install specific package
npm install --save-dev package-name  # Install as dev dependency
npm install package-name@1.2.3 # Install specific version
npm install -g package-name    # Install globally
```

Uninstallation:
```bash
npm uninstall package-name                # Uninstall package
npm uninstall --save-dev package-name     # Uninstall dev dependency
```

Package information:
```bash
npm list                # List installed packages
npm list --depth=0      # Top-level packages only
npm outdated           # Check for outdated packages
npm info package-name  # Package details
```

**Script Execution:**
```bash
npm run script-name    # Execute script from package.json
npm run dev           # Start development server
npm run build         # Execute build
npm test              # Run tests
npm start             # Start application
```

**Version Management:**
```bash
npm version patch     # Update patch version (0.1.0 → 0.1.1)
npm version minor     # Update minor version (0.1.0 → 0.2.0)
npm version major     # Update major version (0.1.0 → 1.0.0)

# Prerelease versions
npm version prerelease --preid=alpha
npm version prerelease --preid=beta
npm version prerelease --preid=rc
```

**Publishing:**
```bash
npm publish --dry-run  # Check publish contents
npm publish           # Normal publish
npm publish --tag alpha  # Publish with tag
```

#### Semantic Versioning

**Format: MAJOR.MINOR.PATCH**
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

**Prerelease versions:**
```
1.0.0-alpha.1    # Early development version
1.0.0-beta.1     # Feature-complete version
1.0.0-rc.1       # Release candidate
```

#### Common Issues and Solutions

**npm install errors:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Git push errors:**
```bash
git pull origin main      # Get latest changes
# Resolve conflicts if any
git push origin main      # Retry push
```

**Tag conflicts:**
```bash
git tag -d v1.0.0               # Delete local tag
git push origin --delete v1.0.0  # Delete remote tag
git tag v1.0.0                  # Create new tag
git push origin v1.0.0           # Push new tag
```

**Environment reset:**
```bash
rm -rf node_modules package-lock.json dist coverage
npm cache clean --force
npm install
npm test
npm run build
```

For detailed explanations and additional examples, see the Japanese section below.

## 日本語

**対象**: 開発初心者向けのリファレンス  
**目的**: Git・NPM・Node.jsの基本操作を素早く参照

## 目次

1. [Git操作リファレンス](#git操作リファレンス)
2. [NPM操作リファレンス](#npm操作リファレンス)
3. [バージョン管理](#バージョン管理)
4. [プロジェクト管理](#プロジェクト管理)
5. [トラブルシューティング](#トラブルシューティング)

---

## Git操作リファレンス

### 基本概念

#### 用語解説
- **リポジトリ**: プロジェクトの全履歴を保存する場所
- **コミット**: 変更を記録するスナップショット
- **ブランチ**: 開発の枝分かれ（通常mainブランチが基本）
- **タグ**: 特定のコミットにつけるラベル（バージョン管理用）
- **リモート**: GitHub等のオンラインリポジトリ
- **ローカル**: 自分のコンピュータ上のリポジトリ

### よく使うコマンド

#### リポジトリの状態確認
```bash
# 現在の状態を確認
git status

# 変更されたファイルの差分を確認
git diff

# 変更されたファイルの一覧
git diff --name-only

# コミット履歴を確認
git log --oneline
git log --graph --oneline    # グラフ表示
```

#### ファイルの変更を記録
```bash
# 特定のファイルをステージング
git add filename.js

# 全ファイルをステージング
git add .

# 変更を取り消し（ステージング前）
git checkout filename.js

# ステージングを取り消し
git reset filename.js

# コミットを作成
git commit -m "コミットメッセージ"

# 前のコミットを修正
git commit --amend -m "修正されたメッセージ"
```

#### リモートリポジトリとの同期
```bash
# リモートから最新版を取得
git pull origin main

# ローカルの変更をリモートに送信
git push origin main

# 初回プッシュ時（上流ブランチ設定）
git push -u origin main
```

#### ブランチ操作
```bash
# ブランチ一覧を確認
git branch

# 新しいブランチを作成
git branch feature/new-feature

# ブランチを切り替え
git checkout feature/new-feature

# ブランチ作成と切り替えを同時に
git checkout -b feature/new-feature

# ブランチをマージ
git checkout main
git merge feature/new-feature

# ブランチを削除
git branch -d feature/new-feature
```

#### タグ操作
```bash
# タグ一覧を確認
git tag

# タグを作成
git tag v1.0.0

# 注釈付きタグを作成
git tag -a v1.0.0 -m "Release version 1.0.0"

# タグをリモートにプッシュ
git push origin v1.0.0
git push origin --tags    # 全タグ

# タグを削除
git tag -d v1.0.0               # ローカル
git push origin --delete v1.0.0 # リモート
```

### コミットメッセージの書き方

#### 基本形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type（種類）
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: 雑務（ビルド、依存関係更新など）

#### 良いコミットメッセージの例
```bash
# 新機能
git commit -m "feat(core): add data source selection functionality"

# バグ修正
git commit -m "fix(renderer): resolve voxel color interpolation issue"

# ドキュメント更新
git commit -m "docs: update API documentation for new methods"

# 雑務
git commit -m "chore: bump version to 0.1.0-alpha.1"
```

#### 悪いコミットメッセージの例
```bash
# 避けるべき例
git commit -m "fix"
git commit -m "update files"
git commit -m "work in progress"
```

---

## NPM操作リファレンス

### 基本概念

#### 用語解説
- **package.json**: プロジェクトの設定ファイル
- **node_modules**: インストールされたパッケージの保存場所
- **package-lock.json**: 依存関係の詳細情報
- **dependencies**: 本番環境で必要なパッケージ
- **devDependencies**: 開発時のみ必要なパッケージ
- **scripts**: npm runで実行できるコマンド

### パッケージ管理

#### インストール
```bash
# package.jsonの依存関係を全てインストール
npm install

# 特定のパッケージをインストール
npm install package-name

# 開発用パッケージをインストール
npm install --save-dev package-name
npm install -D package-name    # 短縮形

# 特定のバージョンをインストール
npm install package-name@1.2.3

# グローバルにインストール
npm install -g package-name
```

#### アンインストール
```bash
# パッケージをアンインストール
npm uninstall package-name

# 開発用パッケージをアンインストール
npm uninstall --save-dev package-name
```

#### パッケージ情報の確認
```bash
# インストール済みパッケージの一覧
npm list

# トップレベルのパッケージのみ
npm list --depth=0

# 古いパッケージを確認
npm outdated

# パッケージの詳細情報
npm info package-name

# パッケージのバージョン履歴
npm view package-name versions --json
```

### スクリプト実行

#### 基本的な実行
```bash
# package.jsonのscriptsを実行
npm run script-name

# よく使うスクリプト
npm run dev       # 開発サーバー起動
npm run build     # ビルド実行
npm test          # テスト実行
npm start         # アプリケーション起動
```

#### スクリプトの確認
```bash
# 利用可能なスクリプト一覧
npm run

# 特定のスクリプトの詳細
npm run script-name --help
```

### バージョン管理

#### バージョン更新
```bash
# パッチバージョンを更新（0.1.0 → 0.1.1）
npm version patch

# マイナーバージョンを更新（0.1.0 → 0.2.0）
npm version minor

# メジャーバージョンを更新（0.1.0 → 1.0.0）
npm version major

# プレリリースバージョンを更新
npm version prerelease --preid=alpha
npm version prerelease --preid=beta
npm version prerelease --preid=rc
```

#### 手動バージョン設定
```bash
# 特定のバージョンに設定
npm version 1.0.0

# Gitタグを作成しない
npm version 1.0.0 --no-git-tag-version
```

### 公開

#### 公開前の確認
```bash
# 公開される内容を確認
npm publish --dry-run

# パッケージの内容を確認
npm pack
```

#### 実際の公開
```bash
# 通常の公開
npm publish

# タグを指定して公開
npm publish --tag alpha
npm publish --tag beta
npm publish --tag rc
```

---

## バージョン管理

### セマンティックバージョニング

#### 基本形式: MAJOR.MINOR.PATCH

```
1.0.0
│ │ │
│ │ └─ PATCH: バグ修正
│ └─── MINOR: 新機能追加（後方互換性あり）
└───── MAJOR: 破壊的変更
```

#### プレリリース版
```
1.0.0-alpha.1    # 開発初期版
1.0.0-beta.1     # 機能完成版
1.0.0-rc.1       # リリース候補版
```

### 開発フローでのバージョン管理

#### 開発段階
```bash
# 開発開始
git checkout -b feature/new-feature

# 開発完了
git checkout main
git merge feature/new-feature

# Alpha版リリース
npm version 0.1.0-alpha.1 --no-git-tag-version
git add .
git commit -m "chore: bump version to 0.1.0-alpha.1"
git tag v0.1.0-alpha.1
git push origin main --tags
```

#### 安定版リリース
```bash
# 機能完成・テスト完了
npm test
npm run build

# バージョン更新
npm version 0.1.0 --no-git-tag-version
git add .
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main --tags

# NPM公開
npm publish
```

---

## プロジェクト管理

### プロジェクト構造の理解

#### 典型的なNode.jsプロジェクト
```
project/
├── package.json          # プロジェクト設定
├── package-lock.json     # 依存関係の詳細
├── node_modules/         # インストールされたパッケージ
├── src/                  # ソースコード
├── test/                 # テストコード
├── dist/                 # ビルド出力
├── docs/                 # ドキュメント
├── .gitignore           # Git除外設定
├── .eslintrc.js         # ESLint設定
├── .babelrc             # Babel設定
├── webpack.config.js    # Webpack設定
└── README.md            # プロジェクト説明
```

#### 重要なファイル

**package.json**:
```json
{
  "name": "project-name",
  "version": "1.0.0",
  "description": "Project description",
  "main": "dist/index.js",
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production",
    "test": "jest"
  },
  "dependencies": {
    "production-package": "^1.0.0"
  },
  "devDependencies": {
    "development-package": "^1.0.0"
  }
}
```

**package-lock.json**:
- 依存関係の詳細な情報
- バージョンの固定
- 再現可能なビルド

### 依存関係管理

#### 依存関係の種類
```bash
# 本番環境で必要
npm install --save package-name

# 開発時のみ必要
npm install --save-dev package-name

# 使用者が別途インストール
# package.jsonのpeerDependenciesに記載
```

#### 依存関係の更新
```bash
# 古いパッケージを確認
npm outdated

# マイナーバージョンを更新
npm update

# メジャーバージョンも更新
npm install package-name@latest
```

#### セキュリティ対策
```bash
# 脆弱性を確認
npm audit

# 自動修正
npm audit fix

# 強制修正（注意深く使用）
npm audit fix --force
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. npm installでエラー

**問題**: パッケージのインストールが失敗する

**解決方法**:
```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

#### 2. Gitプッシュでエラー

**問題**: `error: failed to push some refs to 'origin'`

**解決方法**:
```bash
# リモートの変更を取得
git pull origin main

# コンフリクトがある場合は解決
git status
# ファイルを編集してコンフリクトを解決
git add .
git commit -m "resolve conflicts"

# 再プッシュ
git push origin main
```

#### 3. バージョンの競合

**問題**: `fatal: tag 'v1.0.0' already exists`

**解決方法**:
```bash
# 既存のタグを削除
git tag -d v1.0.0

# リモートのタグも削除
git push origin --delete v1.0.0

# 新しいタグを作成
git tag v1.0.0
git push origin v1.0.0
```

#### 4. 依存関係の競合

**問題**: `npm ERR! peer dep missing`

**解決方法**:
```bash
# 不足している依存関係を確認
npm ls

# 必要なパッケージをインストール
npm install missing-package

# または、--legacy-peer-depsフラグを使用
npm install --legacy-peer-deps
```

### 環境のリセット

#### 完全なリセット手順
```bash
# 1. 一時ファイルをクリア
rm -rf node_modules package-lock.json dist coverage

# 2. npmキャッシュをクリア
npm cache clean --force

# 3. 依存関係を再インストール
npm install

# 4. 動作確認
npm test
npm run build
```

#### Git環境のリセット
```bash
# 未追跡ファイルを削除
git clean -fd

# 全変更を取り消し
git reset --hard HEAD

# 最新版を取得
git pull origin main
```

---

## 便利なコマンド集

### 日常的に使うコマンド

#### 開発開始時
```bash
cd project-directory
git pull origin main
npm install
npm run dev
```

#### 作業完了時
```bash
npm test
npm run build
git add .
git commit -m "feat: add new feature"
git push origin main
```

#### 状態確認
```bash
git status
npm outdated
npm audit
```

### 高度なコマンド

#### Git履歴の確認
```bash
# 特定のファイルの変更履歴
git log --oneline -- filename.js

# 特定の作成者のコミット
git log --author="author-name"

# 特定期間のコミット
git log --since="2023-01-01" --until="2023-12-31"
```

#### NPMの高度な使用
```bash
# 特定のパッケージを検索
npm search package-name

# パッケージのホームページを開く
npm home package-name

# パッケージのリポジトリを開く
npm repo package-name
```

---

## まとめ

このリファレンスでは、Git・NPM・Node.jsの基本的な操作方法を説明しました。

### 重要なポイント
1. **Git**: バージョン管理の基本操作
2. **NPM**: パッケージ管理とスクリプト実行
3. **バージョン管理**: セマンティックバージョニング
4. **トラブルシューティング**: よくある問題の解決方法

### 学習のヒント
- **実際に使う**: コマンドを実際に試してみる
- **エラーを恐れない**: 失敗から学ぶ
- **ドキュメントを読む**: 公式ドキュメントを参照
- **コミュニティに参加**: 質問や議論を通じて学ぶ

### さらなる学習リソース
- [Git公式ドキュメント](https://git-scm.com/docs)
- [NPM公式ドキュメント](https://docs.npmjs.com/)
- [Node.js公式ドキュメント](https://nodejs.org/docs/)

このリファレンスを手元に置いて、開発を進めてください！

---

**更新情報**
- 作成日: 2025年7月9日
- 対象: 開発初心者
- 次回更新: ユーザーフィードバック後
