/**
 * CesiumJS Heatbox - Entry point.
 * CesiumJS Heatbox - エントリーポイント。
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
export const VERSION = '0.1.12-alpha.6';
export const AUTHOR = 'hiro-nyon';
export const REPOSITORY = 'https://github.com/hiro-nyon/cesium-heatbox';

/**
 * Quick start helper function.
 * クイックスタート用のヘルパー関数。
 * @param {Object} viewer - CesiumJS Viewer / CesiumJS Viewer
 * @param {Object} options - Configuration options / 設定オプション
 * @returns {Heatbox} New Heatbox instance / 生成された Heatbox インスタンス
 */
export function createHeatbox(viewer, options) {
  return new Heatbox(viewer, options);
}

/**
 * Get environment information.
 * 環境情報を取得します。
 * @returns {Object} Environment info / 環境情報
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
