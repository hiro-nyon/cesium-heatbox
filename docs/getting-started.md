# 開発環境のセットアップ

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
- Node.js のバージョンを確認
- `npm cache clean --force` を実行
- `node_modules` と `package-lock.json` を削除して再インストール

#### テストが失敗する
- `npm run lint` でコードスタイルを確認
- `npm run type-check` で型エラーを確認
- Jest の設定を確認

#### ビルドが失敗する
- Webpack の設定を確認
- 依存関係の更新状況を確認
- `npm run clean` でクリーンアップ

### サポート

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
