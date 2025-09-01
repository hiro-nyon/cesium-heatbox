# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> **Note**: 将来の予定・ロードマップは [ROADMAP.md](ROADMAP.md) および [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues) で管理されています。

## [0.1.8] - 2025-08-30

### Added
- **完全バイリンガル対応**: 全ドキュメントとソースコードの日英併記対応
  - 全 docs/ ファイル（API.md, contributing.md, development-guide.md など）を「English → 日本語」構造に統一
  - 各ページ先頭に言語切替リンク（[English](#english) | [日本語](#日本語)）を追加
  - 包括的な英語翻訳：技術仕様、開発ガイド、API仕様、貢献ガイドなど全セクション
- **ソースコード国際化**: 全 JSDoc コメントの英日併記対応
  - メインクラス（Heatbox.js）とコアモジュール（CoordinateTransformer, DataProcessor, VoxelGrid, VoxelRenderer）
  - ユーティリティモジュール（constants.js, logger.js, validation.js）とエントリーポイント（index.js）
  - パラメータ、戻り値、メソッド説明を「English description / 日本語説明」形式で併記
- **Wiki自動化の国際化対応**: tools/wiki-sync.js の大幅拡張
  - JSDoc → Markdown 変換時の自動バイリンガル構造生成
  - API Reference インデックスページの日英併記対応
  - テーブルヘッダー（Name/型, Type/型 など）の自動翻訳機能

### Enhanced
- **ドキュメント構造統一**: 全9個の docs/ ファイルで一貫したバイリンガル形式を採用
  - 言語順序の統一：常に English → 日本語 の順序
  - セクション識別子の統一：`## English` と `## 日本語` で明確に区分
  - ナビゲーション統一：各ページに `[English](#english) | [日本語](#日本語)` リンク
- **ADR（Architecture Decision Records）整合性**: 不整合だったADRファイル一覧を修正
  - docs/adr/README.md に ADR-0003, ADR-0004, ADR-0005 を正式に追加
  - 全ADRのステータス情報を最新状態に同期
- **README.md国際化**: 既存のバイリンガル構造を維持しつつ品質向上
  - 特徴比較、インストール方法、使用例の英語セクション充実

### Documentation
- **開発者向けドキュメント**: 英語翻訳による国際的な開発者サポート強化
  - Quick Start Guide: 10-15分セットアップガイドの英語版
  - Development Guide: 初心者向け開発ガイドの包括的英語翻訳
  - Git & NPM Reference: コマンドリファレンスの英語版
  - Legend Implementation Guide: カスタム凡例実装の英語版
- **API仕様**: 全てのクラス・メソッド・パラメータの英語説明追加
  - TypeScript型定義情報の英語解説
  - エラーハンドリング、パフォーマンス要件の英語ドキュメント
  - 実装ガイドライン、制約事項の英語版

### Technical
- **Wiki自動同期機能拡張**: バイリンガル対応による生成品質向上
  - 日本語テキスト自動判定機能（`isJapanese()` 関数）
  - 言語別セクション生成の自動化
  - API Reference インデックスのバイリンガル構造自動生成
- **型定義国際化**: JSDoc コメントの英日併記による TypeScript 支援向上
- **保守性向上**: 統一されたドキュメント構造による保守コスト削減

### Compatibility
- **Non-breaking**: 全ての変更は後方互換性を維持（APIに変更なし）
- **国際対応**: 日本語ユーザーの既存ワークフローを完全保持
- **開発環境**: 既存の開発・ビルドプロセスに影響なし

## [0.1.7] - 2025-08-26

### Added
- **適応的枠線制御**: 近傍密度、TopN/選択、カメラ距離、重なりリスクに応じた自動調整
  - `adaptiveOutlines: true` で適応的制御を有効化（オプトイン）
  - `outlineWidthPreset` でプリセット選択（'uniform', 'adaptive-density', 'topn-focus'）
  - 近傍密度計算、カメラ距離補正、重なりリスク考慮の自動パラメータ調整
- **表示モード拡張**: `outlineRenderMode` で描画方式を制御
  - 'standard': 既存の標準モード（デフォルト）
  - 'inset': インセット枠線主体の表示
  - 'emulation-only': エミュレーション専用（標準枠線・インセットなし）
- **透明度resolver**: カスタム透明度制御機能
  - `boxOpacityResolver: (ctx) => number(0-1)` でボックス透明度制御
  - `outlineOpacityResolver: (ctx) => number(0-1)` で枠線透明度制御
  - 優先順位: resolver > 適応的パラメータ > 固定値

### Enhanced
- **優先順位システム**: ユーザーresolverが指定された場合は適応ロジックは補助的に動作
- **安全域クランプ**: 透明度（0-1）、インセット量、線太さの範囲を安全域でクランプ
- **エラーハンドリング**: resolver実行時の例外を適切にキャッチしフォールバック値を使用
- **Examples更新**: basic/index.htmlに適応的表示UIとエミュレーション専用トグルを追加

### Technical
- **適応的制御パラメータ**: neighborhoodRadius, densityThreshold, cameraDistanceFactor, overlapRiskFactor
- **性能最適化**: 適応ロジックのオーバーヘッドを<5%に抑制（事前計算・キャッシュ活用）
- **インセット制御拡張**: _createInsetOutline でインセット量のオーバーライド対応
- **テスト追加**: v0.1.7新機能の包括的テストケース追加

### API Changes
- `DEFAULT_OPTIONS` に v0.1.7 の新オプションを追加
- `VoxelRenderer._calculateAdaptiveParams()` メソッド追加
- Examples UI に v0.1.7 制御パネル追加

## [0.1.6.2] - 2025-08-26

### Fixed
- Wiki API-Reference のクラスリンクが生の.mdとして表示される問題を修正（拡張子なしのWikiページリンクに変更）。
- Lintエラー（未使用変数）を修正。

### Docs
- API（docs/API.md）に太線エミュレーションの中間位置配置と inset 連携を明記。
- docs/api を再生成、Wikiのクラスページを再生成・同期。

## [0.1.6.2] - 2025-08-26

### Added
- **「すべて太線」モード**: `outlineEmulation: 'all'` で全ボクセルに太線エミュレーションを適用
- **厚い枠線表示機能**: `enableThickFrames` オプションで WebGL 1px 制限を完全回避
  - インセット枠線とメインボックス間を12個のフレームボックスで埋める
  - 視覚的に厚い枠線を実現（WebGL制限に関係なし）
  - 手動制御または「すべて太線」選択時の自動有効化
- **自動最適化機能**: 「すべて太線」選択時に最適設定を自動適用
  - インセット枠線: 2メートルの自動適用
  - 厚い枠線表示: 自動有効化
  - コンソールログ: 自動適用の確認メッセージ

### Enhanced
- **太線エミュレーション拡張**: `outlineEmulation` に 'non-topn' と 'all' モード追加
- **フレーム配置の精密化**: 外側・内側境界の中心に正確フィット（隣接重なり防止）
- **Playground UI改善**: 太線エミュレーション選択肢を4つに拡張
  - 無効 / TopNのみ / TopN以外のみ / すべて太線（自動インセット適用）
- **adaptiveモード最適化**: 「すべて太線」時の太さ調整（TopN: 6px, その他: 4px）

### Fixed
- **隣接ボクセル重なり**: 正確な境界計算により隣接ボクセルとの重なりを解決
- **地形表示安定化**: EllipsoidTerrainProvider の明示的設定

### Technical
- **フレーム位置計算**: 外側・内側境界の中心への精密配置アルゴリズム
- **デバッグ機能強化**: 境界情報の詳細ログ出力で検証可能
- **バリデーション**: `enableThickFrames` オプションの検証機能追加

## [0.1.6.1] - 2025-08-26

### Added
- **インセット枠線機能 (ADR-0004)**: 枠線を内側にオフセット表示する機能を追加
  - `outlineInset` オプション: インセット距離（メートル、デフォルト: 0）
  - `outlineInsetMode` オプション: 適用範囲（'all' | 'topn'、デフォルト: 'all'）
  - 二重Box方式で実装（fill用 + outline専用エンティティ）
  - 各軸寸法の最大40%まで制限（過度な縮小を防止）
- **Examples更新**: Basic/Advanced例にインセット枠線UI追加
  - スライダー（メートル単位）とモード選択（OFF/TopN/全体）
  - outline-overlap-demo にインセット枠線機能統合

### Technical
- インセット枠線のユニットテスト・結合テスト追加
- バリデーション機能でインセット枠線パラメータ検証
- パフォーマンス影響: エンティティ数最大2倍（制限値内で管理）

## [0.1.6] - 2025-08-26

### Added
- **枠線重なり対策**: `voxelGap` オプションによるボクセル間ギャップ設定で視認性向上
- **枠線透明度制御**: `outlineOpacity` オプションで重なり部分の視覚ノイズ軽減
- **動的枠線太さ制御**: `outlineWidthResolver` 関数により個別ボクセルの枠線太さを動的調整
- **Legend実装ガイド**: `docs/legend-implementation-guide.md` でカスタム凡例の実装方法を詳細解説
- **Wiki自動同期**: `tools/wiki-sync.js` によるJSDoc HTML→Markdown変換自動化
- **GitHub Actions**: Wiki更新の完全自動化ワークフロー (`.github/workflows/wiki-sync.yml`)
- **パフォーマンステスト**: `outlineWidthResolver` 使用時のパフォーマンス影響測定
- **Examples UI強化**: v0.1.6新機能のリアルタイム調整UI（voxelGap, outlineOpacity, adaptiveOutline）

### Enhanced
- **VoxelRenderer**: 枠線重なり対策とパフォーマンス最適化
- **Examples**: 適応的枠線制御のデモ実装（密度に応じた動的太さ調整）
- **Test Coverage**: 色補間・発散配色・TopN強調の主要分岐テスト追加
- **Documentation**: Wiki保守手順書 (`docs/wiki-maintenance.md`) 追加

### Technical
- **Dependencies**: `jsdom` 追加（Wiki同期用）
- **Validation**: `voxelGap`/`outlineOpacity`/`outlineWidthResolver` の新オプション検証
- **Performance**: 動的枠線制御のパフォーマンス影響<5%を達成（ADR-0003受け入れ基準準拠）

### Compatibility
- **Non-breaking**: 全ての変更は後方互換性を維持
- **CesiumJS**: 1.120.0+ サポート継続
- **Browser**: モダンブラウザ (ES6+) 対応

## [0.1.5] - 2025-08-25

### Added
- **デバッグ境界制御**: `debug.showBounds` オプションでバウンディングボックス表示のON/OFF制御。`debug: true` (従来)と `debug: { showBounds: true }` (新規)をサポート。
- **知覚均等カラーマップ**: `colorMap: 'viridis'` / `'inferno'` オプションで科学的定番のカラーマップをサポート。既存の `minColor`/`maxColor` は、`colorMap: 'custom'` で継続使用可能。
- **二極性データ対応**: `diverging: true` と `divergingPivot` オプションでblue-white-red発散配色を実装。正負値のデータに適合。
- **TopN強調表示**: `highlightTopN` オプションで密度上位Nボクセルのみを強調表示。`highlightStyle` でアウトライン幅や不透明度の調整が可能。

### Deprecated
- **batchMode非推奨化**: `batchMode: 'auto'` オプションは非推奨化され、`debug` 時に警告を表示。v1.0.0で削除予定。

### Changed
- **Logger拡張**: `Logger.setLogLevel()` が `debug` オプションのオブジェクト形式に対応。互換性を保ちつつ拡張。
- **VoxelRenderer機能拡張**: カラーマップ対応とTopN強調表示で `interpolateColor()` 関数を大幅強化。
- **ドキュメント更新**: README.md でv0.1.5の新機能を記載。

### Fixed
- **バージョン整合性**: package.json の peerDependencies `cesium: "^1.120.0"` とサンプルファイルのCDN参照(1.120)が一致であることを確認。

### Technical
- **バージョン更新**: package.json を v0.1.5 に更新
- **constants.js拡張**: DEFAULT_OPTIONS にv0.1.5新機能のデフォルト値を追加
- **validation.js強化**: 新オプションのバリデーションとbatchMode非推奨警告を実装
- **カラーマップLUT**: VoxelRendererに16段階のviridis/inferno/divergingカラーテーブルを実装

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

## [0.1.3] - 2025-08-23

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
- 全ドキュメントの整備とインストール方法の更新
- `examples/basic/`: v0.1.2新機能に対応したUI・ロジック更新
- `examples/advanced/entity-filtering.js`: 削除されたAPIの置き換えと新機能対応
- `wiki/Examples.md`: v0.1.2新機能の実用例を追加
- `wiki/Getting-Started.md`: インストール手順の更新
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
