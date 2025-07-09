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
