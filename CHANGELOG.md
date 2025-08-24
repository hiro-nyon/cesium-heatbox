# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## v0.1.5 (近期リリース予定) - 基本機能強化

### Added
- デバッグ描画制御: `debug.showBounds` オプションでバウンディングボックス表示のON/OFF制御
- 未使用オプション整理: `batchMode: 'auto'` の実装または仕様からの削除で整合性確保
- カラーマップ選択: `viridis`、`inferno` 等の知覚均等カラーマップ選択機能
- 二極性データ対応: 正負値に対応した発散配色（blue-white-red）
- トップN強調表示: 密度上位ボクセルのみ色・サイズ・ラベル強調、他は淡色表示

### Fixed
- 実装と仕様の整合: ドキュメントでのPrimitive/Entity描画方式記述を現状に合わせて修正
- Cesiumバージョン整合: peerDependencies `cesium ^1.120.0` とサンプルCDN参照の一致
- ESM/UMDビルド整合: `package.json`のエントリポイントと実際のビルド成果物の一致確認

### 実装工数: 低 / 互換性影響: なし

## v0.2.0 (中期予定) - インタラクション機能

### Added
- 時間依存データ対応: `viewer.clock.currentTime` を用いた動的時刻での位置評価
- エンティティ範囲拡張: polygon、polyline、billboard、model等の代表点推定ユーティリティ
- 分位・対数スケール: 外れ値対策として分位（等頻度）・対数スケール選択
- 凡例・分布表示: 最小・最大・中央値・分位を併記した読み取り支援
- OIT有効化: `viewer.scene.orderIndependentTranslucency = true` での半透明重ね順問題緩和
- シルエット・エッジ強調: アウトライン・選択時シルエットによる輪郭強調

### Changed
- メモリ削減最適化: エンティティ配列保持方法の最適化（カウントのみ保持、必要フィールド限定等）

### 実装工数: 中 / 互換性影響: 軽微（新オプション追加のみ）

## v0.3.0 (長期予定) - 高度な可視化機能

### Added
- スライス表示: X/Y/Z断面移動による内部構造把握機能
- 深度フェード: カメラからの距離に応じた自動不透明度調整
- 前面ハイライト: 画面手前層の通常描画、奥層のワイヤーフレーム透視化
- フォーカス・コンテキスト: 選択ボクセル近傍の高彩度表示、周辺淡色化
- ROI抽出: 3Dボックス・ポリゴン範囲選択による局所分析
- ローカルヒストグラム: 選択範囲の値分布表示とカラーマップ調整連動

### 実装工数: 高 / 互換性影響: 中（新API追加、既存動作は維持）

## v0.4.0 (将来予定) - アーキテクチャ強化

### Added
- 2.5Dカラム表示: 高さ方向集計による棒グラフ（四角・六角）押し出し表示
- 六角ビニング: 地表六角格子・垂直層スタックによる規則的表現
- 空ボクセル最適化: LOD・スキップレベル・サンプリング表示による効率化

### Changed
- Primitiveバッチ描画: Entity大量描画限界解消のためGeometryInstance + Primitive実装検討
- 座標変換強化: 高緯度・大域範囲での誤差軽減向けENU/ECEFベース座標変換への段階移行

### 実装工数: 非常に高 / 互換性影響: 大（内部アーキテクチャ変更）

## v1.0.0 (未定) - メジャーリリース

### Added
- しきい値面（等値面）: 密度しきい値でのMarching Cubesメッシュ化・半透明表面表示

### Changed
- 破壊的変更: レガシーAPIの削除、パフォーマンス要件の見直し

### 実装工数: 極めて高 / 互換性影響: 破壊的変更

### 継続的タスク（全バージョン共通）
- テスト強化: VoxelRenderer分岐網羅、`Heatbox.updateOptions` の再描画分岐、ピック判定の実機整合テスト追加
- ドキュメント更新: 各バージョンの新機能に対応したドキュメント・サンプル更新

## [0.1.4] - 2025-08-24

### Added
- **ボクセルサイズ自動決定機能**: エンティティ数・分布範囲から最適な `voxelSize` を推定する `autoVoxelSize` オプションを追加（`voxelSize` 未指定時に有効）。データ密度に応じてパフォーマンス制限内で最適なサイズを自動算出。
- **統計情報拡張**: 自動調整の有無・元サイズ・最終サイズ・調整理由を `HeatboxStatistics` に追加（`autoAdjusted`, `originalVoxelSize`, `finalVoxelSize`, `adjustmentReason`）。
- **デバッグ情報拡張**: `getDebugInfo()` に `autoVoxelSizeInfo` として自動調整関連の詳細情報を追加（データ範囲、推定密度、調整ログ）。
- **基本例のUI改良**: `examples/basic` に Auto Voxel Size 切替チェックボックスと自動調整統計表示を追加。手動・自動の比較が可能。

### Changed
- **寸法仕様の明確化**: 描画ボックスの幅・奥行・高さは各軸の実セルサイズ（`cellSizeX/Y/Z`）を使用し、`voxelSize` は目標値として扱う仕様をドキュメントに明記。
- **API仕様の更新**: 全ドキュメント（API.md, wiki/*）でv0.1.4の新機能と寸法仕様変更を反映。
- **型定義の更新**: TypeScript定義に `autoVoxelSize` オプションと拡張統計フィールドを追加。

### Fixed
- **ボクセル重なり完全解決**: `DataProcessor.js` で分母ゼロ安全対策（`lonDen === 0 ? 0 : Math.floor(...)`）とボックス寸法の軸別実セルサイズ使用により、隣接ボクセルの重なりを完全に解消。
- **VoxelRenderer.js**: 描画時の寸法を `grid.cellSizeX/Y/Z` を優先使用し、フォールバック値も含めた堅牢な実装。
- **VoxelGrid.js**: 実際のセルサイズ（`cellSizeX/Y/Z`）をグリッド情報に追加し、ceil操作による分割数増加を考慮した正確な寸法計算を実装。

### Technical
- 新規ユーティリティ関数: `estimateInitialVoxelSize()`, `calculateDataRange()` を `validation.js` に追加
- パフォーマンス制限チェック: `validateVoxelCount()` との連携で制限超過時の自動調整
- 統計収集の強化: 自動調整プロセスの全情報を統計・デバッグ両方に記録

## [0.1.3] - 2025-01-22

### Fixed
- **選択イベント情報の修正**: `pickedObject.id.type` → `pickedObject.id.properties?.type` の判定不一致を修正
- **統計値の整合性修正**: `renderedVoxels` が実際の描画数を反映しない問題を修正  
- **ピック判定のキー取得**: `properties.key` から正しくキー値を取得するよう修正
- **未使用コード削除**: `this._selectedEntitySubscription` を完全に削除
- **Cesiumバージョン整合**: examples の CDN を 1.132 → 1.120 に修正

### Changed
- **型定義生成の整合性**: `tools/build-types.js` に `wireframeOnly`, `heightBased`, `outlineWidth`, `debug` オプションを追加
- **ログ抑制機能**: `debug` フラグや `NODE_ENV` による `console.log` 出力制御を実装
- **デフォルト設定最適化**: `DEFAULT_OPTIONS.debug = false` に変更（本番環境向け）
- **Debug境界ボックス制御**: `options.debug` 連動でバウンディングボックス表示をON/OFF制御

### Added  
- **基本例のUX改善**: UMD読み込み方式・日本語UI統一・Debugログチェックボックス追加
- **統計表示の改善**: 描画制限による非表示ボクセルの説明を追加
- **高度な例のUMD対応**: `wireframe-height-demo-umd.html` でブラウザ直接実行対応
- **Wiki API更新**: `HeatboxStatistics.renderedVoxels` を追記

### Technical
- **JSDoc HTML完全再生成**: docs/api内を最新実装に同期
- **パッケージバージョン更新**: v0.1.3にバージョンアップ
- **Lintエラー**: 0件達成・コード品質向上

## [0.1.2] - 2025-08-20

### Added
- `wireframeOnly` オプション: 枠線のみ表示で視認性を大幅改善
- `heightBased` オプション: 密度に応じた高さベース表現
- `outlineWidth` オプション: 枠線の太さ調整機能
- Playgroundに新しい表示オプションのUI追加
- `examples/advanced/wireframe-height-demo.js`: v0.1.2新機能の包括的デモ
- `examples/advanced/performance-optimization.js`: 大量データ処理とパフォーマンス最適化例
- `examples/advanced/README.md`: 高度な使用例の詳細ドキュメント

### Changed
- 重なったボクセルの視認性問題を解決
- デバッグログ出力の最適化（ESLintエラー対応）
- 全ドキュメントにnpm未登録状況の明記とGitHub取得方法の案内
- `examples/basic/`: v0.1.2新機能に対応したUI・ロジック更新
- `examples/advanced/entity-filtering.js`: 削除されたAPIの置き換えと新機能対応
- `wiki/Examples.md`: v0.1.2新機能の実用例を追加
- `wiki/Getting-Started.md`: npm未登録対応とインストール手順更新
- `types/index.d.ts`: 新オプションの型定義追加

### Fixed
- ESLintエラーとワーニングを修正
- 未使用変数とconsole.logの適切な処理
- v0.1.2のシンプル化に伴うテストケースの更新と修正
- 削除されたAPI（`CoordinateTransformer.getEntityPosition`等）を使用していたexamplesを修正

## [0.1.1] - 2025-08-20

### Changed
- レンダリング実装をPrimitiveベースからEntityベースに変更
- コンポーネント設計をシンプル化（直接的なアプローチ）
- 座標変換ロジックの簡素化とパフォーマンス最適化
- デバッグログ出力の強化

### Fixed
- Cesium 1.132との互換性問題を解決
- `entity.isDestroyed` メソッド呼び出しでのエラー対応
- エンティティの削除と表示/非表示切り替えでのエラー処理強化
- バウンディングボックス表示によるデバッグ支援機能追加

## [0.1.0] - 2025-08-20

### Added
- GitHub Actions CI workflow
- Contributing guidelines (docs/contributing.md)
- Tree-shaking support with sideEffects: false
- Rendering cap via `maxRenderVoxels` (draw top-N dense voxels)
- Unit tests for core modules (VoxelGrid, DataProcessor, VoxelRenderer)
- GitHub Wiki pages (`wiki/*`) and publishing script (`tools/wiki/publish-wiki.sh`)

### Changed
- Upgraded from alpha to stable release
- Restricted console output to development environment only
- Optimized package.json files array (removed src/ from distribution)
- Heatbox auto-adjusts voxel size to keep total voxels under performance limits
- Simplified CI workflow and updated Codecov settings
- API documentation refined and aligned with implementation

### Fixed
- Removed duplicate Jest configuration files
- Updated README links to point to existing files

## [0.1.0-alpha.3] - 2025-08-19

### Added
- New Heatbox APIs: `createFromEntities`, `getOptions`, `getDebugInfo`, static `filterEntities`
- Jest configuration migrated to CJS (`jest.config.cjs`) with robust Cesium module mock
- JSDoc config (`jsdoc.config.json`) and benchmark stub (`tools/benchmark.js`) for CI stability
- Types generation script (`tools/build-types.js`) and published `types/index.d.ts`

### Changed
- Unified Cesium imports to `import * as Cesium from 'cesium'`
- Fixed package entry points/exports to match built files (ESM/UMD)
- Webpack externals handling adjusted for ESM/UMD targets
- README documentation links corrected to existing docs
- Coverage thresholds tuned (temporary) until broader tests are added

### Fixed
- Bounds validation bug in sample data utility
- Zero-range and normalization edge cases in grid/index calculation
- Test failures due to missing Cesium mocks and ESM config mismatch

## [0.1.0-alpha.2] - 2025-01-21

### Added
- Enhanced documentation for developer onboarding
- Troubleshooting section in getting-started.md
- Development guide for beginners
- Quick-start guide for immediate usage
- Git and npm reference guide
- Data source selection API (roadmap)

### Changed
- Updated release workflow to support staged npm tags (alpha, beta, rc, latest)
- Improved CI/CD pipeline configuration
- Enhanced specification roadmap with data source selection feature

### Fixed
- ESLint configuration compatibility issues (downgraded to 8.x)
- Jest configuration for module name mapping
- Package dependency conflicts
- Build system configuration issues
- Test setup and import paths
- Removed @types/cesium dependency conflicts

### Technical
- Cleaned up node_modules and package-lock.json
- Reinstalled dependencies with proper versions
- Confirmed successful build and test execution

## [0.1.0-alpha.1] - 2025-07-09

### Added
- Initial implementation of Heatbox core library
- Basic voxel-based 3D heatmap visualization
- Entity processing and coordinate transformation
- HSV color interpolation for density visualization
- Batch rendering with Cesium Primitives
- Comprehensive test suite with Jest
- TypeScript type definitions
- Basic usage examples
- Complete project structure with build system

### Features
- Process CesiumJS entities into 3D voxel grid
- Automatic bounds calculation from entity distribution
- Configurable voxel size and appearance options
- Performance optimizations for large datasets
- Error handling and validation

### Technical
- ES modules support with UMD fallback
- Webpack build system with Babel transpilation
- ESLint configuration with TypeScript support
- GitHub Actions CI/CD pipeline
- Comprehensive documentation

### Known Issues
- Data source selection not yet implemented
- Real-time updates not supported
- Limited to uniform voxel sizes

### Breaking Changes
- None (initial release)
