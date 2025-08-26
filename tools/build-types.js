#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'types');
const outFile = path.join(outDir, 'index.d.ts');

const dts = `
// Minimal type declarations for cesium-heatbox

export interface HeatboxOptions {
  voxelSize?: number;
  opacity?: number;
  emptyOpacity?: number;
  showOutline?: boolean;
  showEmptyVoxels?: boolean;
  minColor?: [number, number, number];
  maxColor?: [number, number, number];
  maxRenderVoxels?: number;
  /** @deprecated v0.1.5: ignored and scheduled for removal */
  batchMode?: 'auto' | 'primitive' | 'entity';
  // v0.1.3 追加 / v0.1.5: object form supported
  debug?: boolean | { showBounds?: boolean };
  // v0.1.2 新機能
  wireframeOnly?: boolean;
  heightBased?: boolean;
  outlineWidth?: number;
  // v0.1.4 新機能
  autoVoxelSize?: boolean;           // 自動ボクセルサイズ決定
  // v0.1.5 新機能
  colorMap?: 'custom' | 'viridis' | 'inferno';
  diverging?: boolean;
  divergingPivot?: number;
  highlightTopN?: number | null;
  highlightStyle?: { outlineWidth?: number; boostOpacity?: number };
  // v0.1.6 新機能
  voxelGap?: number; // ボクセル間ギャップ（メートル）
  outlineOpacity?: number; // 枠線透明度（0-1）
  outlineWidthResolver?: (params: { voxel: { x: number; y: number; z: number; count: number }; isTopN: boolean; normalizedDensity: number; }) => number | null;
  // v0.1.6+: Emulated thick outline for WebGL line width limits
  outlineEmulation?: 'off' | 'topn';
  // v0.1.6.1: Inset outline
  outlineInset?: number;
  outlineInsetMode?: 'all' | 'topn';
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
  // v0.1.4 自動調整情報
  autoAdjusted?: boolean;
  originalVoxelSize?: number;
  finalVoxelSize?: number;
  adjustmentReason?: string;
}

export default class Heatbox {
  constructor(viewer: any, options?: HeatboxOptions);
  setData(entities: any[]): void;
  createFromEntities(entities: any[]): Promise<HeatboxStatistics>;
  setVisible(show: boolean): void;
  clear(): void;
  destroy(): void;
  getOptions(): HeatboxOptions;
  updateOptions(newOptions: HeatboxOptions): void;
  getStatistics(): HeatboxStatistics | null;
  getBounds(): any | null;
  getDebugInfo(): any;
  static filterEntities<T = any>(entities: T[], predicate: (e: T) => boolean): T[];
}

export { Heatbox };

export function getAllEntities(viewer: any): any[];
export function generateTestEntities(viewer: any, bounds: any, count?: number): any[];
export function createHeatbox(viewer: any, options?: HeatboxOptions): Heatbox;
export function getEnvironmentInfo(): any;

export const CesiumHeatbox: typeof Heatbox;
export const VERSION: string;
export const AUTHOR: string;
export const REPOSITORY: string;
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, dts, 'utf8');
console.log(`Types written to ${outFile}`);
