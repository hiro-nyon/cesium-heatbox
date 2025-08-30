# Quick Start Guide (クイックスタートガイド)

[English](#english) | [日本語](#日本語)

## English

> **Note**: This library is not yet registered on npm. Please obtain it directly from GitHub.

**Target Audience**: Those who want to use cesium-heatbox immediately  
**Time Required**: 10-15 minutes  
**Prerequisites**: Node.js 18+, Git, basic JavaScript knowledge

### Table of Contents

1. [Environment Setup (5 minutes)](#environment-setup-5-minutes)
2. [Project Setup (3 minutes)](#project-setup-3-minutes)
3. [Sample Execution (2 minutes)](#sample-execution-2-minutes)
4. [Basic Development Work (5 minutes)](#basic-development-work-5-minutes)
5. [Next Steps](#next-steps)

#### Environment Setup (5 minutes)

**1. Check Node.js Installation**

```bash
# Check version
node --version  # v18.0.0 or higher required
npm --version   # v8.0.0 or higher required
```

**If not installed:**
1. Download LTS version from [Node.js official site](https://nodejs.org/)
2. Run installer

**2. Check Git Installation**

```bash
# Check version
git --version
```

**If not installed:**
- Download from [Git official site](https://git-scm.com/)
- macOS: `brew install git`
- Windows: Install Git for Windows

#### Project Setup (3 minutes)

**1. Navigate to Project Directory**

```bash
cd /path/to/cesium-heatbox
```

**2. Install Dependencies**

```bash
# Initial setup
npm install

# Verify success
npm ls --depth=0
```

**3. Basic Operation Check**

```bash
# Run tests
npm test

# Run build
npm run build

# Check results
ls -la dist/
```

**Expected output:**
```
dist/
├── cesium-heatbox.js
├── cesium-heatbox.min.js
└── cesium-heatbox.umd.js
```

#### Sample Execution (2 minutes)

**1. Start Development Server**

```bash
# Start development server
npm run dev

# Check in browser
# Browser should open automatically (usually http://localhost:8080)
```

**2. Check Basic Sample**

Verify in browser:
- Basic 3D map display
- Heatmap configuration UI
- Entity generation and heatmap creation buttons

**3. Function Test**

1. **Generate Entities**: Click "Generate Test Entities" button
2. **Create Heatmap**: Click "Create Heatmap" button
3. **Change Settings**: Adjust voxel size and opacity
4. **Toggle Display**: Use "Show/Hide" button to verify

#### Basic Development Work (5 minutes)

**1. Open Code in Editor**

```bash
# Open with Visual Studio Code
code .

# Or open with other editor
open .
```

**Basic File Structure:**
```
cesium-heatbox/
├── src/                    # Source code
│   ├── Heatbox.js         # Main class
│   ├── core/              # Core functionality
│   └── utils/             # Utilities
├── examples/              # Sample code
│   └── basic/
│       ├── index.html
│       └── app.js
├── test/                  # Test code
└── docs/                  # Documentation
```

**2. Try Simple Changes**

Change default voxel size:
```javascript
// src/utils/constants.js
export const DEFAULT_VOXEL_SIZE = 20;  // Change 20 → 30
```

Change default colors:
```javascript
// src/utils/constants.js
export const DEFAULT_MIN_COLOR = [0, 32, 255];     // Blue
export const DEFAULT_MAX_COLOR = [255, 64, 0];     // Red
// → Try changing to other colors
```

**3. Verify Changes**

```bash
# Check with development server (hot reload)
npm run dev

# Check with tests
npm test

# Check with build
npm run build
```

**4. Commit Changes**

```bash
# Check changes
git status
git diff

# Commit changes
git add .
git commit -m "chore: update default voxel size to 30"

# Push to GitHub
git push origin main
```

#### Next Steps

**1. Read Detailed Documentation**

- **[development-guide.md](./development-guide.md)**: From basics to advanced development
- **[specification.md](./specification.md)**: Complete project specifications
- **[API.md](./API.md)**: Detailed API specifications

**2. Practical Development**

Feature implementation:
1. Check v0.2.0 planned features in **specification.md**
2. Challenge implementing **data source selection functionality**
3. Add **test cases**
4. Update **documentation**

Quality improvement:
1. Improve **test coverage**
2. Optimize **performance**
3. Enhance **error handling**
4. Improve **usability**

**3. Release Preparation**

Alpha release:
```bash
# Update version
npm version 0.1.0-alpha.1 --no-git-tag-version

# Create tag
git add .
git commit -m "chore: bump version to 0.1.0-alpha.1"
git tag v0.1.0-alpha.1

# Push
git push origin main
git push origin v0.1.0-alpha.1
```

Future NPM publication:
```bash
# Prepare for publication
npm publish --dry-run

# Publish as alpha
npm publish --tag alpha
```

### Frequently Used Commands

**Development:**
```bash
npm install     # Install dependencies
npm run dev     # Start development server
npm test        # Run tests
npm run build   # Build
npm run lint    # Linting
```

**Git Operations:**
```bash
git status                    # Check status
git add .                     # Stage changes
git commit -m "message"       # Commit
git push origin main          # Push
git pull origin main          # Pull latest
```

**Troubleshooting:**
```bash
# Environment reset
rm -rf node_modules package-lock.json
npm install

# Detailed error checking
npm test -- --verbose
npm run build -- --verbose
```

### Frequently Asked Questions

**Q: Development server won't start**
**A:** Check:
1. Node.js 18+ installed
2. `npm install` succeeded
3. Port 8080 available

**Q: Tests fail**
**A:** Try:
1. `npm test -- --verbose` for detailed errors
2. `npm install` to reinstall dependencies
3. Run specific test: `npm test -- Heatbox.test.js`

**Q: Build fails**
**A:** Check:
1. No ESLint errors: `npm run lint`
2. No type errors: `npm run type-check`
3. File paths are correct

**Q: Git push error**
**A:** Try:
1. `git pull origin main` to get latest
2. Resolve conflicts if any
3. Push again

### Success Tips

1. **Start small**: Don't make big changes at once
2. **Test frequently**: Always run tests after changes
3. **Commit often**: Commit in meaningful units
4. **Read documentation**: Check specifications for questions
5. **Don't fear experimentation**: Failure is a learning opportunity

Congratulations! Enjoy developing with cesium-heatbox!

## 日本語

> **注意**: このライブラリは現在npm未登録です。GitHubから直接取得する必要があります。

**対象**: cesium-heatboxを今すぐ使いたい方  
**所要時間**: 10-15分  
**前提条件**: Node.js 18+、Git、基本的なJavaScript知識

## 目次

1. [環境準備（5分）](#環境準備5分)
2. [プロジェクトセットアップ（3分）](#プロジェクトセットアップ3分)
3. [サンプル実行（2分）](#サンプル実行2分)
4. [基本的な開発作業（5分）](#基本的な開発作業5分)
5. [次のステップ](#次のステップ)

---

## 環境準備（5分）

### 1. Node.jsのインストール確認

```bash
# バージョン確認
node --version  # v18.0.0以上必要
npm --version   # v8.0.0以上必要
```

**未インストールの場合**:
1. [Node.js公式サイト](https://nodejs.org/)でLTS版をダウンロード
2. インストーラーを実行

### 2. Gitのインストール確認

```bash
# バージョン確認
git --version
```

**未インストールの場合**:
- [Git公式サイト](https://git-scm.com/)からダウンロード
- macOS: `brew install git`
- Windows: Git for Windowsをインストール

---

## プロジェクトセットアップ（3分）

### 1. プロジェクトディレクトリに移動

```bash
cd /path/to/cesium-heatbox
```

### 2. 依存関係のインストール

```bash
# 初回セットアップ
npm install

# 成功確認
npm ls --depth=0
```

### 3. 基本動作確認

```bash
# テストの実行
npm test

# ビルドの実行
npm run build

# 結果確認
ls -la dist/
```

**期待される出力**:
```
dist/
├── cesium-heatbox.js
├── cesium-heatbox.min.js
└── cesium-heatbox.umd.js
```

---

## サンプル実行（2分）

### 1. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで確認
# 自動的にブラウザが開く（通常はhttp://localhost:8080）
```

### 2. 基本サンプルの確認

ブラウザで以下を確認:
- 基本的な3Dマップが表示される
- ヒートマップの設定UI
- エンティティ生成・ヒートマップ作成ボタン

### 3. 機能テスト

1. **エンティティ生成**: 「テストエンティティ生成」ボタンをクリック
2. **ヒートマップ作成**: 「ヒートマップ作成」ボタンをクリック
3. **設定変更**: ボクセルサイズや透明度を調整
4. **表示切り替え**: 「表示/非表示」ボタンで確認

---

## 基本的な開発作業（5分）

### 1. コードの編集

#### エディタでプロジェクトを開く
```bash
# Visual Studio Codeで開く
code .

# または他のエディタで開く
open .
```

#### 基本的なファイル構造
```
cesium-heatbox/
├── src/                    # ソースコード
│   ├── Heatbox.js         # メインクラス
│   ├── core/              # 核心機能
│   └── utils/             # ユーティリティ
├── examples/              # サンプルコード
│   └── basic/
│       ├── index.html
│       └── app.js
├── test/                  # テストコード
└── docs/                  # ドキュメント
```

### 2. 簡単な変更を試す

#### デフォルトボクセルサイズの変更
```javascript
// src/utils/constants.js
export const DEFAULT_VOXEL_SIZE = 20;  // 20 → 30に変更
```

#### デフォルト色の変更
```javascript
// src/utils/constants.js
export const DEFAULT_MIN_COLOR = [0, 32, 255];     // 青
export const DEFAULT_MAX_COLOR = [255, 64, 0];     // 赤
// → 他の色に変更してみる
```

### 3. 変更の確認

```bash
# 開発サーバーで確認（ホットリロード）
npm run dev

# テストで確認
npm test

# ビルドで確認
npm run build
```

### 4. 変更のコミット

```bash
# 変更を確認
git status
git diff

# 変更をコミット
git add .
git commit -m "chore: update default voxel size to 30"

# GitHubにプッシュ
git push origin main
```

---

## 次のステップ

### 1. 詳細なドキュメントを読む

- **[development-guide.md](./development-guide.md)**: 開発の基本から応用まで
- **[specification.md](./specification.md)**: プロジェクトの全体仕様
- **[API.md](./API.md)**: API仕様の詳細

### 2. 実践的な開発

#### 新機能の実装
1. **specification.md**でv0.2.0の計画機能を確認
2. **データソース選択機能**の実装にチャレンジ
3. **テストケース**の追加
4. **ドキュメント**の更新

#### 品質向上
1. **テストカバレッジ**の向上
2. **パフォーマンス**の最適化
3. **エラーハンドリング**の改善
4. **ユーザビリティ**の向上

### 3. リリースの準備

#### Alpha版リリース
```bash
# バージョン更新
npm version 0.1.0-alpha.1 --no-git-tag-version

# タグ作成
git add .
git commit -m "chore: bump version to 0.1.0-alpha.1"
git tag v0.1.0-alpha.1

# プッシュ
git push origin main
git push origin v0.1.0-alpha.1
```

#### 将来的なNPM公開
```bash
# 公開準備
npm publish --dry-run

# Alpha版として公開
npm publish --tag alpha
```

---

## 頻繁に使うコマンド一覧

### 開発時

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# テスト実行
npm test

# ビルド
npm run build

# リンティング
npm run lint
```

### Git操作

```bash
# 状態確認
git status

# 変更をコミット
git add .
git commit -m "commit message"

# プッシュ
git push origin main

# 最新版を取得
git pull origin main
```

### トラブルシューティング

```bash
# 環境リセット
rm -rf node_modules package-lock.json
npm install

# 詳細エラー確認
npm test -- --verbose
npm run build -- --verbose
```

---

## よくある質問

### Q: 開発サーバーが起動しない
**A**: 以下を確認してください
1. Node.js 18+がインストールされているか
2. `npm install`が成功したか
3. ポート8080が使用可能か

### Q: テストが失敗する
**A**: 以下を試してください
1. `npm test -- --verbose`で詳細エラーを確認
2. `npm install`で依存関係を再インストール
3. 個別のテストファイルを実行: `npm test -- Heatbox.test.js`

### Q: ビルドが失敗する
**A**: 以下を確認してください
1. ESLintエラーがないか: `npm run lint`
2. 型エラーがないか: `npm run type-check`
3. ファイルパスが正しいか

### Q: Gitプッシュでエラーが発生
**A**: 以下を試してください
1. `git pull origin main`で最新版を取得
2. コンフリクトがある場合は解決
3. 再度プッシュ

---

## サポート

### ヘルプが必要な場合
- **GitHub Issues**: プロジェクト固有の問題
- **development-guide.md**: 詳細な開発ガイド
- **specification.md**: プロジェクトの全体仕様

### 学習リソース
- [CesiumJS公式ドキュメント](https://cesium.com/learn/)
- [JavaScript MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript)
- [Git入門](https://git-scm.com/book/ja/v2)

---

**成功のコツ**:
1. **小さく始める**: 一度に大きな変更をしない
2. **頻繁にテスト**: 変更後は必ずテストを実行
3. **コミットを細かく**: 意味のある単位でコミット
4. **ドキュメントを読む**: 疑問点は仕様書で確認
5. **実験を恐れない**: 失敗しても学習の機会

お疲れ様でした！cesium-heatboxの開発を楽しんでください！

---

**更新情報**
- 作成日: 2025年7月9日
- 対象バージョン: cesium-heatbox v0.1.0-alpha.1（歴史的メモ。最新版はREADMEおよび docs/API.md を参照）
- 次回更新: ユーザーフィードバック後
