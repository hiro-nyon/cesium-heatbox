# Troubleshooting（よくある問題）

> **⚠️ 注意**: このライブラリは現在npm未登録です。[Quick-Start](Quick-Start.md)を参照してGitHubから取得してください。

## npm install が失敗する（ERESOLVE）
```
npm ERR! ERESOLVE unable to resolve dependency tree
```
対応:
```
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## ESLint 設定エラー
```
Error: ESLint configuration in eslint.config.js is invalid
```
対応:
- ESLint 8.x 系を使用（9.x のフラット設定は未対応）
- `.eslintrc.js` 形式 or 既存設定に合わせる

## Cesium 型定義の警告
```
warn deprecated @types/cesium@...: cesium provides its own type definitions
```
対応:
```
npm uninstall @types/cesium
```

## Jest 設定エラー
```
Unknown option "moduleNameMapping" with value
```
対応:
- `moduleNameMapping` → `moduleNameMapper` へ修正

## import パスの誤り
```
Cannot find module '../src/core/CoordinateTransformer.js'
```
対応:
- 相対パスを正しく設定（例: `../../src/core/...`）

## Cesium オブジェクト未定義
```
TypeError: Cesium.Cartesian3 is not a constructor
```
対応:
- テスト時は Cesium モックを用意（`test/setup.js` を参照）
- 実ブラウザでは CDN などで Cesium を正しくロード

## v0.1.2 特有の問題

### wireframeOnly で何も表示されない
対応:
- `opacity` を 0 以外に設定（wireframeOnly 時は自動で 0.0 になります）
- `showOutline: true` を確認

### heightBased で高さが反映されない
対応:
- データに十分な密度差があることを確認
- `maxRenderVoxels` を適切に設定（推奨: 300前後）

### Entity の isDestroyed エラー
```
TypeError: t.isDestroyed is not a function
```
対応:
- v0.1.2 で修正済み。古いバージョンを使用している場合は更新してください
