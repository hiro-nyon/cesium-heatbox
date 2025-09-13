# Source: utils/profiles.js

**日本語** | [English](#english)

## English

See also: [Class: profiles](profiles)

```javascript
/**
 * Configuration profiles for different use cases
 * ユースケース別設定プロファイル
 * 
 * @version 0.1.12
 */

/**
 * Predefined configuration profiles
 * 事前定義された設定プロファイル
 */
export const PROFILES = {
  // モバイル環境向け高速描画優先
  'mobile-fast': {
    maxRenderVoxels: 5000,
    outlineRenderMode: 'emulation-only',
    adaptiveOutlines: false,
    outlineWidthPreset: 'thin',
    opacity: 0.7,
    renderLimitStrategy: 'density',
    minCoverageRatio: 0.1,
    topNHighlight: 10,
    description: 'Mobile devices - prioritizes performance over visual quality'
  },

  // デスクトップ環境向けバランス型
  'desktop-balanced': {
    maxRenderVoxels: 15000,
    outlineRenderMode: 'standard',
    adaptiveOutlines: true,
    outlineWidthPreset: 'medium', 
    opacity: 0.8,
    renderLimitStrategy: 'hybrid',
    minCoverageRatio: 0.2,
    topNHighlight: 20,
    adaptiveParams: {
      outlineWidthRange: [1, 4],
      outlineOpacityRange: [0.4, 1.0],
      boxOpacityRange: [0.2, 0.8]
    },
    description: 'Desktop environments - balanced performance and quality'
  },

  // 高密度データ向け
  'dense-data': {
    maxRenderVoxels: 25000,
    outlineRenderMode: 'inset',
    adaptiveOutlines: true,
    outlineWidthPreset: 'thin',
    opacity: 0.6,
    renderLimitStrategy: 'hybrid',
    minCoverageRatio: 0.3,
    topNHighlight: 30,
    outlineInset: 0.5,
    highlightTopN: true,
    highlightStyle: {
      boostOpacity: 0.3,
      boostOutlineWidth: 1.5
    },
    description: 'High-density datasets - optimized for cluttered environments'
  },

  // 疎データ向け
  'sparse-data': {
    maxRenderVoxels: 8000,
    outlineRenderMode: 'standard',
    adaptiveOutlines: false,
    outlineWidthPreset: 'thick',
    opacity: 0.9,
    renderLimitStrategy: 'coverage',
    minCoverageRatio: 0.8,
    topNHighlight: 50,
    emptyOpacity: 0.05,
    showEmptyVoxels: true,
    description: 'Sparse datasets - emphasizes visibility and coverage'
  }
};

/**
 * Get list of available profile names
 * 利用可能なプロファイル名の一覧を取得
 * 
 * @returns {string[]} Array of profile names / プロファイル名の配列
 */
export function getProfileNames() {
  return Object.keys(PROFILES);
}

/**
 * Get profile configuration
 * プロファイル設定を取得
 * 
 * @param {string} profileName - Profile name / プロファイル名
 * @returns {Object|null} Profile configuration or null if not found / プロファイル設定、見つからない場合はnull
 */
export function getProfile(profileName) {
  return PROFILES[profileName] || null;
}

/**
 * Apply profile to options with user options taking priority
 * ユーザーオプション優先でプロファイルをオプションに適用
 * 
 * @param {string} profileName - Profile name / プロファイル名 
 * @param {Object} userOptions - User provided options / ユーザー提供オプション
 * @returns {Object} Merged options / マージされたオプション
 */
export function applyProfile(profileName, userOptions = {}) {
  const profile = getProfile(profileName);
  if (!profile) {
    return userOptions;
  }

  // Remove description from profile before merging
  const { description: _, ...profileOptions } = profile;
  
  // Deep merge with user options taking priority
  return deepMerge(profileOptions, userOptions);
}

/**
 * Deep merge two objects with second object taking priority
 * 第二オブジェクト優先の深いマージ
 * 
 * @param {Object} target - Target object / 対象オブジェクト
 * @param {Object} source - Source object / ソースオブジェクト  
 * @returns {Object} Merged object / マージされたオブジェクト
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Validate profile name
 * プロファイル名の検証
 * 
 * @param {string} profileName - Profile name to validate / 検証するプロファイル名
 * @returns {boolean} True if valid / 有効な場合はtrue
 */
export function isValidProfile(profileName) {
  return typeof profileName === 'string' && Object.prototype.hasOwnProperty.call(PROFILES, profileName);
}

```

## 日本語

関連: [profilesクラス](profiles)

```javascript
/**
 * Configuration profiles for different use cases
 * ユースケース別設定プロファイル
 * 
 * @version 0.1.12
 */

/**
 * Predefined configuration profiles
 * 事前定義された設定プロファイル
 */
export const PROFILES = {
  // モバイル環境向け高速描画優先
  'mobile-fast': {
    maxRenderVoxels: 5000,
    outlineRenderMode: 'emulation-only',
    adaptiveOutlines: false,
    outlineWidthPreset: 'thin',
    opacity: 0.7,
    renderLimitStrategy: 'density',
    minCoverageRatio: 0.1,
    topNHighlight: 10,
    description: 'Mobile devices - prioritizes performance over visual quality'
  },

  // デスクトップ環境向けバランス型
  'desktop-balanced': {
    maxRenderVoxels: 15000,
    outlineRenderMode: 'standard',
    adaptiveOutlines: true,
    outlineWidthPreset: 'medium', 
    opacity: 0.8,
    renderLimitStrategy: 'hybrid',
    minCoverageRatio: 0.2,
    topNHighlight: 20,
    adaptiveParams: {
      outlineWidthRange: [1, 4],
      outlineOpacityRange: [0.4, 1.0],
      boxOpacityRange: [0.2, 0.8]
    },
    description: 'Desktop environments - balanced performance and quality'
  },

  // 高密度データ向け
  'dense-data': {
    maxRenderVoxels: 25000,
    outlineRenderMode: 'inset',
    adaptiveOutlines: true,
    outlineWidthPreset: 'thin',
    opacity: 0.6,
    renderLimitStrategy: 'hybrid',
    minCoverageRatio: 0.3,
    topNHighlight: 30,
    outlineInset: 0.5,
    highlightTopN: true,
    highlightStyle: {
      boostOpacity: 0.3,
      boostOutlineWidth: 1.5
    },
    description: 'High-density datasets - optimized for cluttered environments'
  },

  // 疎データ向け
  'sparse-data': {
    maxRenderVoxels: 8000,
    outlineRenderMode: 'standard',
    adaptiveOutlines: false,
    outlineWidthPreset: 'thick',
    opacity: 0.9,
    renderLimitStrategy: 'coverage',
    minCoverageRatio: 0.8,
    topNHighlight: 50,
    emptyOpacity: 0.05,
    showEmptyVoxels: true,
    description: 'Sparse datasets - emphasizes visibility and coverage'
  }
};

/**
 * Get list of available profile names
 * 利用可能なプロファイル名の一覧を取得
 * 
 * @returns {string[]} Array of profile names / プロファイル名の配列
 */
export function getProfileNames() {
  return Object.keys(PROFILES);
}

/**
 * Get profile configuration
 * プロファイル設定を取得
 * 
 * @param {string} profileName - Profile name / プロファイル名
 * @returns {Object|null} Profile configuration or null if not found / プロファイル設定、見つからない場合はnull
 */
export function getProfile(profileName) {
  return PROFILES[profileName] || null;
}

/**
 * Apply profile to options with user options taking priority
 * ユーザーオプション優先でプロファイルをオプションに適用
 * 
 * @param {string} profileName - Profile name / プロファイル名 
 * @param {Object} userOptions - User provided options / ユーザー提供オプション
 * @returns {Object} Merged options / マージされたオプション
 */
export function applyProfile(profileName, userOptions = {}) {
  const profile = getProfile(profileName);
  if (!profile) {
    return userOptions;
  }

  // Remove description from profile before merging
  const { description: _, ...profileOptions } = profile;
  
  // Deep merge with user options taking priority
  return deepMerge(profileOptions, userOptions);
}

/**
 * Deep merge two objects with second object taking priority
 * 第二オブジェクト優先の深いマージ
 * 
 * @param {Object} target - Target object / 対象オブジェクト
 * @param {Object} source - Source object / ソースオブジェクト  
 * @returns {Object} Merged object / マージされたオブジェクト
 * @private
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Validate profile name
 * プロファイル名の検証
 * 
 * @param {string} profileName - Profile name to validate / 検証するプロファイル名
 * @returns {boolean} True if valid / 有効な場合はtrue
 */
export function isValidProfile(profileName) {
  return typeof profileName === 'string' && Object.prototype.hasOwnProperty.call(PROFILES, profileName);
}

```
