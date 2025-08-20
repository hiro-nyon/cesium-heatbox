# Development Guide（開発向け）

> **⚠️ 注意**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。

初めて開発参加する方向けの要点です。詳細はリポジトリの `docs/development-guide.md` を参照してください。

## 必要環境
- Node.js >= 18, npm >= 8
- Git, 任意のエディタ（VS Code 推奨）

## セットアップ
```
npm install
npm run dev
```

## 主要コマンド
```
npm run dev            # 開発サーバー
npm run build          # すべてのビルド
npm test               # テスト
npm run test:coverage  # カバレッジ
npm run lint           # Lint
npm run type-check     # 型チェック
npm run docs           # JSDoc 生成（docs/api/）
```

## ブランチ/コミット
- `main` 安定、`feature/*` 機能、`hotfix/*` 緊急修正
- コミット形式: `type(scope): subject`（例: `feat(core): add voxel cap`）

## リリースの流れ（例）
```
npm version patch|minor|major
git push origin main --tags
```
GitHub Actions によりビルド/テスト/NPM 公開を自動化できます（設定済）。

## ドキュメント
- 仕様: `docs/specification.md`
- API: `docs/API.md` + `docs/api/`
- 参加方法: [[Contributing]]
