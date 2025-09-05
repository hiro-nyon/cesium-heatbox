/**
 * CesiumJS Heatbox - Main library entry point with comprehensive API exports.
 * CesiumJS Heatbox - 包括的API エクスポートを備えたメインライブラリエントリーポイント。
 * 
 * This module serves as the primary entry point for the CesiumJS Heatbox library,
 * providing all essential classes, utilities, and helper functions needed for 
 * 3D voxel-based heatmap visualization. Includes both default and named exports
 * for maximum compatibility with different import styles.
 * 
 * このモジュールは CesiumJS Heatbox ライブラリの主要エントリーポイントとして機能し、
 * 3D ボクセルベースのヒートマップ可視化に必要なすべての重要なクラス、ユーティリティ、
 * ヘルパー関数を提供します。異なるインポートスタイルとの最大互換性のため、
 * デフォルトエクスポートと名前付きエクスポートの両方を含みます。
 * 
 * @fileoverview Main entry point for CesiumJS Heatbox library
 * @author cesium-heatbox team
 * @version 0.1.10-alpha.1
 * @since 0.1.0
 */

import { Heatbox } from './Heatbox.js';
import { Logger } from './utils/logger.js';
import { getAllEntities, generateTestEntities } from './utils/sampleData.js';

// デフォルトエクスポート
export default Heatbox;

// 名前付きエクスポート
export { Heatbox };
export { getAllEntities, generateTestEntities };

// 互換性のための追加エクスポート
export { Heatbox as CesiumHeatbox };

/**
 * Library metadata.
 * ライブラリのメタ情報。
 */
export const VERSION = '0.1.9';
export const AUTHOR = 'hiro-nyon';
export const REPOSITORY = 'https://github.com/hiro-nyon/cesium-heatbox';

/**
 * Convenient factory function for quick Heatbox instance creation.
 * 迅速なHeatboxインスタンス作成のための便利なファクトリー関数。
 * 
 * This helper function provides a streamlined way to create Heatbox instances
 * without needing to import the class directly. Ideal for quick prototyping
 * and simple use cases where minimal setup is desired.
 * 
 * このヘルパー関数は、クラスを直接インポートすることなく、Heatboxインスタンスを
 * 作成する合理化された方法を提供します。迅速なプロトタイピングと最小限の
 * セットアップが望まれるシンプルな使用例に理想的です。
 * 
 * @param {Cesium.Viewer} viewer - Initialized CesiumJS Viewer instance / 初期化されたCesiumJSビューアーインスタンス
 * @param {Object} [options={}] - Heatbox configuration options / Heatbox設定オプション
 * @returns {Heatbox} Fully configured Heatbox instance ready for use / 使用準備完了の完全設定済みHeatboxインスタンス
 * 
 * @example
 * // Quick setup with default options / デフォルトオプションでのクイックセットアップ
 * import { createHeatbox } from 'cesium-heatbox';
 * const heatbox = createHeatbox(viewer);
 * 
 * @example
 * // With custom configuration / カスタム設定付き
 * const heatbox = createHeatbox(viewer, {
 *   voxelSize: 50,
 *   opacity: 0.8,
 *   colorMap: 'viridis'
 * });
 * 
 * @since v0.1.0
 */
export function createHeatbox(viewer, options) {
  return new Heatbox(viewer, options);
}

/**
 * Comprehensive environment detection and capability assessment.
 * 包括的な環境検出と機能評価。
 * 
 * This diagnostic function analyzes the current runtime environment to provide
 * detailed information about browser capabilities, CesiumJS version, WebGL support,
 * and other relevant technical details. Essential for troubleshooting and
 * ensuring optimal performance configuration.
 * 
 * この診断関数は現在の実行環境を分析して、ブラウザー機能、CesiumJSバージョン、
 * WebGLサポート、その他の関連技術詳細に関する詳細情報を提供します。
 * トラブルシューティングと最適なパフォーマンス構成の確保に不可欠です。
 * 
 * @returns {Object} Comprehensive environment information / 包括的な環境情報
 * @returns {string} returns.version - Current library version / 現在のライブラリバージョン
 * @returns {string} returns.cesiumVersion - CesiumJS version if available / 利用可能な場合のCesiumJSバージョン
 * @returns {string} returns.userAgent - Browser user agent string / ブラウザーユーザーエージェント文字列
 * @returns {boolean} returns.webglSupport - Whether WebGL is supported / WebGLサポートの可否
 * @returns {string} returns.timestamp - ISO timestamp of assessment / 評価のISOタイムスタンプ
 * 
 * @example
 * // Environment diagnostics / 環境診断
 * import { getEnvironmentInfo } from 'cesium-heatbox';
 * const env = getEnvironmentInfo();
 * console.log(`Running Heatbox v${env.version} with Cesium ${env.cesiumVersion}`);
 * 
 * @example
 * // Check WebGL support before initialization / 初期化前のWebGLサポート確認
 * const env = getEnvironmentInfo();
 * if (!env.webglSupport) {
 *   console.error('WebGL not supported - heatmap visualization unavailable');
 * }
 * 
 * @since v0.1.0
 */
export function getEnvironmentInfo() {
  // WebGL サポートの確認
  let webglSupport = false;
  try {
    if (typeof WebGLRenderingContext !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      webglSupport = !!gl;
    }
  } catch (_e) {
    webglSupport = false;
  }
  
  return {
    version: VERSION,
    cesiumVersion: typeof Cesium !== 'undefined' ? Cesium.VERSION : 'N/A',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    webglSupport: webglSupport,
    timestamp: new Date().toISOString()
  };
}

// ライブラリの初期化ログ
Logger.info(`CesiumJS Heatbox v${VERSION} loaded`);
