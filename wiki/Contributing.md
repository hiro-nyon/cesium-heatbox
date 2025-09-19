# Contributing（プロジェクトへの貢献） / Contributing

**日本語** | [English](#english)

歓迎します！バグ報告・機能提案・プルリクエストの流れを簡潔にまとめます。詳細は `docs/contributing.md` を参照してください。

## 日本語

## バグ報告
- 事象の説明、再現手順、期待結果/実結果、環境情報（ブラウザ/OS/CesiumJS など）
- 可能ならスクリーンショットや動画を添付

## 機能提案
- 目的・ユースケース・課題、実装アイデア（任意）を Issue へ

## プルリクエスト手順
1. リポジトリをフォーク
2. ブランチ作成（`feature/*` or `fix/*`）
3. 実装とテスト追加
4. Lint/テストを通す（`npm run lint` / `npm test`）
5. 変更をコミット・プッシュ
6. PR を作成（動機/変更点/影響範囲/確認手順を記載）

## コーディング規約
- ESLint に準拠、JSDoc コメント、意味のあるコミットメッセージ
- 破壊的変更はメジャー、機能追加はマイナー、修正はパッチ（v1系以降の方針）

## ライセンス
- 貢献は MIT ライセンスの下で公開されます。

## English

Welcome! We briefly summarize the flow of bug reports, feature proposals, and pull requests. Please refer to `docs/contributing.md` for details.

### Bug Reports
- Description of the issue, reproduction steps, expected/actual results, environment information (browser/OS/CesiumJS, etc.)
- Attach screenshots or videos if possible

### Feature Proposals
- Purpose, use cases, issues, implementation ideas (optional) to Issue

### Pull Request Procedure
1. Fork the repository
2. Create branch (`feature/*` or `fix/*`)
3. Implementation and test addition
4. Pass Lint/tests (`npm run lint` / `npm test`)
5. Commit and push changes
6. Create PR (describe motivation/changes/impact scope/verification procedure)

### Coding Guidelines
- Conform to ESLint, JSDoc comments, meaningful commit messages
- Breaking changes for major version, feature additions for minor, fixes for patch

### License
- Contributions will be published under the MIT license.
