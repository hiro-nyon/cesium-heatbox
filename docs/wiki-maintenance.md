# GitHub Wiki Automation and Maintenance Procedures (GitHub Wiki 自動化・保守手順)

[English](#english) | [日本語](#日本語)

## English

### Overview

v0.1.6 introduced GitHub Wiki automatic synchronization functionality. Changes to docs/api, README.md, and CHANGELOG.md are automatically reflected in the Wiki.

### Automation Configuration

#### 1. GitHub Actions Workflow

**File**: `.github/workflows/wiki-sync.yml`

**Trigger Conditions**:
- Push changes to `docs/` on `main` branch
- Push changes to `wiki/` folder  
- Changes to `README.md`, `CHANGELOG.md`
- Manual execution (`workflow_dispatch`)

**Permission Requirements**:
- `GITHUB_TOKEN` (basic permissions)
- Or `WIKI_TOKEN` Personal Access Token (recommended)

#### 2. npm Scripts

```bash
# Document generation + Wiki sync + GitHub Wiki publishing (complete process)
npm run wiki:update

# Individual execution
npm run docs           # JSDoc generation
npm run wiki:sync      # docs/api → wiki/ conversion
npm run wiki:publish   # Push to GitHub Wiki
```

#### 3. File Configuration

```
cesium-heatbox/
├── .github/workflows/wiki-sync.yml    # Automation workflow
├── docs/api/                           # JSDoc generation (source)
├── wiki/                              # Markdown conversion results
├── tools/
│   ├── wiki-sync.js                   # docs/api → wiki/ conversion
│   └── wiki/publish-wiki.sh           # GitHub Wiki push
└── docs/wiki-maintenance.md           # This procedure document
```

### Setup Procedures

#### 1. Personal Access Token Setup (Recommended)

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 
3. Permission selection:
   - `repo` (full access)
   - Or minimum permissions: `public_repo` + Wiki write permissions
4. Copy generated token
5. Repository → Settings → Secrets and variables → Actions
6. Create new secret: `WIKI_TOKEN` = {generated token}

#### 2. Initial Test Execution

```bash
# Manual test
npm run wiki:update

# GitHub Actions manual execution
# Repository → Actions → "Wiki Sync" → "Run workflow"
```

#### 3. Operation Verification

- Check https://github.com/hiro-nyon/cesium-heatbox/wiki
- Verify Home.md, Release-Notes.md are correctly updated
- Check API-related pages are generated

### Operation Procedures

#### Daily Operation (Automatic)

1. Push docs/ changes to `main` branch
2. Wiki automatically updates after 2-3 minutes
3. Check https://github.com/hiro-nyon/cesium-heatbox/wiki as needed

#### Manual Execution (When Needed)

```bash
# Execute complete process locally
npm run wiki:update

# Execute with GitHub Actions (force sync)
# Repository → Actions → "Wiki Sync" → "Run workflow" → force_sync: true
```

#### Emergency Fallback

1. **If automation fails**:
   ```bash
   npm run wiki:publish  # Manually push to GitHub Wiki
   ```

2. **To revert Wiki contents**:
   ```bash
   git clone https://github.com/hiro-nyon/cesium-heatbox.wiki.git
   cd cesium-heatbox.wiki
   git log --oneline  # Check commit history
   git reset --hard <previous_good_commit>
   git push --force-with-lease origin master
   ```

3. **To return to completely manual operation**:
   - Disable `.github/workflows/wiki-sync.yml`
   - Use existing `tools/wiki/publish-wiki.sh`

### Troubleshooting

#### Common Errors

1. **`remote: Permission denied`**
   - Check `WIKI_TOKEN` permissions
   - Check token expiration
   - Check repository access permissions

2. **`No changes to commit to wiki`**
   - Normal operation (behavior when no changes)
   - Force sync: Execute manually with `force_sync: true`

3. **`Wiki changes detected but sync failed`**
   - Check Wiki repository status
   - Execute manual fallback

#### Debugging Methods

1. **Check GitHub Actions logs**:
   Repository → Actions → relevant workflow → detailed logs

2. **Test with local execution**:
   ```bash
   npm run wiki:sync  # Test conversion only
   npm run wiki:publish  # Test push only
   ```

3. **Check differences**:
   ```bash
   git diff wiki/  # Check conversion results
   ```

### Maintenance and Improvement

#### Regular Inspection (Monthly)

- [ ] Check Wiki content consistency
- [ ] Check for broken links  
- [ ] Check GitHub Actions execution history
- [ ] Check Personal Access Token expiration

#### Feature Improvements (Future)

- Improve JSDoc → Markdown conversion quality
- Unify Wiki templates
- Enhance difference notifications
- Integration with CI/CD pipeline

### References

- [GitHub Wiki Git Access](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages#adding-or-editing-wiki-pages-locally)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 日本語

## 概要

v0.1.6でGitHub Wikiの自動同期機能を導入。docs/api、README.md、CHANGELOG.md の変更が自動的にWikiに反映される。

## 自動化の構成

### 1. GitHub Actions Workflow

**ファイル**: `.github/workflows/wiki-sync.yml`

**トリガー条件**:
- `main` ブランチへの `docs/` 変更push
- `wiki/` フォルダ変更push  
- `README.md`、`CHANGELOG.md` 変更push
- 手動実行（`workflow_dispatch`）

**権限要件**:
- `GITHUB_TOKEN` （基本権限）
- または `WIKI_TOKEN` Personal Access Token（推奨）

### 2. npm Scripts

```bash
# ドキュメント生成 + Wiki同期 + GitHub Wiki公開（全工程）
npm run wiki:update

# 個別実行
npm run docs           # JSDoc生成
npm run wiki:sync      # docs/api → wiki/ 変換
npm run wiki:publish   # GitHub Wikiにpush
```

### 3. ファイル構成

```
cesium-heatbox/
├── .github/workflows/wiki-sync.yml    # 自動化workflow
├── docs/api/                           # JSDoc生成（ソース）
├── wiki/                              # Markdown変換結果
├── tools/
│   ├── wiki-sync.js                   # docs/api → wiki/ 変換
│   └── wiki/publish-wiki.sh           # GitHub Wiki push
└── docs/wiki-maintenance.md           # この手順書
```

## 設定手順

### 1. Personal Access Token設定（推奨）

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 
3. 権限選択:
   - `repo` （フルアクセス）
   - または最小権限: `public_repo` + Wiki write権限
4. 生成されたトークンをコピー
5. Repository → Settings → Secrets and variables → Actions
6. 新しいsecret作成: `WIKI_TOKEN` = {生成したトークン}

### 2. 初回テスト実行

```bash
# 手動テスト
npm run wiki:update

# GitHub Actions手動実行
# Repository → Actions → "Wiki Sync" → "Run workflow"
```

### 3. 動作確認

- https://github.com/hiro-nyon/cesium-heatbox/wiki を確認
- Home.md、Release-Notes.md が正しく更新されているか
- API関連ページが生成されているか

## 運用手順

### 日常運用（自動）

1. `main` ブランチに docs/ 変更をpush
2. 2-3分後にWikiが自動更新される
3. 必要に応じて https://github.com/hiro-nyon/cesium-heatbox/wiki で確認

### 手動実行（必要時）

```bash
# ローカルで全工程実行
npm run wiki:update

# GitHub Actionsで実行（force sync）
# Repository → Actions → "Wiki Sync" → "Run workflow" → force_sync: true
```

### 緊急時のフォールバック

1. **自動化が失敗した場合**:
   ```bash
   npm run wiki:publish  # 手動でGitHub Wikiにpush
   ```

2. **Wikiの内容を元に戻したい場合**:
   ```bash
   git clone https://github.com/hiro-nyon/cesium-heatbox.wiki.git
   cd cesium-heatbox.wiki
   git log --oneline  # コミット履歴確認
   git reset --hard <前の正常なコミット>
   git push --force-with-lease origin master
   ```

3. **完全手動運用に戻す場合**:
   - `.github/workflows/wiki-sync.yml` を無効化
   - 既存の `tools/wiki/publish-wiki.sh` を使用

## トラブルシューティング

### よくあるエラー

1. **`remote: Permission denied`**
   - `WIKI_TOKEN` の権限確認
   - トークンの有効期限確認
   - リポジトリアクセス権限確認

2. **`No changes to commit to wiki`**
   - 正常動作（変更がない場合の動作）
   - 強制同期: `force_sync: true` で手動実行

3. **`Wiki changes detected but sync failed`**
   - Wikiリポジトリの状態確認
   - 手動フォールバック実行

### デバッグ方法

1. **GitHub Actions ログ確認**:
   Repository → Actions → 該当workflow → 詳細ログ

2. **ローカル実行でテスト**:
   ```bash
   npm run wiki:sync  # 変換のみテスト
   npm run wiki:publish  # push のみテスト
   ```

3. **差分確認**:
   ```bash
   git diff wiki/  # 変換結果の確認
   ```

## 維持・改善

### 定期点検（月次）

- [ ] Wiki内容の整合性確認
- [ ] リンク切れチェック  
- [ ] GitHub Actions実行履歴確認
- [ ] Personal Access Token有効期限確認

### 機能改善（将来）

- JSDoc → Markdown変換品質向上
- Wiki テンプレート統一
- 差分通知の強化
- CI/CDパイプラインとの統合

## 参考

- [GitHub Wiki Git Access](https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages#adding-or-editing-wiki-pages-locally)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
