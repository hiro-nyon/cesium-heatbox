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
  wireframeOnly: false,
  heightBased: false,
  outlineWidth: 2,
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
  /**
   * @deprecated v0.1.12 — Use `outlineRenderMode` and `emulationScope` instead.
   * 'off' | 'topn' | 'non-topn' | 'all'
   */
  outlineEmulation: 'off',
  // v0.1.6.1: インセット枠線（ADR-0004）
  outlineInset: 0, // インセット枠線のオフセット距離（メートル、0で無効）
  outlineInsetMode: 'all', // インセット枠線の適用範囲：'all'（全体） | 'topn'（TopNのみ）
  enableThickFrames: false, // 厚い枠線表示（インセット枠線とメイン枠線の間をフレームで埋める）
  
  // v0.1.7: 適応的枠線制御とエミュレーション専用表示モード（ADR-0005）
  outlineRenderMode: 'standard', // 'standard' | 'inset' | 'emulation-only' 表示モード
  emulationScope: 'off', // v0.1.12: 'off' | 'topn' | 'non-topn' | 'all' - emulation scope
  adaptiveOutlines: false, // 適応的枠線制御を有効化（オプトイン）
  outlineWidthPreset: 'medium', // v0.1.12: 'thin' | 'medium' | 'thick' | 'adaptive' プリセット
  
  // v0.1.7: 透明度resolver
  boxOpacityResolver: null, // 関数: (ctx) => number(0-1) でボックス透明度制御
  outlineOpacityResolver: null, // 関数: (ctx) => number(0-1) で枠線透明度制御
  
  // v0.1.7: 適応的制御パラメータ
  // v0.1.15: Phase 0 - デフォルト値更新と新オプション追加（ADR-0011）
  adaptiveParams: {
    neighborhoodRadius: 30, // 近傍密度計算の半径（メートル）- v0.1.15: 50→30
    densityThreshold: 3, // 密度しきい値（エンティティ数/ボクセル）- v0.1.15: 5→3
    cameraDistanceFactor: 0.8, // カメラ距離補正係数 - v0.1.15: 1.0→0.8
    overlapRiskFactor: 0.4, // 重なりリスク補正係数 - v0.1.15: 0.3→0.4
    // v0.1.15: 新規追加オプション
    minOutlineWidth: 1.0, // 最小アウトライン幅の保証（ピクセル）
    maxOutlineWidth: 5.0, // 最大アウトライン幅の制限（ピクセル）
    outlineWidthRange: null, // [min, max] アウトライン幅範囲（nullで無効）
    boxOpacityRange: null, // [min, max] ボックス透明度範囲（nullで無効）
    outlineOpacityRange: null, // [min, max] アウトライン透明度範囲（nullで無効）
    adaptiveOpacityEnabled: false, // 透明度適応制御有効化（v0.1.15はno-op、v1.0.0で実装）
    zScaleCompensation: true, // Z軸スケール補正の有効化
    overlapDetection: false // 重なり検出機能（オプトイン）
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
    pitchDegrees: -30, // ピッチ角度（度）- v0.1.12: unified naming
    headingDegrees: 0, // ヘディング角度（度）- v0.1.12: unified naming
    altitudeStrategy: 'auto' // 'auto' | 'manual' 高度計算戦略
  },
  
  // v0.1.17: 空間ID対応（ADR-0013）
  spatialId: {
    enabled: false, // 空間IDモード有効化（デフォルト: 従来の一様グリッド）
    mode: 'tile-grid', // 'tile-grid' - v0.1.17では tile-grid のみサポート
    provider: 'ouranos-gex', // 'ouranos-gex' - 空間IDプロバイダー
    zoom: 25, // ズームレベル（0-35）または 'auto'
    zoomControl: 'auto', // 'auto' | 'manual' - ズーム制御モード
    zoomTolerancePct: 10 // 自動ズーム選択時の許容誤差パーセンテージ
  },
  
  // v0.1.18: レイヤ別集約（ADR-0014）
  aggregation: {
    enabled: false, // レイヤ別集約を有効化（デフォルト: 無効）
    byProperty: null, // エンティティプロパティキーをレイヤキーとして使用（例: 'buildingType'）
    keyResolver: null, // カスタム関数 (entity) => layerKey（byPropertyより優先）
    showInDescription: true, // ボクセル説明文にレイヤ内訳を表示
    topN: 10 // 統計情報で返す上位レイヤ数（デフォルト: 10）
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
  EARTH_CIRCUMFERENCE_EQUATOR: 40075016.68557849,
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
  wireframeOnly: false,
  heightBased: false,
  outlineWidth: 2,
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
  /**
   * @deprecated v0.1.12 — Use `outlineRenderMode` and `emulationScope` instead.
   * 'off' | 'topn' | 'non-topn' | 'all'
   */
  outlineEmulation: 'off',
  // v0.1.6.1: インセット枠線（ADR-0004）
  outlineInset: 0, // インセット枠線のオフセット距離（メートル、0で無効）
  outlineInsetMode: 'all', // インセット枠線の適用範囲：'all'（全体） | 'topn'（TopNのみ）
  enableThickFrames: false, // 厚い枠線表示（インセット枠線とメイン枠線の間をフレームで埋める）
  
  // v0.1.7: 適応的枠線制御とエミュレーション専用表示モード（ADR-0005）
  outlineRenderMode: 'standard', // 'standard' | 'inset' | 'emulation-only' 表示モード
  emulationScope: 'off', // v0.1.12: 'off' | 'topn' | 'non-topn' | 'all' - emulation scope
  adaptiveOutlines: false, // 適応的枠線制御を有効化（オプトイン）
  outlineWidthPreset: 'medium', // v0.1.12: 'thin' | 'medium' | 'thick' | 'adaptive' プリセット
  
  // v0.1.7: 透明度resolver
  boxOpacityResolver: null, // 関数: (ctx) => number(0-1) でボックス透明度制御
  outlineOpacityResolver: null, // 関数: (ctx) => number(0-1) で枠線透明度制御
  
  // v0.1.7: 適応的制御パラメータ
  // v0.1.15: Phase 0 - デフォルト値更新と新オプション追加（ADR-0011）
  adaptiveParams: {
    neighborhoodRadius: 30, // 近傍密度計算の半径（メートル）- v0.1.15: 50→30
    densityThreshold: 3, // 密度しきい値（エンティティ数/ボクセル）- v0.1.15: 5→3
    cameraDistanceFactor: 0.8, // カメラ距離補正係数 - v0.1.15: 1.0→0.8
    overlapRiskFactor: 0.4, // 重なりリスク補正係数 - v0.1.15: 0.3→0.4
    // v0.1.15: 新規追加オプション
    minOutlineWidth: 1.0, // 最小アウトライン幅の保証（ピクセル）
    maxOutlineWidth: 5.0, // 最大アウトライン幅の制限（ピクセル）
    outlineWidthRange: null, // [min, max] アウトライン幅範囲（nullで無効）
    boxOpacityRange: null, // [min, max] ボックス透明度範囲（nullで無効）
    outlineOpacityRange: null, // [min, max] アウトライン透明度範囲（nullで無効）
    adaptiveOpacityEnabled: false, // 透明度適応制御有効化（v0.1.15はno-op、v1.0.0で実装）
    zScaleCompensation: true, // Z軸スケール補正の有効化
    overlapDetection: false // 重なり検出機能（オプトイン）
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
    pitchDegrees: -30, // ピッチ角度（度）- v0.1.12: unified naming
    headingDegrees: 0, // ヘディング角度（度）- v0.1.12: unified naming
    altitudeStrategy: 'auto' // 'auto' | 'manual' 高度計算戦略
  },
  
  // v0.1.17: 空間ID対応（ADR-0013）
  spatialId: {
    enabled: false, // 空間IDモード有効化（デフォルト: 従来の一様グリッド）
    mode: 'tile-grid', // 'tile-grid' - v0.1.17では tile-grid のみサポート
    provider: 'ouranos-gex', // 'ouranos-gex' - 空間IDプロバイダー
    zoom: 25, // ズームレベル（0-35）または 'auto'
    zoomControl: 'auto', // 'auto' | 'manual' - ズーム制御モード
    zoomTolerancePct: 10 // 自動ズーム選択時の許容誤差パーセンテージ
  },
  
  // v0.1.18: レイヤ別集約（ADR-0014）
  aggregation: {
    enabled: false, // レイヤ別集約を有効化（デフォルト: 無効）
    byProperty: null, // エンティティプロパティキーをレイヤキーとして使用（例: 'buildingType'）
    keyResolver: null, // カスタム関数 (entity) => layerKey（byPropertyより優先）
    showInDescription: true, // ボクセル説明文にレイヤ内訳を表示
    topN: 10 // 統計情報で返す上位レイヤ数（デフォルト: 10）
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
  EARTH_CIRCUMFERENCE_EQUATOR: 40075016.68557849,
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
