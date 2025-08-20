/**
 * バリデーション関連のユーティリティ関数
 */

import * as Cesium from 'cesium';
import { PERFORMANCE_LIMITS, ERROR_MESSAGES } from './constants.js';

/**
 * CesiumJS Viewerが有効かチェック
 * @param {Object} viewer - CesiumJS Viewer
 * @returns {boolean} 有効な場合はtrue
 */
export function isValidViewer(viewer) {
  if (!viewer) {
    return false;
  }
  
  // 必要なプロパティが存在するかチェック
  if (!viewer.scene || !viewer.entities || !viewer.scene.canvas) {
    return false;
  }
  
  // WebGL対応チェック（WebGL2 も許容）
  const canvas = viewer.scene.canvas;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return false;
  }
  
  return true;
}

/**
 * エンティティ配列が有効かチェック
 * @param {Array} entities - エンティティ配列
 * @returns {boolean} 有効な場合はtrue
 */
export function isValidEntities(entities) {
  if (!Array.isArray(entities)) {
    return false;
  }
  
  if (entities.length === 0) {
    return false;
  }
  
  if (entities.length > PERFORMANCE_LIMITS.maxEntities) {
    console.warn(`エンティティ数が推奨値(${PERFORMANCE_LIMITS.maxEntities})を超えています: ${entities.length}`);
  }
  
  return true;
}

/**
 * ボクセルサイズが有効かチェック
 * @param {number} voxelSize - ボクセルサイズ
 * @returns {boolean} 有効な場合はtrue
 */
export function isValidVoxelSize(voxelSize) {
  if (typeof voxelSize !== 'number' || isNaN(voxelSize)) {
    return false;
  }
  
  if (voxelSize < PERFORMANCE_LIMITS.minVoxelSize || voxelSize > PERFORMANCE_LIMITS.maxVoxelSize) {
    return false;
  }
  
  return true;
}

/**
 * エンティティが有効な位置情報を持つかチェック
 * @param {Object} entity - Cesium Entity
 * @returns {boolean} 有効な場合はtrue
 */
export function hasValidPosition(entity) {
  if (!entity || !entity.position) {
    return false;
  }
  
  // Propertyベースの位置情報の場合
  if (typeof entity.position.getValue === 'function') {
    const position = entity.position.getValue(Cesium.JulianDate.now());
    return position && !isNaN(position.x) && !isNaN(position.y) && !isNaN(position.z);
  }
  
  // 直接Cartesian3の場合
  if (entity.position.x !== undefined) {
    return !isNaN(entity.position.x) && !isNaN(entity.position.y) && !isNaN(entity.position.z);
  }
  
  return false;
}

/**
 * 処理するボクセル数が制限内かチェック
 * @param {number} totalVoxels - 総ボクセル数
 * @param {number} voxelSize - ボクセルサイズ
 * @returns {Object} チェック結果
 */
export function validateVoxelCount(totalVoxels, voxelSize) {
  const result = {
    valid: true,
    warning: false,
    error: null,
    recommendedSize: null
  };
  
  if (totalVoxels > PERFORMANCE_LIMITS.maxVoxels) {
    result.valid = false;
    result.error = ERROR_MESSAGES.VOXEL_LIMIT_EXCEEDED;
    result.recommendedSize = Math.ceil(voxelSize * Math.pow(totalVoxels / PERFORMANCE_LIMITS.maxVoxels, 1/3));
  } else if (totalVoxels > PERFORMANCE_LIMITS.warningThreshold) {
    result.warning = true;
    result.error = ERROR_MESSAGES.MEMORY_WARNING;
  }
  
  return result;
}

/**
 * オプションを検証して正規化
 * @param {Object} options - ユーザー指定のオプション
 * @returns {Object} 正規化されたオプション
 */
export function validateAndNormalizeOptions(options = {}) {
  const normalized = { ...options };
  
  // ボクセルサイズのバリデーション
  if (normalized.voxelSize !== undefined && !isValidVoxelSize(normalized.voxelSize)) {
    throw new Error(`${ERROR_MESSAGES.INVALID_VOXEL_SIZE}: ${normalized.voxelSize}`);
  }
  
  // 透明度のバリデーション
  if (normalized.opacity !== undefined) {
    normalized.opacity = Math.max(0, Math.min(1, normalized.opacity));
  }
  
  if (normalized.emptyOpacity !== undefined) {
    normalized.emptyOpacity = Math.max(0, Math.min(1, normalized.emptyOpacity));
  }
  
  // 色のバリデーション
  if (normalized.minColor && Array.isArray(normalized.minColor) && normalized.minColor.length === 3) {
    normalized.minColor = normalized.minColor.map(c => Math.max(0, Math.min(255, Math.floor(c))));
  }
  
  if (normalized.maxColor && Array.isArray(normalized.maxColor) && normalized.maxColor.length === 3) {
    normalized.maxColor = normalized.maxColor.map(c => Math.max(0, Math.min(255, Math.floor(c))));
  }
  
  return normalized;
}
