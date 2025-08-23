# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🎯 v0.1.4: ボクセルサイズ自動決定機能 (設計・ドキュメント完了 📋)

#### 📋 Design & Documentation Prepared (完了 - 2025-01-22)
- **設計仕様書**: `docs/v0.1.4-auto-voxelsize-design.md` 作成（詳細設計・API仕様）
- **実装ガイド**: `docs/v0.1.4-implementation-guide.md` 作成（コード例・テスト観点含む）
- **実装準備**: 必要な関数・修正箇所・エラーハンドリング戦略を明確化

#### Added (実装予定)
- **ボクセルサイズ自動決定**: エンティティ数・分布範囲に基づく最適な `voxelSize` 自動計算機能
  - `autoVoxelSize: true` オプション追加（既存互換性維持のためデフォルト false）
  - データ密度とパフォーマンスのバランスを考慮した自動調整
  - `validation.validateVoxelCount` の既存ロジック活用・拡張
  - 手動指定時（`voxelSize` 明示）は自動調整を無効化
- **統計情報拡張**: 自動調整結果を統計に追加（調整有無・調整理由等）

#### Fixed (実装予定)
- **ドキュメント整合性**: 「総ボクセル数が多い場合に自動でボクセルサイズを上げる」記述と実装の一致
- **推奨サイズ計算**: `validateVoxelCount` の推奨サイズ計算を実際に使用するよう修正

#### Changed (実装予定)  
- **デフォルト動作**: 新規ユーザー推奨は自動サイズ決定、既存ユーザー互換性は完全維持
- **デバッグ情報拡張**: `getDebugInfo()` に自動調整情報セクション追加

---

### 🔶 Phase 2 → v0.2.0: 機能追加・UX向上 (短期 - 1週間)

#### Added (計画)
- **デバッグ描画制御**: `debug.showBounds` オプションでバウンディングボックス表示のON/OFF制御
- **時間依存データ対応**: `viewer.clock.currentTime` を使った動的時刻による位置評価オプション
- **メモリ削減オプション**: エンティティ実体保持の軽量化（カウントのみ、必要フィールドのみ等）

#### Changed (計画)
- **未使用オプションの整理**: `batchMode: 'auto'` の実装追加または仕様書からの削除で整合性確保

### 🏗️ Phase 3 → v0.3.0: アーキテクチャ強化 (中期 - 2-4週間)

#### Added (計画)
- **カラーマッピング強化**: HSL/HSVベース、分位点転送関数、Viridisなどのカラーマップ選択機能
- **エンティティ対応範囲拡張**: polygon/polyline/billboard/model などの代表点推定ユーティリティ
- **空ボクセル最適化**: LOD/スキップレベルやサンプリング表示による大量空ボクセル処理の効率化

#### Changed (計画)
- **座標変換の強化**: 高緯度・大域的範囲での誤差軽減のため、ENU/ECEFベース座標変換への段階的移行検討
- **Primitiveバッチ描画**: Entity大量描画限界の解決に向けたGeometryInstance + Primitive実装の検討

### 📚 ドキュメント・配布整備 (継続)

#### Changed (計画)
- **実装と仕様の整合**: 仕様書「Primitiveでバッチ描画」→「現行はEntityベース・将来Primitive対応予定」に修正
- **Cesiumバージョン整合**: peerDependencies `cesium ^1.120.0` と例の CDN `1.132` の不整合を解消
- **ESM/UMDビルド確認**: `package.json` の `module`/`main` が実際のビルド成果物と一致することを確認

#### Fixed (計画)
- **テストカバレッジ向上**: VoxelRendererの分岐網羅、Heatbox.updateOptionsの再描画分岐テスト追加
- **実機テスト整合性**: Cesium Entity構造に即したピック判定テストの追加

---

### 📋 適用優先度の根拠

**Phase 1** は現在のライブラリが抱える**機能的な不具合**であり、ユーザー体験に直接影響するため最優先で対応。

**Phase 2** は**実用性とパフォーマンス**を向上させる機能追加で、ライブラリの価値を高める。

**Phase 3** は**長期的なスケーラビリティ**を確保するアーキテクチャ変更で、大規模データや高度な用途への対応。

各フェーズは独立性を保ちつつ段階的に適用可能な設計とし、ユーザーへの影響を最小限に抑制。

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
