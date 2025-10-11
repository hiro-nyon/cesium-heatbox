# Source: utils/deviceTierDetector.js

**日本語** | [English](#english)

## English

See also: [Class: deviceTierDetector](deviceTierDetector)

```javascript
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
// v0.1.12-alpha.6: be more conservative to avoid memory/array issues on Safari/mobile
const DEVICE_TIER_RANGES = {
  low: { min: 4000, max: 8000 },
  mid: { min: 8000, max: 15000 },
  high: { min: 15000, max: 25000 }
};

/**
 * Detect device tier and return appropriate maxRenderVoxels
 * 端末ティアを検出し、適切なmaxRenderVoxelsを返す
 * @returns {Object} { tier: string, maxRenderVoxels: number, detectionMethod: string }
 */
export function detectDeviceTier() {
  try {
    const webglInfo = getWebGLInfo();
    const deviceInfo = getDeviceInfo();
    
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
    if (webglInfo.maxTextureSize < 4096 || !webglInfo.webgl2) {
      tier = tier === 'high' ? 'mid' : 'low';
      detectionMethod += '+webglLimits';
    }
    
    // ティアに応じた上限値を計算
    const range = DEVICE_TIER_RANGES[tier];
    let maxRenderVoxels = Math.min(
      Math.floor((range.min + range.max) / 2),
      PERFORMANCE_LIMITS.maxVoxels
    );

    // Additional cap for mobile/Safari-like environments
    try {
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
      const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
      if (isMobile || isSafari) {
        maxRenderVoxels = Math.min(maxRenderVoxels, 12000);
      }
    } catch (_) {
      // Ignore UA parsing errors - fallback to computed values
    }
    
    Logger.debug(`Device tier detected: ${tier} (${detectionMethod}), maxRenderVoxels: ${maxRenderVoxels}`);
    
    return {
      tier,
      maxRenderVoxels,
      detectionMethod,
      deviceInfo,
      webglInfo
    };
    
  } catch (error) {
    Logger.warn('Device tier detection failed, using default mid tier:', error);
    return {
      tier: 'mid',
      maxRenderVoxels: Math.min(25000, PERFORMANCE_LIMITS.maxVoxels),
      detectionMethod: 'error-fallback',
      deviceInfo: null,
      webglInfo: null
    };
  }
}

/**
 * Get WebGL capability information
 * WebGL能力情報を取得
 * @returns {Object} WebGL情報オブジェクト
 */
function getWebGLInfo() {
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
 */
function getDeviceInfo() {
  try {
    const info = {
      deviceMemory: navigator.deviceMemory || null, // Chrome系のみ
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenPixels: screen.width * screen.height * Math.pow(window.devicePixelRatio || 1, 2),
      userAgent: navigator.userAgent
    };
    
    return info;
  } catch (error) {
    Logger.warn('Device info detection failed:', error);
    return {
      deviceMemory: null,
      hardwareConcurrency: null,
      devicePixelRatio: 1,
      screenPixels: 2073600, // 1920x1080 fallback
      userAgent: ''
    };
  }
}

/**
 * Apply auto render budget to options
 * Auto Render Budgetをオプションに適用
 * @param {Object} options - 設定オプション
 * @returns {Object} 更新された設定オプション
 */
export function applyAutoRenderBudget(options) {
  if (options.renderBudgetMode !== 'auto' && options.maxRenderVoxels !== 'auto') {
    return options; // 手動モードの場合は変更なし
  }
  
  const detection = detectDeviceTier();
  
  const updatedOptions = {
    ...options,
    maxRenderVoxels: detection.maxRenderVoxels,
    // 統計情報用
    _autoRenderBudget: {
      tier: detection.tier,
      detectionMethod: detection.detectionMethod,
      autoMaxRenderVoxels: detection.maxRenderVoxels
    }
  };
  
  Logger.info(`Auto Render Budget applied: ${detection.tier} tier, maxRenderVoxels: ${detection.maxRenderVoxels}`);
  
  return updatedOptions;
}

```

## 日本語

関連: [deviceTierDetectorクラス](deviceTierDetector)

```javascript
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
// v0.1.12-alpha.6: be more conservative to avoid memory/array issues on Safari/mobile
const DEVICE_TIER_RANGES = {
  low: { min: 4000, max: 8000 },
  mid: { min: 8000, max: 15000 },
  high: { min: 15000, max: 25000 }
};

/**
 * Detect device tier and return appropriate maxRenderVoxels
 * 端末ティアを検出し、適切なmaxRenderVoxelsを返す
 * @returns {Object} { tier: string, maxRenderVoxels: number, detectionMethod: string }
 */
export function detectDeviceTier() {
  try {
    const webglInfo = getWebGLInfo();
    const deviceInfo = getDeviceInfo();
    
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
    if (webglInfo.maxTextureSize < 4096 || !webglInfo.webgl2) {
      tier = tier === 'high' ? 'mid' : 'low';
      detectionMethod += '+webglLimits';
    }
    
    // ティアに応じた上限値を計算
    const range = DEVICE_TIER_RANGES[tier];
    let maxRenderVoxels = Math.min(
      Math.floor((range.min + range.max) / 2),
      PERFORMANCE_LIMITS.maxVoxels
    );

    // Additional cap for mobile/Safari-like environments
    try {
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
      const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
      if (isMobile || isSafari) {
        maxRenderVoxels = Math.min(maxRenderVoxels, 12000);
      }
    } catch (_) {
      // Ignore UA parsing errors - fallback to computed values
    }
    
    Logger.debug(`Device tier detected: ${tier} (${detectionMethod}), maxRenderVoxels: ${maxRenderVoxels}`);
    
    return {
      tier,
      maxRenderVoxels,
      detectionMethod,
      deviceInfo,
      webglInfo
    };
    
  } catch (error) {
    Logger.warn('Device tier detection failed, using default mid tier:', error);
    return {
      tier: 'mid',
      maxRenderVoxels: Math.min(25000, PERFORMANCE_LIMITS.maxVoxels),
      detectionMethod: 'error-fallback',
      deviceInfo: null,
      webglInfo: null
    };
  }
}

/**
 * Get WebGL capability information
 * WebGL能力情報を取得
 * @returns {Object} WebGL情報オブジェクト
 */
function getWebGLInfo() {
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
 */
function getDeviceInfo() {
  try {
    const info = {
      deviceMemory: navigator.deviceMemory || null, // Chrome系のみ
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenPixels: screen.width * screen.height * Math.pow(window.devicePixelRatio || 1, 2),
      userAgent: navigator.userAgent
    };
    
    return info;
  } catch (error) {
    Logger.warn('Device info detection failed:', error);
    return {
      deviceMemory: null,
      hardwareConcurrency: null,
      devicePixelRatio: 1,
      screenPixels: 2073600, // 1920x1080 fallback
      userAgent: ''
    };
  }
}

/**
 * Apply auto render budget to options
 * Auto Render Budgetをオプションに適用
 * @param {Object} options - 設定オプション
 * @returns {Object} 更新された設定オプション
 */
export function applyAutoRenderBudget(options) {
  if (options.renderBudgetMode !== 'auto' && options.maxRenderVoxels !== 'auto') {
    return options; // 手動モードの場合は変更なし
  }
  
  const detection = detectDeviceTier();
  
  const updatedOptions = {
    ...options,
    maxRenderVoxels: detection.maxRenderVoxels,
    // 統計情報用
    _autoRenderBudget: {
      tier: detection.tier,
      detectionMethod: detection.detectionMethod,
      autoMaxRenderVoxels: detection.maxRenderVoxels
    }
  };
  
  Logger.info(`Auto Render Budget applied: ${detection.tier} tier, maxRenderVoxels: ${detection.maxRenderVoxels}`);
  
  return updatedOptions;
}

```
