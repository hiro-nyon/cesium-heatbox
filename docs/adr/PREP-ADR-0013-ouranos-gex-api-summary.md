# ouranos-gex API Summary for ADR-0013 (v0.1.17 Spatial ID Support)

## Purpose / 目的

This document summarizes the ouranos-gex API to prepare for writing ADR-0013 for v0.1.17 Spatial ID integration.

v0.1.17 空間ID対応のADR-0013作成に向けて、ouranos-gex APIをまとめます。

## ouranos-gex Library Information / ライブラリ情報

### Repository
- **GitHub**: https://github.com/ouranos-gex/ouranos-gex-lib-for-JavaScript
- **License**: MIT (Copyright: Geolonia Inc.)
- **Version**: 0.0.0 (development version)
- **Installation**: `npm install git+https://github.com/ouranos-gex/ouranos-gex-lib-for-JavaScript.git`

### Package Structure
- **main**: `dist/index.js` (CommonJS)
- **module**: `dist/index.es.js` (ESM)
- **types**: `dist/index.d.ts` (TypeScript definitions)

### Import Statement
```javascript
import { Space } from 'ouranos-gex-lib-for-javascript'
```

## Space Class API / Spaceクラス API

### Constructor / コンストラクタ

```javascript
Space(input, zoom?)
```

#### Input Formats
1. **LngLatWithAltitude**: `{ lng: number, lat: number, alt?: number }`
2. **ZFXYTile**: String format `/15/6/2844/17952`
3. **TileHash**: Hashed ZFXY `100213200122640`

#### zoom
- Default: `25`
- Range: `0` to `35`

### Key Properties / 主要プロパティ

| Property | Type | Description |
|----------|------|-------------|
| `.center` | `{lng, lat, alt}` | Center point of the space / 空間の中心点 |
| `.alt` | `number` | Floor altitude / 最低高度 |
| `.zoom` | `number` | Zoom level (resolution) / ズームレベル（分解能） |
| `.zfxy` | `{z, f, x, y}` | ZFXY tile coordinates / ZFXYタイル座標 |
| `.id`, `.tilehash` | `string` | TileHash (for internal use) / タイルハッシュ（内部利用） |
| **`.zfxyStr`** | `string` | **URL path format (PUBLIC API)** / **URLパス形式（公開API）** |

### Key Methods / 主要メソッド

#### `.vertices3d()`
**Most important for Heatbox integration**

Returns an array of 8 corner coordinates (3D bounding box) of the current space object.

現在の空間オブジェクトの3Dバウンディングボックスを作る8点の座標を配列として返す。

**Return Type**:
```typescript
Array<{lng: number, lat: number, alt: number}>  // 8 elements
```

**Use in Heatbox**:
- Calculate `voxelInfo.bounds` from these 8 vertices
- Determine box center and dimensions
- Pass to VoxelRenderer for Entity.box rendering

#### Navigation Methods

| Method | Description |
|--------|-------------|
| `.up(by?)` | Move up in altitude / 高度を上げる |
| `.down(by?)` | Move down in altitude / 高度を下げる |
| `.north(by?)` | Move north / 北に移動 |
| `.east(by?)` | Move east / 東に移動 |
| `.south(by?)` | Move south / 南に移動 |
| `.west(by?)` | Move west / 西に移動 |
| `.surroundings()` | Get all surrounding spaces / 周囲のすべての空間 |

#### Hierarchy Methods

| Method | Description |
|--------|-------------|
| `.parent(atZoom?)` | Get parent at lower zoom level / より低い解像度の親 |
| `.children()` | Get all children at higher zoom level / より高い解像度の子 |

#### Utility Methods

| Method | Description |
|--------|-------------|
| `.contains()` | Check if coordinate is within voxel / 座標がボクセル内か判定 |

### Static Methods / 静的メソッド

#### `Space.boundingSpaceForGeometry(geometry, minZoom?)`
Returns the spatial ID at minimum resolution for the given GeoJSON Geometry.

指定されたGeoJSON Geometryに対して、最小分解能（ズームレベル）での空間IDを返す。

#### `Space.spacesForGeometry(geometry, zoom)`
Returns the intersection of the Geometry and spatial IDs at the specified zoom level.

Geometryと指定のズームレベルでの空間IDの共通集合を配列として返す。

## Constraints / 制限事項

### Latitude Limits / 緯度制限
- **Min/Max**: `±85.0511287798`
- Corresponds to Web Mercator projection limits
- データがこの範囲外の場合はエラーまたはクランプ

### Zoom Level Range / ズームレベル範囲
- **Range**: `0` to `35`
- Higher zoom = finer resolution
- より高いズーム = より細かい分解能

### Longitude Handling / 経度の扱い
- **±180° equivalence**: `180` is treated as `-180` internally
- Input of `180` is allowed, but converted to `-180`
- 日付変更線の処理に注意が必要

## Integration Strategy for v0.1.17 / v0.1.17での統合戦略

### 1. Optional Dependency / オプショナル依存
```json
{
  "optionalDependencies": {
    "ouranos-gex-lib-for-javascript": "github:ouranos-gex/ouranos-gex-lib-for-JavaScript"
  }
}
```

### 2. Dynamic Import with Fallback / 動的インポートとフォールバック

```javascript
// Attempt to load ouranos-gex
let OuranosSpace = null;
try {
  const module = await import('ouranos-gex-lib-for-javascript');
  OuranosSpace = module.Space;
  Logger.info('ouranos-gex loaded successfully');
} catch (error) {
  Logger.warn('ouranos-gex not available, using built-in ZFXY adapter', error);
}
```

### 3. SpatialIdAdapter Interface / SpatialIdAdapterインターフェース

```javascript
class SpatialIdAdapter {
  constructor(options = {}) {
    this.provider = options.provider; // 'ouranos-gex' or null
    this.Space = OuranosSpace; // null if not available
  }

  /**
   * Convert lng/lat/alt to ZFXY and get 8 vertices
   */
  getVoxelBounds(lng, lat, alt, zoom) {
    if (this.Space) {
      // Use ouranos-gex
      const space = new this.Space({ lng, lat, alt }, zoom);
      return {
        zfxy: space.zfxy,
        zfxyStr: space.zfxyStr,  // PUBLIC API format
        vertices: space.vertices3d()  // 8 corner points
      };
    } else {
      // Use built-in ZFXY converter
      return this._builtInConverter(lng, lat, alt, zoom);
    }
  }

  _builtInConverter(lng, lat, alt, zoom) {
    // Implement basic ZFXY conversion
    // Calculate approximate bounds without ouranos-gex
    // ...
  }
}
```

### 4. DataProcessor Integration / DataProcessor統合

```javascript
// In DataProcessor.js
if (options.spatialId?.enabled) {
  const adapter = new SpatialIdAdapter({
    provider: options.spatialId.provider
  });

  for (const entity of entities) {
    const { zfxy, zfxyStr, vertices } = adapter.getVoxelBounds(
      entity.position.lng,
      entity.position.lat,
      entity.position.alt,
      zoom
    );

    // Use zfxyStr as aggregation key
    const key = zfxyStr;
    
    // Store bounds as 8 vertices
    voxelInfo.bounds = vertices;
    voxelInfo.spatialId = { ...zfxy, id: zfxyStr };
  }
}
```

### 5. Auto Zoom Selection / 自動ズーム選択

```javascript
if (options.spatialId.zoomControl === 'auto') {
  // Calculate optimal zoom level based on voxelSize
  // Target: XY relative error ≤ zoomTolerancePct (default 10%)
  
  const targetCellSize = options.voxelSize || 30; // meters
  let bestZoom = 25; // default
  let minError = Infinity;
  
  for (let z = 15; z <= 30; z++) {
    const cellSize = calculateCellSizeAtZoom(z, centerLat);
    const relativeError = Math.abs(cellSize - targetCellSize) / targetCellSize;
    
    if (relativeError < minError && relativeError <= options.spatialId.zoomTolerancePct / 100) {
      minError = relativeError;
      bestZoom = z;
    }
  }
  
  zoom = bestZoom;
}
```

## ID Format Convention / ID形式の規約

### Public API Format / 公開API形式

**Use `.zfxyStr`** (URL path format)

```
/25/15/29304/13104
```

- **Store in**: `properties.spatialId.id`
- **Use for**: Public documentation, examples, user-facing APIs

### Internal Use Only / 内部利用のみ

**`.tilehash`** (hashed format)

```
100213200122640
```

- **Use for**: Internal optimization, lookup tables
- **Do NOT expose** in public APIs

## Testing Considerations / テスト考慮事項

### Unit Tests

1. **With ouranos-gex available**:
   - Verify 8 vertices match `Space.vertices3d()`
   - Check zfxyStr format
   - Test navigation methods

2. **Without ouranos-gex (fallback)**:
   - Built-in converter produces reasonable bounds
   - Warning logged but no crash
   - `getStatistics()` shows `spatialIdProvider: null`

3. **Edge Cases**:
   - ±180° longitude wrap (defer to v0.1.19)
   - ±85.0511° latitude limits (defer to v0.1.19)
   - Zoom level 0-35 range validation

### Integration Tests

- Generate voxels with `spatialId.enabled=true`
- Verify rendered boxes align with expected ZFXY cells
- Check picking shows correct `properties.spatialId`

## Next Steps for ADR-0013 / ADR-0013作成の次ステップ

1. ✅ API確認完了 (This document)
2. **Write ADR-0013**:
   - Context: Why spatial ID support
   - Decision: opt-in mode, zfxyStr as public format, optional dependency
   - Consequences: built-in fallback, deferred global QA
3. **Implementation**: Follow ADR-0013 design
4. **Testing**: Unit tests + integration tests
5. **Documentation**: Update README, examples

## References / 参照

- ouranos-gex README: `node_modules/ouranos-gex-lib-for-javascript/README.md`
- IPA Guideline: https://www.ipa.go.jp/digital/architecture/project/autonomousmobilerobot/3dspatial_guideline.html
- ROADMAP v0.1.17: `ROADMAP.md` lines 239-298
- ROADMAP v0.1.19: `ROADMAP.md` lines 325-361

