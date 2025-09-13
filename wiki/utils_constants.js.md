# Source: utils/constants.js

**日本語** | [English](#english)

## English

See also: [Class: constants](constants)

```javascript
/**
 * Constant definitions for CesiumJS Heatbox library.
 * CesiumJS Heatbox ライブラリの定数定義。
 */

/**
 * Default option values.
 * デフォルト設定値。
 */
export const DEFAULT_OPTIONS = {
  voxelSize: 20,
  opacity: 0.8,
  emptyOpacity: 0.03,
  showOutline: true,
  showEmptyVoxels: false,
  minColor: [0, 32, 255],
  maxColor: [255, 64, 0],
  maxRenderVoxels: 50000,
  batchMode: 'auto',
  debug: false, // ログ制御（false で本番モード、true で開発モード、またはオブジェクト）
  autoVoxelSize: false, // v0.1.4: 自動ボクセルサイズ決定（既存互換性のためfalse）
  // v0.1.5: 新機能
  colorMap: 'custom', // 'custom', 'viridis', 'inferno'
  diverging: false, // 二極性データ対応
  divergingPivot: 0, // 二極性配色のピボット値
  highlightTopN: null, // トップN強調表示（null: 無効）
  highlightStyle: {
    outlineWidth: 4,
    boostOpacity: 0.2
  },
  // v0.1.6: 枠線重なり対策・柔軟化
  voxelGap: 0, // ボクセル間ギャップ（メートル）
  outlineOpacity: 1.0, // 枠線透明度（0-1）
  outlineWidthResolver: null, // 関数: (params) => number で動的太さ制御
  // 実質的な太さ表現のための代替描画（WebGLの線幅制限回避用）
  outlineEmulation: 'off', // 'off' | 'topn' | 'non-topn' | 'all'（ポリラインで太線エミュレーション：TopNのみ | TopN以外のみ | すべて）
  // v0.1.6.1: インセット枠線（ADR-0004）
  outlineInset: 0, // インセット枠線のオフセット距離（メートル、0で無効）
  outlineInsetMode: 'all', // インセット枠線の適用範囲：'all'（全体） | 'topn'（TopNのみ）
  enableThickFrames: false, // 厚い枠線表示（インセット枠線とメイン枠線の間をフレームで埋める）
  
  // v0.1.7: 適応的枠線制御とエミュレーション専用表示モード（ADR-0005）
  outlineRenderMode: 'standard', // 'standard' | 'inset' | 'emulation-only' 表示モード
  adaptiveOutlines: false, // 適応的枠線制御を有効化（オプトイン）
  outlineWidthPreset: 'uniform', // 'adaptive-density' | 'topn-focus' | 'uniform' プリセット
  
  // v0.1.7: 透明度resolver
  boxOpacityResolver: null, // 関数: (ctx) => number(0-1) でボックス透明度制御
  outlineOpacityResolver: null, // 関数: (ctx) => number(0-1) で枠線透明度制御
  
  // v0.1.7: 適応的制御パラメータ
  adaptiveParams: {
    neighborhoodRadius: 50, // 近傍密度計算の半径（メートル）
    densityThreshold: 5, // 密度しきい値（エンティティ数/ボクセル）
    cameraDistanceFactor: 1.0, // カメラ距離補正係数
    overlapRiskFactor: 0.3 // 重なりリスク補正係数
  },
  
  // v0.1.9: 適応的レンダリング制限とスマート視覚化支援（ADR-0006 Phase 1）
  renderLimitStrategy: 'density', // 'density' | 'coverage' | 'hybrid' 選択戦略
  minCoverageRatio: 0.2, // hybrid戦略での層化抽出最小比率（0-1）
  coverageBinsXY: 'auto', // 層化抽出用格子分割数（'auto' | number）
  
  // 自動ボクセルサイズ決定の強化
  autoVoxelSizeMode: 'basic', // 'basic' | 'occupancy' 自動サイズ計算方式
  autoVoxelTargetFill: 0.6, // 目標占有率（0-1, occupancyモード用）
  
  // Auto Render Budget
  renderBudgetMode: 'manual', // 'manual' | 'auto' 描画上限制御
  
  // 自動視点調整
  autoView: false, // 自動視点調整有効化
  fitViewOptions: {
    paddingPercent: 0.1, // データ範囲の10%パディング
    pitch: -30, // ピッチ角度（度）
    heading: 0, // ヘディング角度（度）
    altitudeStrategy: 'auto' // 'auto' | 'manual' 高度計算戦略
  }
};

/**
 * Performance limits.
 * パフォーマンス制限値。
 */
export const PERFORMANCE_LIMITS = {
  maxEntities: 5000,
  maxVoxels: 50000,
  maxEmptyVoxelsRendered: 10000,
  minVoxelSize: 5,
  maxVoxelSize: 1000,
  warningThreshold: 30000
};

/**
 * Coordinate-related constants.
 * 座標変換定数。
 */
export const COORDINATE_CONSTANTS = {
  EARTH_RADIUS: 6378137,
  DEGREES_TO_METERS_LAT: 111000,
  DEGREES_TO_RADIANS: Math.PI / 180
};

/**
 * Error message strings.
 * エラーメッセージ。
 */
export const ERROR_MESSAGES = {
  NO_ENTITIES: '対象エンティティがありません',
  NO_VIEWER: 'CesiumJS Viewerが初期化されていません',
  INVALID_VIEWER: 'CesiumJS Viewerが無効です',
  VOXEL_LIMIT_EXCEEDED: 'ボクセル数が上限を超えています',
  MEMORY_WARNING: '推定メモリ使用量が警告値を超えています',
  WEBGL_NOT_SUPPORTED: 'WebGLがサポートされていません',
  INVALID_VOXEL_SIZE: 'ボクセルサイズが無効です'
};

/**
 * Default statistics values.
 * 統計情報のデフォルト値。
 */
export const DEFAULT_STATISTICS = {
  totalVoxels: 0,
  renderedVoxels: 0,
  nonEmptyVoxels: 0,
  emptyVoxels: 0,
  totalEntities: 0,
  minCount: 0,
  maxCount: 0,
  averageCount: 0
};

/**
 * Color-related constants.
 * 色分け関連定数。
 */
export const COLOR_CONSTANTS = {
  MIN_HUE: 240, // 青
  MAX_HUE: 0,   // 赤
  SATURATION: 0.8,
  BRIGHTNESS: 0.7,
  SATURATION_RANGE: 0.2,
  BRIGHTNESS_RANGE: 0.3
};

```

## 日本語

関連: [constantsクラス](constants)

```javascript
/**
 * Constant definitions for CesiumJS Heatbox library.
 * CesiumJS Heatbox ライブラリの定数定義。
 */

/**
 * Default option values.
 * デフォルト設定値。
 */
export const DEFAULT_OPTIONS = {
  voxelSize: 20,
  opacity: 0.8,
  emptyOpacity: 0.03,
  showOutline: true,
  showEmptyVoxels: false,
  minColor: [0, 32, 255],
  maxColor: [255, 64, 0],
  maxRenderVoxels: 50000,
  batchMode: 'auto',
  debug: false, // ログ制御（false で本番モード、true で開発モード、またはオブジェクト）
  autoVoxelSize: false, // v0.1.4: 自動ボクセルサイズ決定（既存互換性のためfalse）
  // v0.1.5: 新機能
  colorMap: 'custom', // 'custom', 'viridis', 'inferno'
  diverging: false, // 二極性データ対応
  divergingPivot: 0, // 二極性配色のピボット値
  highlightTopN: null, // トップN強調表示（null: 無効）
  highlightStyle: {
    outlineWidth: 4,
    boostOpacity: 0.2
  },
  // v0.1.6: 枠線重なり対策・柔軟化
  voxelGap: 0, // ボクセル間ギャップ（メートル）
  outlineOpacity: 1.0, // 枠線透明度（0-1）
  outlineWidthResolver: null, // 関数: (params) => number で動的太さ制御
  // 実質的な太さ表現のための代替描画（WebGLの線幅制限回避用）
  outlineEmulation: 'off', // 'off' | 'topn' | 'non-topn' | 'all'（ポリラインで太線エミュレーション：TopNのみ | TopN以外のみ | すべて）
  // v0.1.6.1: インセット枠線（ADR-0004）
  outlineInset: 0, // インセット枠線のオフセット距離（メートル、0で無効）
  outlineInsetMode: 'all', // インセット枠線の適用範囲：'all'（全体） | 'topn'（TopNのみ）
  enableThickFrames: false, // 厚い枠線表示（インセット枠線とメイン枠線の間をフレームで埋める）
  
  // v0.1.7: 適応的枠線制御とエミュレーション専用表示モード（ADR-0005）
  outlineRenderMode: 'standard', // 'standard' | 'inset' | 'emulation-only' 表示モード
  adaptiveOutlines: false, // 適応的枠線制御を有効化（オプトイン）
  outlineWidthPreset: 'uniform', // 'adaptive-density' | 'topn-focus' | 'uniform' プリセット
  
  // v0.1.7: 透明度resolver
  boxOpacityResolver: null, // 関数: (ctx) => number(0-1) でボックス透明度制御
  outlineOpacityResolver: null, // 関数: (ctx) => number(0-1) で枠線透明度制御
  
  // v0.1.7: 適応的制御パラメータ
  adaptiveParams: {
    neighborhoodRadius: 50, // 近傍密度計算の半径（メートル）
    densityThreshold: 5, // 密度しきい値（エンティティ数/ボクセル）
    cameraDistanceFactor: 1.0, // カメラ距離補正係数
    overlapRiskFactor: 0.3 // 重なりリスク補正係数
  },
  
  // v0.1.9: 適応的レンダリング制限とスマート視覚化支援（ADR-0006 Phase 1）
  renderLimitStrategy: 'density', // 'density' | 'coverage' | 'hybrid' 選択戦略
  minCoverageRatio: 0.2, // hybrid戦略での層化抽出最小比率（0-1）
  coverageBinsXY: 'auto', // 層化抽出用格子分割数（'auto' | number）
  
  // 自動ボクセルサイズ決定の強化
  autoVoxelSizeMode: 'basic', // 'basic' | 'occupancy' 自動サイズ計算方式
  autoVoxelTargetFill: 0.6, // 目標占有率（0-1, occupancyモード用）
  
  // Auto Render Budget
  renderBudgetMode: 'manual', // 'manual' | 'auto' 描画上限制御
  
  // 自動視点調整
  autoView: false, // 自動視点調整有効化
  fitViewOptions: {
    paddingPercent: 0.1, // データ範囲の10%パディング
    pitch: -30, // ピッチ角度（度）
    heading: 0, // ヘディング角度（度）
    altitudeStrategy: 'auto' // 'auto' | 'manual' 高度計算戦略
  }
};

/**
 * Performance limits.
 * パフォーマンス制限値。
 */
export const PERFORMANCE_LIMITS = {
  maxEntities: 5000,
  maxVoxels: 50000,
  maxEmptyVoxelsRendered: 10000,
  minVoxelSize: 5,
  maxVoxelSize: 1000,
  warningThreshold: 30000
};

/**
 * Coordinate-related constants.
 * 座標変換定数。
 */
export const COORDINATE_CONSTANTS = {
  EARTH_RADIUS: 6378137,
  DEGREES_TO_METERS_LAT: 111000,
  DEGREES_TO_RADIANS: Math.PI / 180
};

/**
 * Error message strings.
 * エラーメッセージ。
 */
export const ERROR_MESSAGES = {
  NO_ENTITIES: '対象エンティティがありません',
  NO_VIEWER: 'CesiumJS Viewerが初期化されていません',
  INVALID_VIEWER: 'CesiumJS Viewerが無効です',
  VOXEL_LIMIT_EXCEEDED: 'ボクセル数が上限を超えています',
  MEMORY_WARNING: '推定メモリ使用量が警告値を超えています',
  WEBGL_NOT_SUPPORTED: 'WebGLがサポートされていません',
  INVALID_VOXEL_SIZE: 'ボクセルサイズが無効です'
};

/**
 * Default statistics values.
 * 統計情報のデフォルト値。
 */
export const DEFAULT_STATISTICS = {
  totalVoxels: 0,
  renderedVoxels: 0,
  nonEmptyVoxels: 0,
  emptyVoxels: 0,
  totalEntities: 0,
  minCount: 0,
  maxCount: 0,
  averageCount: 0
};

/**
 * Color-related constants.
 * 色分け関連定数。
 */
export const COLOR_CONSTANTS = {
  MIN_HUE: 240, // 青
  MAX_HUE: 0,   // 赤
  SATURATION: 0.8,
  BRIGHTNESS: 0.7,
  SATURATION_RANGE: 0.2,
  BRIGHTNESS_RANGE: 0.3
};

```
