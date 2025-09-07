# Contributing

Welcome! This project maintains two primary lanes:

- main: stable, always buildable from source (publishes to npm dist-tag `latest`).
- next: integration lane for in-progress work (publishes pre-releases to npm dist-tag `next`).

Beginner-friendly summary and step-by-step release guidance are in `docs/RELEASE_RUNBOOK.md`.

## Branching
- Use feature branches off `next`, e.g. `feat/adr8-split-color-debug`.
- Open PRs into `next`. Keep changes small and focused.
- When ready for a stable release, prepare a `release/vX.Y.Z` branch if needed, then merge to `main`.

## CI and Publishing
- `.github/workflows/ci.yml`: runs on PRs and pushes to `main`/`next` (install, test, build, pack dry-run).
- `.github/workflows/release.yml`: runs only when Git tags are pushed (e.g. `v0.1.10` or `v0.1.10-alpha.0`).
  - Pre-release tags (alpha/beta/rc) publish to `@next`.
  - Stable tags publish to `@latest`.

## Scripts
- `npm test`: runs Jest tests.
- `npm run build`: builds bundles with webpack and generates types.
- `npm pack --dry-run`: inspects what would be published to npm.

## Releasing (tag-driven)
- Pre-release: `npm version prerelease --preid=alpha` → `git push --tags` → published to `@next`.
- Stable: `npm version X.Y.Z` → `git push --tags` → published to `@latest`.

Please see `docs/RELEASE_RUNBOOK.md` for full details and rollback instructions.
