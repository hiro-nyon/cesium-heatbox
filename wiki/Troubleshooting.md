# Troubleshooting（トラブルシューティング） / Troubleshooting

**日本語** | [English](#english)

## 日本語

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

## English

### npm install fails (ERESOLVE)
```
npm ERR! ERESOLVE unable to resolve dependency tree
```
Solution:
```
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ESLint configuration error
```
Error: ESLint configuration in eslint.config.js is invalid
```
Solution:
- Use ESLint 8.x series (9.x flat configuration not supported)
- Use `.eslintrc.js` format or match existing configuration

### Cesium type definition warnings
```
warn deprecated @types/cesium@...: cesium provides its own type definitions
```
Solution:
```
npm uninstall @types/cesium
```

### Jest configuration error
```
Unknown option "moduleNameMapping" with value
```
Solution:
- Fix `moduleNameMapping` → `moduleNameMapper`

### Import path errors
```
Cannot find module '../src/core/CoordinateTransformer.js'
```
Solution:
- Set relative paths correctly (e.g., `../../src/core/...`)

### Cesium object undefined
```
TypeError: Cesium.Cartesian3 is not a constructor
```
Solution:
- Prepare Cesium mocks for testing (refer to `test/setup.js`)
- Load Cesium correctly via CDN in actual browsers

### v0.1.2 Specific Issues

#### Nothing displays with wireframeOnly
Solution:
- Set `opacity` to non-zero (wireframeOnly automatically sets it to 0.0)
- Confirm `showOutline: true`

#### Height not reflected with heightBased
Solution:
- Confirm that data has sufficient density variation
- Set `maxRenderVoxels` appropriately (recommended: around 300)

#### Entity isDestroyed error
```
TypeError: t.isDestroyed is not a function
```
Solution:
- Fixed in v0.1.2. Please update if using an older version
