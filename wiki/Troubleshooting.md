# Troubleshooting（よくある問題）

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
