/**
 * Device tier detection for Auto Render Budget.
 * 端末ティア検出（Auto Render Budget用）
 */

import { Logger } from './logger.js';
import { PERFORMANCE_LIMITS } from './constants.js';

/**
 * Device tier constants
 * 端末ティア定数
 */
const DEVICE_TIER_RANGES = {
  low: { min: 8000, max: 12000 },
  mid: { min: 20000, max: 35000 },
  high: { min: 40000, max: 50000 }
};

/**
 * Device Tier Detector class for performance tier detection
 * 性能ティア検出用のデバイスティア検出器クラス
 */
export class DeviceTierDetector {
  /**
   * Detect device performance tier
   * デバイス性能ティアを検出
   * @returns {Object} { tier: string, maxRenderVoxels: number, metadata: Object }
   */
  static detect() {
    try {
      const webglInfo = DeviceTierDetector._getWebGLInfo();
      const deviceInfo = DeviceTierDetector._getDeviceInfo();
      
      // ティア判定ロジック
      let tier = 'mid'; // デフォルトは中ティア
      let detectionMethod = 'fallback';
      
      // Primary: deviceMemory利用可能時（Chrome系のみ）
      if (deviceInfo.deviceMemory !== null) {
        if (deviceInfo.deviceMemory <= 4) {
          tier = 'low';
        } else if (deviceInfo.deviceMemory <= 8) {
          tier = 'mid';
        } else {
          tier = 'high';
        }
        detectionMethod = 'deviceMemory';
      } 
      // Fallback: hardwareConcurrency + 画面解像度
      else if (deviceInfo.hardwareConcurrency !== null) {
        const baseScore = deviceInfo.hardwareConcurrency;
        const resolutionFactor = Math.min(deviceInfo.screenPixels / 2073600, 2.0); // 1920x1080 = 2073600を基準
        const adjustedScore = baseScore * resolutionFactor;
        
        if (adjustedScore <= 4) {
          tier = 'low';
        } else if (adjustedScore <= 8) {
          tier = 'mid';
        } else {
          tier = 'high';
        }
        detectionMethod = 'hardwareConcurrency+resolution';
      }
      
      // WebGL制限による追加調整
      // 純粋なフォールバック（環境情報が一切取れない）ケースではダウングレードしない
      if (
        detectionMethod !== 'fallback' &&
        webglInfo.maxTextureSize > 0 &&
        (webglInfo.maxTextureSize < 4096 || !webglInfo.webgl2)
      ) {
        tier = tier === 'high' ? 'mid' : 'low';
        detectionMethod += '+webglLimits';
      }
      
      // ティアに応じた上限値を計算
      const range = DEVICE_TIER_RANGES[tier];
      const maxRenderVoxels = Math.min(
        Math.floor((range.min + range.max) / 2),
        PERFORMANCE_LIMITS.maxVoxels
      );
      
      Logger.debug(`Device tier detected: ${tier} (${detectionMethod}), maxRenderVoxels: ${maxRenderVoxels}`);
      
      return {
        tier,
        maxRenderVoxels,
        metadata: {
          detectionMethod,
          deviceInfo,
          webglInfo,
          tierRange: range
        }
      };
      
    } catch (error) {
      Logger.warn('Device tier detection failed, using default mid tier:', error);
      return {
        tier: 'mid',
        maxRenderVoxels: Math.min(25000, PERFORMANCE_LIMITS.maxVoxels),
        metadata: {
          detectionMethod: 'error-fallback',
          deviceInfo: null,
          webglInfo: null,
          error: error.message
        }
      };
    }
  }

  /**
   * Apply auto render budget to options
   * Auto Render Budgetをオプションに適用
   * @param {Object} options - 設定オプション
   * @returns {Object} 更新された設定オプション
   */
  static applyAutoRenderBudget(options) {
    if (options.renderBudgetMode !== 'auto' && options.maxRenderVoxels !== 'auto') {
      return options; // 手動モードの場合は変更なし
    }
    
    const detection = DeviceTierDetector.detect();
    
    const updatedOptions = {
      ...options,
      maxRenderVoxels: detection.maxRenderVoxels,
      // 統計情報用
      _autoRenderBudget: {
        tier: detection.tier,
        detectionMethod: detection.metadata.detectionMethod,
        autoMaxRenderVoxels: detection.maxRenderVoxels
      }
    };
    
    Logger.info(`Auto Render Budget applied: ${detection.tier} tier, maxRenderVoxels: ${detection.maxRenderVoxels}`);
    
    return updatedOptions;
  }

  /**
   * Get WebGL capability information
   * WebGL能力情報を取得
   * @returns {Object} WebGL情報オブジェクト
   * @private
   */
  static _getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        return {
          webgl2: false,
          maxTextureSize: 0,
          maxRenderbufferSize: 0
        };
      }
      
      const info = {
        webgl2: !!canvas.getContext('webgl2'),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
      };
      
      // クリーンアップ
      canvas.remove();
      
      return info;
    } catch (error) {
      Logger.warn('WebGL info detection failed:', error);
      return {
        webgl2: false,
        maxTextureSize: 0,
        maxRenderbufferSize: 0
      };
    }
  }

  /**
   * Get device information
   * 端末情報を取得
   * @returns {Object} 端末情報オブジェクト
   * @private
   */
  static _getDeviceInfo() {
    // ここでは例外を握りつぶさず、detect() 側で捕捉して error-fallback にする
    if (typeof navigator === 'undefined') {
      throw new Error('navigator is undefined');
    }
    const dpr = (typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number') ? window.devicePixelRatio : 1;
    const width = (typeof screen !== 'undefined' && typeof screen.width === 'number') ? screen.width : 1920;
    const height = (typeof screen !== 'undefined' && typeof screen.height === 'number') ? screen.height : 1080;
    const nav = navigator;

    return {
      deviceMemory: (nav && typeof nav.deviceMemory !== 'undefined') ? nav.deviceMemory : null,
      hardwareConcurrency: (nav && typeof nav.hardwareConcurrency !== 'undefined') ? nav.hardwareConcurrency : null,
      devicePixelRatio: dpr,
      screenPixels: width * height * Math.pow(dpr, 2),
      userAgent: (nav && nav.userAgent) ? nav.userAgent : ''
    };
  }
}

// 後方互換性のためのエイリアス
export function detectDeviceTier() {
  const result = DeviceTierDetector.detect();
  return {
    tier: result.tier,
    maxRenderVoxels: result.maxRenderVoxels,
    detectionMethod: result.metadata.detectionMethod,
    deviceInfo: result.metadata.deviceInfo,
    webglInfo: result.metadata.webglInfo
  };
}

export function applyAutoRenderBudget(options) {
  return DeviceTierDetector.applyAutoRenderBudget(options);
}
