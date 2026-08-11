#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'types');
const outFiles = [
  path.join(outDir, 'index.d.ts'),
  path.join(outDir, 'index.d.mts')
];
const cjsOutFile = path.join(outDir, 'index.d.cts');

const dts = `
// Type definitions for cesium-heatbox

export type HeatboxProfileName = 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data';
export type OutlineRenderMode = 'standard' | 'inset' | 'emulation-only';
export type EmulationScope = 'off' | 'topn' | 'non-topn' | 'all';
export type OutlineWidthPreset = 'thin' | 'medium' | 'thick' | 'adaptive';
export type RenderLimitStrategy = 'density' | 'coverage' | 'hybrid';
export type AutoVoxelSizeMode = 'basic' | 'occupancy';
export type RenderBudgetMode = 'manual' | 'auto';
export type PerformanceOverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ClassificationScheme = 'linear' | 'log' | 'equal-interval' | 'quantize' | 'threshold' | 'quantile' | 'jenks';

export interface HeatboxPerformanceOverlayOptions {
  enabled?: boolean;
  position?: PerformanceOverlayPosition;
  autoShow?: boolean;
  autoUpdate?: boolean;
  updateIntervalMs?: number;
  fpsAveragingWindowMs?: number;
}

export interface HeatboxClassificationColorStop {
  position: number;
  color: string;
}

export interface HeatboxClassificationOptions {
  enabled?: boolean;
  scheme?: ClassificationScheme;
  classes?: number;
  thresholds?: number[] | null;
  colorMap?: Array<string | HeatboxClassificationColorStop> | null;
  domain?: [number, number] | null;
  classificationTargets?: {
    color?: boolean;
    opacity?: boolean;
    width?: boolean;
  };
}

export interface HeatboxTemporalDataEntry {
  start: any;
  stop: any;
  data: any[];
}

export interface HeatboxTemporalOptions {
  enabled?: boolean;
  data?: HeatboxTemporalDataEntry[];
  classificationScope?: 'global' | 'per-time';
  updateInterval?: 'frame' | number;
  outOfRangeBehavior?: 'clear' | 'hold';
  overlapResolution?: 'skip' | 'prefer-earlier' | 'prefer-later';
  interpolate?: boolean;
  dataSource?: ((currentTime: any, context: any) => Promise<HeatboxTemporalDataEntry[] | HeatboxTemporalDataEntry | null> | HeatboxTemporalDataEntry[] | HeatboxTemporalDataEntry | null) | null;
  useWorker?: boolean;
}

export interface HeatboxSpatialIdOptions {
  enabled?: boolean;
  mode?: 'tile-grid';
  provider?: 'ouranos-gex';
  zoom?: number | 'auto';
  zoomControl?: 'auto' | 'manual';
  zoomTolerancePct?: number;
}

export interface HeatboxAggregationOptions {
  enabled?: boolean;
  byProperty?: string | null;
  keyResolver?: ((entity: any) => string | number | null | undefined) | null;
  showInDescription?: boolean;
  topN?: number;
}

export type HeatboxRange = [number, number] | null;

export interface HeatboxAdaptiveParams {
  neighborhoodRadius?: number;
  densityThreshold?: number;
  cameraDistanceFactor?: number;
  overlapRiskFactor?: number;
  minOutlineWidth?: number;
  maxOutlineWidth?: number;
  outlineWidthRange?: HeatboxRange;
  boxOpacityRange?: HeatboxRange;
  outlineOpacityRange?: HeatboxRange;
  adaptiveOpacityEnabled?: boolean;
  zScaleCompensation?: boolean;
  overlapDetection?: boolean;
}

export interface HeatboxResolverVoxelInfo {
  x: number;
  y: number;
  z: number;
  count: number;
}

export interface HeatboxStatistics {
  totalVoxels: number;
  renderedVoxels: number;
  nonEmptyVoxels: number;
  emptyVoxels: number;
  totalEntities: number;
  minCount: number;
  maxCount: number;
  averageCount: number;
  autoAdjusted?: boolean;
  originalVoxelSize?: number | null;
  finalVoxelSize?: number | null;
  adjustmentReason?: string | null;
  renderTimeMs?: number;
  selectionStrategy?: string;
  clippedNonEmpty?: number;
  coverageRatio?: number;
  renderBudgetTier?: string;
  autoMaxRenderVoxels?: number;
  occupancyRatio?: number | null;
  layers?: Array<{ key: string; total: number }>;
  spatialId?: {
    enabled: boolean;
    provider: string | null;
    zoom: number | null;
    zoomControl: 'auto' | 'manual' | null;
    edgeCaseMetrics?: Record<string, number> | null;
  };
  classification?: Record<string, any> | null;
}

export interface HeatboxOutlineWidthResolverParams {
  voxel: HeatboxResolverVoxelInfo;
  isTopN: boolean;
  normalizedDensity: number;
  statistics: HeatboxStatistics;
  adaptiveParams?: HeatboxAdaptiveParams | null;
}

export interface HeatboxOpacityResolverContext {
  voxel: HeatboxResolverVoxelInfo;
  isTopN: boolean;
  normalizedDensity: number;
  statistics: HeatboxStatistics;
  adaptiveParams?: HeatboxAdaptiveParams | null;
}

export interface HeatboxHighlightStyle {
  outlineWidth?: number;
  boostOpacity?: number;
  boostOutlineWidth?: number;
}

export interface HeatboxFitViewOptions {
  paddingPercent?: number;
  pitchDegrees?: number;
  headingDegrees?: number;
  altitudeStrategy?: 'auto' | 'manual';
}

export interface HeatboxOptions {
  profile?: HeatboxProfileName;
  voxelSize?: number;
  opacity?: number;
  emptyOpacity?: number;
  showOutline?: boolean;
  showEmptyVoxels?: boolean;
  minColor?: [number, number, number];
  maxColor?: [number, number, number];
  maxRenderVoxels?: number | 'auto';
  /** @deprecated v0.1.5: retained for backward compatibility */
  batchMode?: 'auto' | 'primitive' | 'entity';
  debug?: boolean | { showBounds?: boolean };
  wireframeOnly?: boolean;
  heightBased?: boolean;
  outlineWidth?: number;
  autoVoxelSize?: boolean;
  autoVoxelSizeMode?: AutoVoxelSizeMode;
  autoVoxelTargetFill?: number;
  colorMap?: 'custom' | 'viridis' | 'inferno';
  diverging?: boolean;
  divergingPivot?: number;
  highlightTopN?: number | null;
  highlightStyle?: HeatboxHighlightStyle;
  voxelGap?: number;
  outlineOpacity?: number;
  outlineRenderMode?: OutlineRenderMode;
  emulationScope?: EmulationScope;
  adaptiveOutlines?: boolean;
  outlineWidthPreset?: OutlineWidthPreset;
  outlineWidthResolver?: ((params: HeatboxOutlineWidthResolverParams) => number) | null;
  outlineOpacityResolver?: ((ctx: HeatboxOpacityResolverContext) => number) | null;
  boxOpacityResolver?: ((ctx: HeatboxOpacityResolverContext) => number) | null;
  outlineInset?: number;
  outlineInsetMode?: 'all' | 'topn' | 'none';
  enableThickFrames?: boolean;
  renderLimitStrategy?: RenderLimitStrategy;
  minCoverageRatio?: number;
  coverageBinsXY?: 'auto' | number;
  renderBudgetMode?: RenderBudgetMode;
  autoView?: boolean;
  fitViewOptions?: HeatboxFitViewOptions;
  performanceOverlay?: HeatboxPerformanceOverlayOptions | null;
  adaptiveParams?: HeatboxAdaptiveParams | null;
  classification?: HeatboxClassificationOptions | ClassificationScheme | false | null;
  temporal?: HeatboxTemporalOptions | null;
  spatialId?: HeatboxSpatialIdOptions;
  aggregation?: HeatboxAggregationOptions;
  valueProperty?: string;
  [key: string]: any;
}

export interface HeatboxBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
  minAlt: number;
  maxAlt: number;
  centerLon?: number;
  centerLat?: number;
  centerAlt?: number;
}

export interface HeatboxGridInfo {
  numVoxelsX: number;
  numVoxelsY: number;
  numVoxelsZ: number;
  voxelSizeMeters?: number;
  cellSizeX?: number;
  cellSizeY?: number;
  cellSizeZ?: number;
  totalVoxels?: number;
}

export interface HeatboxAutoVoxelSizeInfo {
  enabled: boolean;
  originalSize: number | null;
  finalSize: number | null;
  adjusted: boolean;
  reason: string | null;
  dataRange?: {
    x: number;
    y: number;
    z: number;
  } | null;
  estimatedDensity?: number | null;
}

export interface HeatboxDebugInfo {
  options: HeatboxOptions;
  bounds: HeatboxBounds | null;
  grid: HeatboxGridInfo | null;
  statistics: HeatboxStatistics | null;
  autoVoxelSizeInfo?: HeatboxAutoVoxelSizeInfo;
}

export interface HeatboxProfileDefinition extends HeatboxOptions {
  description: string;
}

export interface HeatboxEnvironmentInfo {
  version: string;
  cesiumVersion: string;
  userAgent: string;
  webglSupport: boolean;
  timestamp: string;
}

export interface HeatboxLegendOptions {
  container?: HTMLElement | null;
  documentRef?: Document | null;
}

export class Legend {
  constructor(options?: HeatboxLegendOptions);
  container: HTMLElement | null;
  render(classifier: any, classificationOptions?: HeatboxClassificationOptions): HTMLElement | null;
  update(classifier?: any, classificationOptions?: HeatboxClassificationOptions): HTMLElement | null;
  destroy(): void;
}

export default class Heatbox {
  constructor(viewer: any, options?: HeatboxOptions);

  static listProfiles(): HeatboxProfileName[];
  static getProfileDetails(profileName: HeatboxProfileName): HeatboxProfileDefinition | null;
  static filterEntities<T = any>(entities: T[], predicate: (entity: T) => boolean): T[];

  setData(entities: any[], runtimeOptions?: Record<string, any>): Promise<void>;
  updateValues(entities: any[], runtimeOptions?: Record<string, any>): Promise<void>;
  createFromEntities(entities: any[]): Promise<HeatboxStatistics | null>;
  setVisible(show: boolean): void;
  clear(): void;
  destroy(): void;
  dispose(): void;
  updateOptions(newOptions: Partial<HeatboxOptions>): void;
  getOptions(): HeatboxOptions;
  getEffectiveOptions(): HeatboxOptions;
  getStatistics(): HeatboxStatistics | null;
  getBounds(): HeatboxBounds | null;
  getDebugInfo(): HeatboxDebugInfo;
  fitView(bounds?: HeatboxBounds | null, options?: HeatboxFitViewOptions): Promise<void>;
  togglePerformanceOverlay(): boolean;
  showPerformanceOverlay(): void;
  hidePerformanceOverlay(): void;
  setPerformanceOverlayEnabled(enabled: boolean, options?: HeatboxPerformanceOverlayOptions): boolean;
  createLegend(container?: HTMLElement | null): HTMLElement | null;
  updateLegend(): void;
  destroyLegend(): void;
}

export { Heatbox };

export function getAllEntities(viewer: any): any[];
export function generateTestEntities(viewer: any, bounds: any, count?: number): any[];
export function createHeatbox(viewer: any, options?: HeatboxOptions): Heatbox;
export function getEnvironmentInfo(): HeatboxEnvironmentInfo;

export const CesiumHeatbox: typeof Heatbox;
export const VERSION: string;
export const AUTHOR: string;
export const REPOSITORY: string;
`;

fs.mkdirSync(outDir, { recursive: true });
for (const outFile of outFiles) {
  fs.writeFileSync(outFile, dts, 'utf8');
}
fs.writeFileSync(cjsOutFile, `import Heatbox from './index.mjs';\nexport = Heatbox;\n`, 'utf8');
console.log(`Types written to ${outDir}`);
