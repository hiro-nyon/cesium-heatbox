# Development Guide（開発向け） / Development Guide

**日本語** | [English](#english)

初めて開発参加する方向けの要点です。詳細はリポジトリの `docs/development-guide.md` を参照してください。

## 日本語

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

## リリースの流れ（v0.1.11）
- バージョン更新: `package.json#version` と `src/index.js` の `VERSION` を同一に更新
- 検証: `npm run -s lint && npm run -s type-check && npm test --silent -- --reporters=summary` と `npm run build`
- タグ付け: 安定版は `v<version>`（例: `v0.1.11`）
  - `git tag -a v0.1.11 -m "release: 0.1.11" && git push origin v0.1.11`
- 公開: GitHub Actions が npm へ publish（安定版は `@latest`）

## ドキュメント
- 仕様: `docs/specification.md`
- API: `docs/API.md` + `docs/api/`
- 参加方法: [[Contributing]]
