# Source: core/render/RenderPlanner.js

**日本語** | [English](#english)

## English

See also: [Class: RenderPlanner](RenderPlanner)

```javascript
import * as Cesium from 'cesium';

/**
 * Lightweight render planner for prioritization, LoD, and viewport culling.
 * 描画優先度、簡易LoD、ビューポートカリングを担当する軽量プランナー。
 */
export class RenderPlanner {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = { ...options };
  }

  updateOptions(options = {}) {
    this.options = { ...this.options, ...options };
  }

  /**
   * @param {Array<{key: string, info: Object}>} voxels
   * @param {Object} bounds
   * @param {Object} grid
   * @param {Set<string>} topNVoxels
   * @param {number} baseBudget
   * @returns {{voxels: Array, budget: number, culledCount: number}}
   */
  plan(voxels, bounds, grid, topNVoxels, baseBudget) {
    const safeBudget = Number.isFinite(baseBudget) && baseBudget > 0
      ? Math.floor(baseBudget)
      : voxels.length;

    const visibleVoxels = this._cullByViewport(voxels, bounds, grid);
    const budget = this._resolveDynamicBudget(safeBudget, bounds, grid, visibleVoxels.length);
    const prioritized = [...visibleVoxels].sort((a, b) => {
      return this._comparePriority(a, b, topNVoxels, bounds, grid);
    });

    return {
      voxels: prioritized.slice(0, budget),
      budget,
      culledCount: Math.max(0, voxels.length - visibleVoxels.length)
    };
  }

  _comparePriority(left, right, topNVoxels, bounds, grid) {
    const leftScore = this._scoreVoxel(left, topNVoxels, bounds, grid);
    const rightScore = this._scoreVoxel(right, topNVoxels, bounds, grid);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return (right.info?.count || 0) - (left.info?.count || 0);
  }

  _scoreVoxel(voxel, topNVoxels, bounds, grid) {
    const isTopN = topNVoxels.has(voxel.key);
    const count = voxel.info?.count || 0;
    const proximityBonus = this._calculateViewProximityBonus(voxel.info, bounds, grid);

    return (isTopN ? 1_000_000 : 0) + (count * 1_000) + proximityBonus;
  }

  _calculateViewProximityBonus(info, bounds, grid) {
    const camera = this.viewer?.camera;
    const cameraPosition = camera?.positionCartographic;
    if (!cameraPosition) {
      return 0;
    }

    const center = this._estimateCenter(info, bounds, grid);
    const cameraLon = this._toDegrees(cameraPosition.longitude);
    const cameraLat = this._toDegrees(cameraPosition.latitude);
    const cameraAlt = Number(cameraPosition.height) || 0;
    const lonScale = Math.cos((cameraLat * Math.PI) / 180) * 111320;
    const dx = (center.lon - cameraLon) * Math.max(1, lonScale);
    const dy = (center.lat - cameraLat) * 111320;
    const dz = center.alt - cameraAlt;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (!Number.isFinite(distance)) {
      return 0;
    }

    return Math.max(0, 100_000 - distance);
  }

  _resolveDynamicBudget(baseBudget, bounds, grid, visibleCount) {
    const camera = this.viewer?.camera;
    const cameraPosition = camera?.positionCartographic;
    const hasFrustum = Boolean(camera?.frustum && Number.isFinite(camera.frustum.fov));

    if (!cameraPosition || !hasFrustum) {
      return Math.min(baseBudget, visibleCount);
    }

    const cameraHeight = Number(cameraPosition.height);
    if (!Number.isFinite(cameraHeight) || cameraHeight <= 0) {
      return Math.min(baseBudget, visibleCount);
    }

    const referenceSize = Math.max(
      grid?.voxelSizeMeters || 1,
      grid?.cellSizeX || 1,
      grid?.cellSizeY || 1,
      grid?.cellSizeZ || 1
    );
    const rangeAlt = Math.max(1, (bounds?.maxAlt || 0) - (bounds?.minAlt || 0));
    const normalizedHeight = cameraHeight / Math.max(referenceSize * 50, rangeAlt * 2, 1);

    let ratio = 1;
    if (normalizedHeight > 80) {
      ratio = 0.45;
    } else if (normalizedHeight > 40) {
      ratio = 0.65;
    } else if (normalizedHeight > 20) {
      ratio = 0.8;
    }

    const resolved = Math.max(1, Math.floor(baseBudget * ratio));
    return Math.min(baseBudget, resolved, visibleCount);
  }

  _cullByViewport(voxels, bounds, grid) {
    const camera = this.viewer?.camera;
    const canvas = this.viewer?.scene?.canvas;
    const cameraPosition = camera?.positionCartographic;
    const direction = camera?.direction;
    const fov = camera?.frustum?.fov;

    if (!cameraPosition || !direction || !Number.isFinite(fov) || !canvas) {
      return voxels;
    }

    const cameraLon = this._toDegrees(cameraPosition.longitude);
    const cameraLat = this._toDegrees(cameraPosition.latitude);
    const cameraAlt = Number(cameraPosition.height) || 0;
    const cameraCartesian = camera.position || Cesium.Cartesian3.fromDegrees(cameraLon, cameraLat, cameraAlt);
    const aspectRatio = Number(camera?.frustum?.aspectRatio) || (canvas.clientWidth / Math.max(canvas.clientHeight || 1, 1));
    const halfFov = Math.max(0.15, fov / 2);
    const horizontalAllowance = Math.atan(Math.tan(halfFov) * Math.max(aspectRatio, 1));

    return voxels.filter(voxel => {
      const center = this._estimateCenter(voxel.info, bounds, grid);
      const voxelCartesian = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, center.alt);
      const dx = voxelCartesian.x - cameraCartesian.x;
      const dy = voxelCartesian.y - cameraCartesian.y;
      const dz = voxelCartesian.z - cameraCartesian.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (!Number.isFinite(distance) || distance === 0) {
        return true;
      }

      const toVoxel = { x: dx / distance, y: dy / distance, z: dz / distance };
      const dot = (direction.x * toVoxel.x) + (direction.y * toVoxel.y) + (direction.z * toVoxel.z);
      if (!Number.isFinite(dot) || dot <= 0) {
        return false;
      }

      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      return angle <= horizontalAllowance;
    });
  }

  _estimateCenter(info, bounds, grid) {
    if (info?.bounds && Array.isArray(info.bounds) && info.bounds.length > 0) {
      return {
        lon: info.bounds.reduce((sum, vertex) => sum + vertex.lng, 0) / info.bounds.length,
        lat: info.bounds.reduce((sum, vertex) => sum + vertex.lat, 0) / info.bounds.length,
        alt: info.bounds.reduce((sum, vertex) => sum + vertex.alt, 0) / info.bounds.length
      };
    }

    return {
      lon: bounds.minLon + ((info.x + 0.5) * (bounds.maxLon - bounds.minLon) / Math.max(grid.numVoxelsX, 1)),
      lat: bounds.minLat + ((info.y + 0.5) * (bounds.maxLat - bounds.minLat) / Math.max(grid.numVoxelsY, 1)),
      alt: bounds.minAlt + ((info.z + 0.5) * (bounds.maxAlt - bounds.minAlt) / Math.max(grid.numVoxelsZ, 1))
    };
  }

  _toDegrees(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (Math.abs(value) <= Math.PI * 2) {
      return value * (180 / Math.PI);
    }

    return value;
  }
}

```

## 日本語

関連: [RenderPlannerクラス](RenderPlanner)

```javascript
import * as Cesium from 'cesium';

/**
 * Lightweight render planner for prioritization, LoD, and viewport culling.
 * 描画優先度、簡易LoD、ビューポートカリングを担当する軽量プランナー。
 */
export class RenderPlanner {
  constructor(viewer, options = {}) {
    this.viewer = viewer;
    this.options = { ...options };
  }

  updateOptions(options = {}) {
    this.options = { ...this.options, ...options };
  }

  /**
   * @param {Array<{key: string, info: Object}>} voxels
   * @param {Object} bounds
   * @param {Object} grid
   * @param {Set<string>} topNVoxels
   * @param {number} baseBudget
   * @returns {{voxels: Array, budget: number, culledCount: number}}
   */
  plan(voxels, bounds, grid, topNVoxels, baseBudget) {
    const safeBudget = Number.isFinite(baseBudget) && baseBudget > 0
      ? Math.floor(baseBudget)
      : voxels.length;

    const visibleVoxels = this._cullByViewport(voxels, bounds, grid);
    const budget = this._resolveDynamicBudget(safeBudget, bounds, grid, visibleVoxels.length);
    const prioritized = [...visibleVoxels].sort((a, b) => {
      return this._comparePriority(a, b, topNVoxels, bounds, grid);
    });

    return {
      voxels: prioritized.slice(0, budget),
      budget,
      culledCount: Math.max(0, voxels.length - visibleVoxels.length)
    };
  }

  _comparePriority(left, right, topNVoxels, bounds, grid) {
    const leftScore = this._scoreVoxel(left, topNVoxels, bounds, grid);
    const rightScore = this._scoreVoxel(right, topNVoxels, bounds, grid);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return (right.info?.count || 0) - (left.info?.count || 0);
  }

  _scoreVoxel(voxel, topNVoxels, bounds, grid) {
    const isTopN = topNVoxels.has(voxel.key);
    const count = voxel.info?.count || 0;
    const proximityBonus = this._calculateViewProximityBonus(voxel.info, bounds, grid);

    return (isTopN ? 1_000_000 : 0) + (count * 1_000) + proximityBonus;
  }

  _calculateViewProximityBonus(info, bounds, grid) {
    const camera = this.viewer?.camera;
    const cameraPosition = camera?.positionCartographic;
    if (!cameraPosition) {
      return 0;
    }

    const center = this._estimateCenter(info, bounds, grid);
    const cameraLon = this._toDegrees(cameraPosition.longitude);
    const cameraLat = this._toDegrees(cameraPosition.latitude);
    const cameraAlt = Number(cameraPosition.height) || 0;
    const lonScale = Math.cos((cameraLat * Math.PI) / 180) * 111320;
    const dx = (center.lon - cameraLon) * Math.max(1, lonScale);
    const dy = (center.lat - cameraLat) * 111320;
    const dz = center.alt - cameraAlt;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (!Number.isFinite(distance)) {
      return 0;
    }

    return Math.max(0, 100_000 - distance);
  }

  _resolveDynamicBudget(baseBudget, bounds, grid, visibleCount) {
    const camera = this.viewer?.camera;
    const cameraPosition = camera?.positionCartographic;
    const hasFrustum = Boolean(camera?.frustum && Number.isFinite(camera.frustum.fov));

    if (!cameraPosition || !hasFrustum) {
      return Math.min(baseBudget, visibleCount);
    }

    const cameraHeight = Number(cameraPosition.height);
    if (!Number.isFinite(cameraHeight) || cameraHeight <= 0) {
      return Math.min(baseBudget, visibleCount);
    }

    const referenceSize = Math.max(
      grid?.voxelSizeMeters || 1,
      grid?.cellSizeX || 1,
      grid?.cellSizeY || 1,
      grid?.cellSizeZ || 1
    );
    const rangeAlt = Math.max(1, (bounds?.maxAlt || 0) - (bounds?.minAlt || 0));
    const normalizedHeight = cameraHeight / Math.max(referenceSize * 50, rangeAlt * 2, 1);

    let ratio = 1;
    if (normalizedHeight > 80) {
      ratio = 0.45;
    } else if (normalizedHeight > 40) {
      ratio = 0.65;
    } else if (normalizedHeight > 20) {
      ratio = 0.8;
    }

    const resolved = Math.max(1, Math.floor(baseBudget * ratio));
    return Math.min(baseBudget, resolved, visibleCount);
  }

  _cullByViewport(voxels, bounds, grid) {
    const camera = this.viewer?.camera;
    const canvas = this.viewer?.scene?.canvas;
    const cameraPosition = camera?.positionCartographic;
    const direction = camera?.direction;
    const fov = camera?.frustum?.fov;

    if (!cameraPosition || !direction || !Number.isFinite(fov) || !canvas) {
      return voxels;
    }

    const cameraLon = this._toDegrees(cameraPosition.longitude);
    const cameraLat = this._toDegrees(cameraPosition.latitude);
    const cameraAlt = Number(cameraPosition.height) || 0;
    const cameraCartesian = camera.position || Cesium.Cartesian3.fromDegrees(cameraLon, cameraLat, cameraAlt);
    const aspectRatio = Number(camera?.frustum?.aspectRatio) || (canvas.clientWidth / Math.max(canvas.clientHeight || 1, 1));
    const halfFov = Math.max(0.15, fov / 2);
    const horizontalAllowance = Math.atan(Math.tan(halfFov) * Math.max(aspectRatio, 1));

    return voxels.filter(voxel => {
      const center = this._estimateCenter(voxel.info, bounds, grid);
      const voxelCartesian = Cesium.Cartesian3.fromDegrees(center.lon, center.lat, center.alt);
      const dx = voxelCartesian.x - cameraCartesian.x;
      const dy = voxelCartesian.y - cameraCartesian.y;
      const dz = voxelCartesian.z - cameraCartesian.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (!Number.isFinite(distance) || distance === 0) {
        return true;
      }

      const toVoxel = { x: dx / distance, y: dy / distance, z: dz / distance };
      const dot = (direction.x * toVoxel.x) + (direction.y * toVoxel.y) + (direction.z * toVoxel.z);
      if (!Number.isFinite(dot) || dot <= 0) {
        return false;
      }

      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      return angle <= horizontalAllowance;
    });
  }

  _estimateCenter(info, bounds, grid) {
    if (info?.bounds && Array.isArray(info.bounds) && info.bounds.length > 0) {
      return {
        lon: info.bounds.reduce((sum, vertex) => sum + vertex.lng, 0) / info.bounds.length,
        lat: info.bounds.reduce((sum, vertex) => sum + vertex.lat, 0) / info.bounds.length,
        alt: info.bounds.reduce((sum, vertex) => sum + vertex.alt, 0) / info.bounds.length
      };
    }

    return {
      lon: bounds.minLon + ((info.x + 0.5) * (bounds.maxLon - bounds.minLon) / Math.max(grid.numVoxelsX, 1)),
      lat: bounds.minLat + ((info.y + 0.5) * (bounds.maxLat - bounds.minLat) / Math.max(grid.numVoxelsY, 1)),
      alt: bounds.minAlt + ((info.z + 0.5) * (bounds.maxAlt - bounds.minAlt) / Math.max(grid.numVoxelsZ, 1))
    };
  }

  _toDegrees(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (Math.abs(value) <= Math.PI * 2) {
      return value * (180 / Math.PI);
    }

    return value;
  }
}

```
