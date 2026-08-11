/**
 * Build the list of voxels eligible for rendering.
 * Occupied voxels always take priority over synthetic empty voxels.
 *
 * @param {Map} voxelData - Occupied voxel data
 * @param {Object} grid - Grid dimensions
 * @param {Object} options - Renderer options
 * @param {Function} selectVoxels - Occupied voxel selection callback
 * @returns {{voxels: Array, selectionResult: Object|null}}
 */
export function buildDisplayVoxels(voxelData, grid, options, selectVoxels) {
  const occupiedVoxels = Array.from(voxelData.entries(), ([key, info]) => ({ key, info }));
  const gridVoxelCount = getGridVoxelCount(grid);
  const configuredLimit = Number.isFinite(options.maxRenderVoxels) && options.maxRenderVoxels > 0
    ? Math.floor(options.maxRenderVoxels)
    : 50000;
  const canSynthesizeEmptyVoxels = options.showEmptyVoxels && !options.spatialId?.enabled;
  const renderLimit = canSynthesizeEmptyVoxels
    ? Math.min(gridVoxelCount, configuredLimit)
    : configuredLimit;

  let voxels = occupiedVoxels;
  let selectionResult = null;

  if (voxels.length > renderLimit) {
    selectionResult = selectVoxels(voxels, renderLimit);
    voxels = selectionResult.selectedVoxels;
  }

  if (!canSynthesizeEmptyVoxels || voxels.length >= renderLimit) {
    return { voxels, selectionResult };
  }

  for (let x = 0; x < grid.numVoxelsX && voxels.length < renderLimit; x++) {
    for (let y = 0; y < grid.numVoxelsY && voxels.length < renderLimit; y++) {
      for (let z = 0; z < grid.numVoxelsZ && voxels.length < renderLimit; z++) {
        const key = `${x},${y},${z}`;
        if (!voxelData.has(key)) {
          voxels.push({ key, info: { x, y, z, count: 0 } });
        }
      }
    }
  }

  return { voxels, selectionResult };
}

function getGridVoxelCount(grid) {
  if (Number.isFinite(grid.totalVoxels) && grid.totalVoxels >= 0) {
    return grid.totalVoxels;
  }

  return Math.max(0,
    (Number(grid.numVoxelsX) || 0) *
    (Number(grid.numVoxelsY) || 0) *
    (Number(grid.numVoxelsZ) || 0)
  );
}
