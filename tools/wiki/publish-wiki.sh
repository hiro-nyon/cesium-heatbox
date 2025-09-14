#!/usr/bin/env bash
set -euo pipefail

# Usage: bash tools/wiki/publish-wiki.sh <owner> <repo> [branch]
# Example: bash tools/wiki/publish-wiki.sh hiro-nyon cesium-heatbox master

OWNER="${1:-}"
REPO="${2:-}"
BRANCH="${3:-master}"

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Usage: $0 <owner> <repo> [branch]" >&2
  exit 1
fi

WIKI_URL="https://github.com/${OWNER}/${REPO}.wiki.git"
WORKDIR=".wiki-tmp"

echo "Cloning: ${WIKI_URL} ..."
rm -rf "$WORKDIR"
git clone "$WIKI_URL" "$WORKDIR"

echo "Copying wiki/*.md -> ${WORKDIR}/ ..."
cp -f wiki/*.md "$WORKDIR"/

pushd "$WORKDIR" >/dev/null
## Configure author identity locally (no global side effects)
GIT_USER_NAME_DEFAULT="${GITHUB_ACTOR:-github-actions[bot]}"
GIT_USER_EMAIL_DEFAULT="${GIT_USER_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"
git config user.name "${GIT_USER_NAME:-$GIT_USER_NAME_DEFAULT}"
git config user.email "${GIT_USER_EMAIL:-$GIT_USER_EMAIL_DEFAULT}"

## If token is available, set remote URL with token for push auth
# Prefer WIKI_TOKEN, then GH_TOKEN (GitHub CLI/Actions), then GITHUB_TOKEN
TOKEN="${WIKI_TOKEN:-}"
if [[ -z "$TOKEN" && -n "${GH_TOKEN:-}" ]]; then TOKEN="$GH_TOKEN"; fi
if [[ -z "$TOKEN" && -n "${GITHUB_TOKEN:-}" ]]; then TOKEN="$GITHUB_TOKEN"; fi

if [[ -n "$TOKEN" ]]; then
  # Use GitHub-recommended x-access-token as username, token as password part
  git remote set-url origin "https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.wiki.git"
else
  echo "Warning: No WIKI_TOKEN/GH_TOKEN/GITHUB_TOKEN provided; push may fail due to auth" >&2
fi

git checkout "$BRANCH" || true
git add .
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "docs(wiki): update pages"
  git push origin "$BRANCH"
fi
popd >/dev/null

echo "Done."
