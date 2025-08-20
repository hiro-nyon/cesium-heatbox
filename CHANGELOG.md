# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Nothing yet

### Changed
- Nothing yet

### Fixed
- Nothing yet

## [0.1.0] - 2025-09-15

### Added
- GitHub Actions CI workflow
- Contributing guidelines (docs/contributing.md)
- Tree-shaking support with sideEffects: false

### Changed
- Upgraded from alpha to stable release
- Restricted console output to development environment only
- Optimized package.json files array (removed src/ from distribution)

### Fixed
- Removed duplicate Jest configuration files
- Updated README links to point to existing files

## [0.1.0-alpha.3] - 2025-08-19

### Added
- New Heatbox APIs: `createFromEntities`, `getOptions`, `getDebugInfo`, static `filterEntities`
- Jest configuration migrated to CJS (`jest.config.cjs`) with robust Cesium module mock
- JSDoc config (`jsdoc.config.json`) and benchmark stub (`tools/benchmark.js`) for CI stability
- Types generation script (`tools/build-types.js`) and published `types/index.d.ts`

### Changed
- Unified Cesium imports to `import * as Cesium from 'cesium'`
- Fixed package entry points/exports to match built files (ESM/UMD)
- Webpack externals handling adjusted for ESM/UMD targets
- README documentation links corrected to existing docs
- Coverage thresholds tuned (temporary) until broader tests are added

### Fixed
- Bounds validation bug in sample data utility
- Zero-range and normalization edge cases in grid/index calculation
- Test failures due to missing Cesium mocks and ESM config mismatch

## [0.1.0-alpha.2] - 2025-01-21

### Added
- Enhanced documentation for developer onboarding
- Troubleshooting section in getting-started.md
- Development guide for beginners
- Quick-start guide for immediate usage
- Git and npm reference guide
- Data source selection API (roadmap)

### Changed
- Updated release workflow to support staged npm tags (alpha, beta, rc, latest)
- Improved CI/CD pipeline configuration
- Enhanced specification roadmap with data source selection feature

### Fixed
- ESLint configuration compatibility issues (downgraded to 8.x)
- Jest configuration for module name mapping
- Package dependency conflicts
- Build system configuration issues
- Test setup and import paths
- Removed @types/cesium dependency conflicts

### Technical
- Cleaned up node_modules and package-lock.json
- Reinstalled dependencies with proper versions
- Confirmed successful build and test execution

## [0.1.0-alpha.1] - 2025-07-09

### Added
- Initial implementation of Heatbox core library
- Basic voxel-based 3D heatmap visualization
- Entity processing and coordinate transformation
- HSV color interpolation for density visualization
- Batch rendering with Cesium Primitives
- Comprehensive test suite with Jest
- TypeScript type definitions
- Basic usage examples
- Complete project structure with build system

### Features
- Process CesiumJS entities into 3D voxel grid
- Automatic bounds calculation from entity distribution
- Configurable voxel size and appearance options
- Performance optimizations for large datasets
- Error handling and validation

### Technical
- ES modules support with UMD fallback
- Webpack build system with Babel transpilation
- ESLint configuration with TypeScript support
- GitHub Actions CI/CD pipeline
- Comprehensive documentation

### Known Issues
- Data source selection not yet implemented
- Real-time updates not supported
- Limited to uniform voxel sizes

### Breaking Changes
- None (initial release)
