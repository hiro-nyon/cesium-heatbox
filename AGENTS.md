## Agent Guidelines (English Appendix)

- Response language: All assistant responses for this repository must be in Japanese (concise, minimal logs).
- Do not commit build artifacts: never commit `dist/` or `types/` outputs.
- Publish strategy: npm publishing is handled by GitHub Actions. Do not run `npm publish` locally.

### Release Steps (including pre-releases)
1) Version bump
   - Update both `package.json#version` and `src/index.js` exported `VERSION` to the same value (e.g. `0.1.11-alpha.5`).
2) Validation
   - Run `npm run -s lint && npm run -s type-check && npm test --silent -- --reporters=summary`.
   - Ensure `npm run build` succeeds (bundles + types).
3) Tagging (triggers Actions)
   - Tag name must be `v<version>` (e.g. `v0.1.11-alpha.5`).
   - Example:
     - `git tag -a v0.1.11-alpha.5 -m "release: 0.1.11-alpha.5"`
     - `git push origin v0.1.11-alpha.5`
4) Publish
   - The pushed tag triggers the GitHub Actions workflow which runs `npm publish` with repository secrets.

### Notes
- CI must be green before tagging.
- Performance acceptance tests are environment-sensitive; run them only when needed with `PERF_TESTS=1` (default is skipped).
- Update docs/examples in a follow-up PR when public APIs change.
