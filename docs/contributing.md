# Contributing to the Project (プロジェクトへの貢献)

[English](#english) | [日本語](#日本語)

## English

> **Note**: This library is not yet registered on npm. Please obtain it directly from GitHub.

We welcome contributions to the CesiumJS Heatbox project. This guide explains how to contribute and the procedures involved.

### How to Contribute

#### Bug Reports

If you find a bug, please report it on the GitHub Issue tracker. When reporting, please include the following information:

- Detailed description of the bug
- Steps to reproduce
- Expected behavior vs actual behavior
- Environment information (browser, OS, CesiumJS version, etc.)
- Screenshots or videos if possible

#### Feature Requests

If you have ideas for new features, please propose them on the GitHub Issue tracker. Include the following information in your proposal:

- Detailed description of the feature
- Use cases or problems it solves
- Implementation ideas (optional)

#### Pull Requests

If you want to make code changes or implement new features, please follow these steps to submit a pull request:

1. Fork the repository
2. Create a new branch (`feature/your-feature-name` or `fix/your-fix-name`)
3. Implement your changes
4. Add or update tests
5. Check code style (`npm run lint`)
6. Ensure tests pass (`npm test`)
7. Commit your changes
8. Push to your forked repository
9. Create a pull request

### Development Environment Setup

1. Clone the repository
   ```bash
   git clone https://github.com/hiro-nyon/cesium-heatbox.git
   cd cesium-heatbox
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start development server
   ```bash
   npm run dev
   ```

### Coding Standards

- Follow ESLint configuration guidelines
- Add tests for new features
- Add JSDoc comments to code
- Write clear and concise commit messages

### Testing

Before making changes, ensure existing tests pass:

```bash
npm test
```

Add tests for new features or fixes. You can check test coverage with:

```bash
npm run test:coverage
```

### Documentation

Update documentation as needed when making code changes. For API changes, update JSDoc comments and run `npm run docs` to regenerate API documentation.

### License

Contributions to this project are made under the [MIT License](../LICENSE). By submitting a pull request, you agree that your contributions will be published under this license.

## 日本語

> **注意**: このライブラリは現在npm未登録です。GitHubから直接取得する必要があります。

CesiumJS Heatboxプロジェクトへの貢献を歓迎します。このガイドでは、貢献の方法と手順について説明します。

## 貢献方法

### バグ報告

バグを見つけた場合は、GitHubのIssueトラッカーに報告してください。報告する際は以下の情報を含めてください：

- バグの詳細な説明
- 再現手順
- 期待される動作と実際の動作
- 環境情報（ブラウザ、OS、CesiumJSのバージョンなど）
- 可能であれば、スクリーンショットや動画

### 機能リクエスト

新機能のアイデアがある場合は、GitHubのIssueトラッカーに提案してください。提案には以下の情報を含めると良いでしょう：

- 機能の詳細な説明
- ユースケースや解決する問題
- 実装のアイデア（オプション）

### プルリクエスト

コードの変更や新機能の実装を行いたい場合は、以下の手順でプルリクエストを送ってください：

1. リポジトリをフォークする
2. 新しいブランチを作成する（`feature/your-feature-name` または `fix/your-fix-name`）
3. 変更を実装する
4. テストを追加または更新する
5. コードスタイルを確認する（`npm run lint`）
6. テストが通ることを確認する（`npm test`）
7. 変更をコミットする
8. フォークしたリポジトリにプッシュする
9. プルリクエストを作成する

## 開発環境のセットアップ

1. リポジトリをクローンする
   ```bash
   git clone https://github.com/hiro-nyon/cesium-heatbox.git
   cd cesium-heatbox
   ```

2. 依存関係をインストールする
   ```bash
   npm install
   ```

3. 開発サーバーを起動する
   ```bash
   npm run dev
   ```

## コーディング規約

- ESLintの設定に従ってコードを書いてください
- 新しい機能には必ずテストを追加してください
- コードにはJSDocコメントを追加してください
- コミットメッセージは明確で簡潔にしてください

## テスト

変更を加える前に、既存のテストが通ることを確認してください：

```bash
npm test
```

新しい機能や修正にはテストを追加してください。テストカバレッジは以下のコマンドで確認できます：

```bash
npm run test:coverage
```

## ドキュメント

コードの変更に伴い、必要に応じてドキュメントを更新してください。APIの変更がある場合は、JSDocコメントを更新し、`npm run docs`を実行してAPIドキュメントを再生成してください。

## ライセンス

プロジェクトへの貢献は[MITライセンス](../LICENSE)の下で行われます。プルリクエストを送ることで、あなたの貢献がこのライセンスの下で公開されることに同意したものとみなします。

