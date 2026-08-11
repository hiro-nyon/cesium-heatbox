<!-- Generated from docs/RELEASE_RUNBOOK.md by npm run wiki:sync. Edit the canonical source, not this page. -->

# Release Runbook（v1.3.7）

この文書は、`1.3.7-alpha.5` を `@next` で検証した後、`1.3.7` を `@latest` として公開する手順を定義します。npm 公開は GitHub Actions の `.github/workflows/release.yml` だけが行い、ローカルでは `npm publish` を実行しません。

## 1. 公開レーン

- プレリリース: `next` ブランチの先端に `v<version>-alpha.N`、`-beta.N`、`-rc.N` のいずれかを付け、npm の `next` dist-tag へ公開します。
- 安定版: `main` と `next` が同じコミットを指す状態で、そのコミットに `v<version>` を付け、npm の `latest` dist-tag へ公開します。
- 公開トリガは `v*` タグの個別 push だけです。GitHub Release の手動公開や `workflow_dispatch` は npm 公開を起動しません。
- タグは必ず対象ブランチへマージした後に作成します。feature branch のコミットには付けません。

Release Workflow は公開前に次を fail-fast で検証します。

1. Git タグが `v${package.json.version}` と完全一致すること。
2. `package.json`、`package-lock.json` の2箇所、`src/index.js` の `VERSION` が一致すること。
3. プレリリースのタグ先が `origin/next` の先端と一致すること。
4. 安定版では `origin/main` と `origin/next` が同じコミットで、タグ先もそのコミットであること。
5. 同じ `package@version` が npm に未公開であること。

## 2. Trusted Publishing の前提

npm の Trusted Publisher は次の値と完全一致させます。

- Organization or user: `hiro-nyon`
- Repository: `cesium-heatbox`
- Workflow filename: `release.yml`
- Environment name: `cesium-heatbox`
- Allowed action: `npm publish`

Workflow は GitHub-hosted runner、Node.js 24、npm 11.5.1 以上、`id-token: write` を使用します。`actions/setup-node` の `registry-url` は `https://registry.npmjs.org` に設定します。これは現在の npm Trusted Publishing の推奨構成です。

長期保存する `NPM_TOKEN` や公開用 `NODE_AUTH_TOKEN` は設定しません。npm の Trusted Publisher 設定、GitHub Environment の保護ルール、不要な旧 npm publish token が残っていないことをリリース前に確認します。

## 3. `1.3.7-alpha.5` の準備

### 3.1 変更を `next` 向けに準備

ドキュメントや実装変更は作業ブランチでコミットし、base を `next` とする PR でレビューします。タグを作る前に、以下の版番号更新も `next` へ取り込みます。

```bash
npm version 1.3.7-alpha.5 --no-git-tag-version
```

このコマンドが更新するのは主に `package.json` と `package-lock.json` です。次のファイルは同じPR内で明示的に更新します。

- `package.json` の `version`
- `package-lock.json` のトップレベル `version`
- `package-lock.json` の `packages[""].version`
- `src/index.js` の `VERSION`
- `docs/API.md` など、現在バージョンを明示するユーザー向け文書
- `CHANGELOG.md` の `1.3.7-alpha.5` エントリ

`npm version` だけでは `src/index.js` の `VERSION` は更新されないため、それだけでリリースコミットを完成扱いにしないでください。

### 3.2 ローカル検証

各コマンドを個別に実行し、すべて成功することを確認します。

```bash
npm run -s lint
npm run -s type-check
npm test --silent -- --reporters=summary
npm run -s test:docs
npm run build
npm pack --dry-run
```

CI では最低対応版の `cesium@1.120.0` と `cesium@latest` を個別に smoke test します。PR の必須チェックがすべて成功するまでマージしません。

### 3.3 `next` へマージして個別タグをpush

PR マージ後、ローカルの `next` をリモート先端へ fast-forward し、そのコミットにだけタグを付けます。

```bash
git switch next
git pull --ff-only origin next
git tag -a v1.3.7-alpha.5 -m "release: 1.3.7-alpha.5"
git push origin v1.3.7-alpha.5
```

`git push origin --tags` は使用しません。ローカルに残った無関係な `v*` タグまでpushされ、複数の公開処理を起動する危険があるためです。

## 4. alpha.5 公開後の確認

GitHub Actions の Release Workflow が成功した後に確認します。

```bash
npm view cesium-heatbox dist-tags --json
npm view cesium-heatbox@1.3.7-alpha.5 version gitHead dist.attestations --json
```

期待値は次のとおりです。

- `next` が `1.3.7-alpha.5` を指す。
- `latest` は正式公開まで `1.3.6` のまま。
- provenance attestation が存在する。
- `gitHead` が `next` のリリースコミットと一致する。

利用者側の確認では、`npm install cesium-heatbox@next` を使用します。ESM、CommonJS、型定義、Cesium `1.120.0` と最新版、代表的なブラウザデモを確認します。

## 5. `1.3.7` 安定版への昇格

### 5.1 `next` で安定版番号を準備

alpha.5 の検証が完了したら、`next` から作業ブランチを作り、正式版へ更新します。

```bash
npm version 1.3.7 --no-git-tag-version
```

alpha.5 と同様に `package.json`、`package-lock.json` の2箇所、`src/index.js`、現在バージョンを記載する文書を `1.3.7` に揃えます。`CHANGELOG.md` は `Unreleased` の内容を正式な `1.3.7` セクションへ確定し、alpha期間で確認した内容と公開日を記録します。

ローカル検証とCIをすべて通し、まず base=`next` のPRへマージします。その後、`next` から `main` へのPRを作成してレビューします。

### 5.2 `main` と `next` を同一コミットにする

安定版タグを付ける時点では、リモートの `main` と `next` が完全に同じコミットを指している必要があります。

next→main PR は、`next` を後から同じコミットへ fast-forward できるマージ方式を使用します。GitHub 上のマージで main に merge commit が作成された場合は、`next` をその main へ fast-forward します。履歴が書き換わる squash/rebase merge は、このリリース同期では使用しません。

```bash
git fetch origin main next
git switch next
git merge --ff-only origin/main
git push origin next
git fetch origin main next
git rev-parse origin/main
git rev-parse origin/next
```

最後の2つのSHAが一致しない場合、タグを付けてはいけません。fast-forward できない場合は履歴を上書きせず、差分を確認して通常のPRで統合します。その統合コミットをもう一方のブランチにもfast-forwardして、両SHAが一致してからタグ付けへ進みます。

### 5.3 安定版タグを個別push

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.3.7 -m "release: 1.3.7"
git push origin v1.3.7
```

Workflow は npm publish が成功した後に GitHub Release を作成し、安定版だけ JSDoc とWikiを同期します。npm 公開が失敗した段階では、GitHub ReleaseやWikiを先行公開しません。

## 6. 安定版公開後の確認

```bash
npm view cesium-heatbox dist-tags --json
npm view cesium-heatbox@1.3.7 version gitHead dist.attestations --json
gh release view v1.3.7 --json tagName,isDraft,isPrerelease,body,url
```

`latest=1.3.7`、provenanceあり、`gitHead`がmain/next共通コミットと一致することを確認します。GitHub Releaseは`isDraft=false`、`isPrerelease=false`、`body`が空でなく、`What's Changed`と前版からの`Full Changelog`を含むことを確認します。続けて、公開Wikiの更新と、新規ディレクトリでの`npm install cesium-heatbox`を確認し、既定インストールが`1.3.7`になることを検証します。

## 7. 失敗時の扱い

### npm publish 前に失敗した場合

原因を修正し、新しいコミットで版番号を上げます。公開済みか不明な状態では同じ版番号を再利用せず、最初に `npm view` で確認します。まだnpm未公開で、誤ったGitタグだけが存在する場合に限り、タグを削除して正しいコミットへ付け直せます。

### npm publish 後に GitHub Release またはWikiだけ失敗した場合

npm の同一バージョンは再公開できないため、Release Workflow 全体を再実行して publish を繰り返しません。npm上の版とprovenanceを確認したうえで、GitHub ReleaseまたはWikiの失敗した後処理だけを修復します。

### 誤公開した場合

npm の `package@version` は、unpublishしても同じ版番号を再利用できません。影響に応じて誤版を `npm deprecate` し、修正版を新しいプレリリース番号またはpatch番号で公開します。dist-tagだけが誤っている場合は、正しい既存バージョンへ付け替えます。

```bash
npm dist-tag add cesium-heatbox@1.3.7-alpha.5 next
```

Gitタグの削除はnpmパッケージを削除せず、dist-tagも変更しません。各操作を別の状態変更として扱ってください。

## 8. 最終チェックリスト

- [ ] version対象ファイルとCHANGELOGが一致している。
- [ ] lint、type-check、test、test:docs、build、pack dry-runが成功した。
- [ ] PRのCIとCesium互換smoke testが成功した。
- [ ] alphaタグはnext先端、安定版タグはmain/next共通先端に付いている。
- [ ] `git push origin <exact-tag>` で1タグだけpushした。
- [ ] npm dist-tag、gitHead、provenanceを確認した。
- [ ] GitHub Release notesが非空で、正式版属性と比較リンクが正しい。
- [ ] 公開Wikiがstableタグの内容へ更新されている。
- [ ] 安定版では `latest` のインストールとGitHub Release、Wikiを確認した。
