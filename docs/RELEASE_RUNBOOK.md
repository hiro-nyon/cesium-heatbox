# Codex 実行用・公開運用指示書（cesium-heatbox｜v0.1.10 を含む）

本書は、初心者開発者でも「タグを打つだけで公開」が安全に回ることを目的とした運用手順書です。プリリリースは `@next`、安定版は `@latest` で配信します。

---

## 0) 目的（必ず理解）
- main＝@latest、next＝@next の二車線を確立して安全運用。
- Git タグの push だけを公開トリガにする（Actions が build→test→publish）。
- SemVer のプリリリース（-alpha.N/-beta.N/-rc.N）は安定版より下位。`@next` にのみ配信。

---

## 1) 現状の v0.1.10（未コミット）を安全に受け入れる
1. 統合ブランチ作成（未作成なら）

```bash
git checkout -b next
git push -u origin next
```

2. 作業差分を一時ブランチで受け止め、next に PR で載せる

```bash
git checkout -b feat/0.1.10-bundle
git add -A
git commit -m "feat: prepare 0.1.10 (tests/docs/bugfixes)"
git push -u origin feat/0.1.10-bundle
# → GitHub で base=next へ PR
```

- Conventional Commits 形式推奨（後の自動生成などで有利）。

---

## 2) まずはプリリリースとして v0.1.10 を出す（@next）
- α 期間に試用者へ先行配布。タグでのみ公開が走る。

```bash
# v0.1.10-alpha.0 を作成（package.json 更新＋Git タグ作成）
npm version prerelease --preid=alpha
# タグを push（Actions が起動し、--tag next で publish）
git push origin --tags
```

- 反復配信は `npm version prerelease --preid=alpha` → `git push --tags`（.1, .2 …）。

---

## 3) 安定版 v0.1.10 を “@latest” で公開
- 仕上げ完了後、プリリリース表記なしの 0.1.10 をタグに.

```bash
npm version 0.1.10
git push origin --tags
```

- `npm publish` は引数なしだと `@latest` へ。一般ユーザーは `npm i cesium-heatbox` で取得。

---

## 4) GitHub Actions（タグ push でのみ公開）

ファイル: `.github/workflows/release.yml`
- `push.tags: [ 'v*' ]` で `v0.1.10` や `v0.1.10-alpha.0` の push をトリガに実行。
- 版文字列に `-alpha.`/`-beta.`/`-rc.` を含む場合は `npm publish --tag next`、それ以外は `npm publish`。
- 公開にはリポジトリの `NPM_TOKEN` シークレットが必要。

通常 CI: `.github/workflows/ci.yml`
- `main`/`next` への push と PR で、Install→Test→Build→`npm pack --dry-run` まで実施。

---

## 5) package.json の配布設定（このリポジトリの現状で安全）
- すでに `files` は `dist/` と `types/` に限定、`exports` と `types` も設定済み。
- 現在のビルドは webpack、テストは jest。変更不要。
- 追加で配布内容を確認する場合：

```bash
npm run build
npm pack --dry-run
```

---

## 6) デモ用ブランチ
- npm 公開は Actions のみ担当。`gh-pages` 系はデモ配信専用のままで OK（npm とは無関係）。
- 必要なら `gh-pages-alpha` を「next 用デモ」に割り当て、README に用途を明記。

---

## 7) ロールバック

dist-tag の調整:
```bash
# 誤って付けた next を外す例
npm dist-tag rm cesium-heatbox next
# 正しい版に再付与
npm dist-tag add cesium-heatbox@0.1.10 next
```

タグの取り消し:
```bash
git tag -d v0.1.10-alpha.0
git push origin :refs/tags/v0.1.10-alpha.0
```

---

## 8) 完了条件（Codex が保証すべきこと）
- `next` が存在し、`feat/0.1.10-bundle` → PR → `next` へ統合。
- `.github/workflows/release.yml` がタグ push で起動し、pre→`@next`／安定→`@latest` を切り分けて公開。
- `.github/workflows/ci.yml` が `main` / `next` / PR で build・test・pack を実行。
- `package.json` の `files`/`exports`/`types`/`prepublishOnly` が設定済み（現状 OK）。
- 0.1.10 の配信手順:
  - α 配信: `npm version prerelease --preid=alpha` → `git push --tags`（＝@next）
  - 安定版: `npm version 0.1.10` → `git push --tags`（＝@latest）

---

## 参考: 運用上の注意
- SemVer: `1.2.3-alpha.1` のようなプリリリースは安定より下位。通常の `^` 範囲には自動では入らない。
- dist-tag と Git タグは別物。インストールレーンの切替は dist-tag（`latest`/`next`/…）。ワークフロートリガは Git タグ（`v*`）。

