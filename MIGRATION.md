# CesiumJS Heatbox - Migration Guide

This document provides migration instructions between different versions of CesiumJS Heatbox.

## Contents

- [English](#english)
- [日本語](#日本語)

---

## English

### Migration Overview

This guide explains how to migrate from v0.1.11 to v0.1.12+. The focus is on API consistency improvements, deprecation of legacy resolver systems, enhanced observability features, and fitView stabilization.

Important note (v0.1.13):
- While resolver-based opacity options (`boxOpacityResolver`, `outlineOpacityResolver`) remain deprecated, they are KEPT for compatibility until AdaptiveController provides fully functional opacity ranges (`adaptiveParams.boxOpacityRange`/`outlineOpacityRange`) shipped in a stable release. Do not remove them from apps until that implementation lands; warnings are expected.

### Breaking Changes

#### 1. Option Naming Unification

**Angle specification in fitViewOptions**

```javascript
// v0.1.11 (deprecated, will be removed in v1.0.0)
{
  fitViewOptions: {
    pitch: -30,
    heading: 90
  }
}

// v0.1.12 (recommended)
{
  fitViewOptions: {
    pitchDegrees: -30,
    headingDegrees: 90
  }
}
```

#### 2. Resolver System Deprecation

**From dynamic control to adaptive control system**

```javascript
// v0.1.11 (deprecated, will be removed in v1.0.0)
{
  outlineWidthResolver: (params) => {
    return params.isTopN ? 3 : 1;
  },
  outlineOpacityResolver: (ctx) => {
    return ctx.isTopN ? 1.0 : 0.6;
  },
  boxOpacityResolver: (ctx) => {
    return ctx.adaptiveParams.boxOpacity || 0.8;
  }
}

// v0.1.12 (recommended)
{
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive', // 'thin' | 'medium' | 'thick' | 'adaptive'
  adaptiveParams: {
    outlineWidthRange: [1, 4],
    outlineOpacityRange: [0.4, 1.0],
    boxOpacityRange: [0.2, 0.8]
  }
}
```

#### 3. Rendering Mode Unification

**From outlineEmulation to outlineRenderMode + emulationScope**

```javascript
// v0.1.11 (deprecated)
{
  outlineEmulation: true  // or 'topn', 'non-topn', 'all'
}

// v0.1.12 (recommended)
{
  outlineRenderMode: 'emulation-only', // 'standard' | 'inset' | 'emulation-only'
  emulationScope: 'all'                // 'off' | 'topn' | 'non-topn' | 'all'
}
```

#### 4. Preset Name Unification

```javascript
// v0.1.11 (deprecated)
{
  outlineWidthPreset: 'uniform'         // -> 'medium'
  // outlineWidthPreset: 'adaptive-density' -> 'adaptive'  
  // outlineWidthPreset: 'topn-focus'       -> 'thick'
}

// v0.1.12 (recommended)
{
  outlineWidthPreset: 'medium'  // 'thin' | 'medium' | 'thick' | 'adaptive'
}
```

### New Features

#### 1. Configuration Profiles

```javascript
// Using predefined profiles
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast'  // 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data'
});

// List available profiles
const profiles = Heatbox.listProfiles();
console.log(profiles); // ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data']

// Get profile details
const details = Heatbox.getProfileDetails('mobile-fast');
console.log(details.description); // "Mobile devices - prioritizes performance over visual quality"
```

#### 2. Performance Overlay

```javascript
// Enable overlay on instance creation
const heatbox = new Heatbox(viewer, {
  performanceOverlay: {
    enabled: true,
    position: 'top-right',
    autoShow: true,
    updateIntervalMs: 500
  }
});

// Runtime control
heatbox.setPerformanceOverlayEnabled(true, { position: 'bottom-left' });
heatbox.togglePerformanceOverlay();
heatbox.showPerformanceOverlay();
heatbox.hidePerformanceOverlay();
```

#### 3. Enhanced API

```javascript
// Check effective configuration (for debugging)
const effectiveOptions = heatbox.getEffectiveOptions();
console.log(effectiveOptions);

// Get statistics with render time
const stats = heatbox.getStatistics();
console.log(stats.renderTimeMs);  // newly added
```

### Quick Migration Steps

1. **Replace deprecated option names**:
   - `fitViewOptions.pitch` → `fitViewOptions.pitchDegrees`
   - `fitViewOptions.heading` → `fitViewOptions.headingDegrees`

2. **Remove resolver options and use adaptive control**:
   - Remove `outlineWidthResolver`, `outlineOpacityResolver`, `boxOpacityResolver`
   - Enable `adaptiveOutlines: true` and configure `adaptiveParams`

3. **Update rendering mode configuration**:
   - Replace `outlineEmulation` with `outlineRenderMode` + `emulationScope`
   - See mapping table below for specific combinations

4. **Update preset names**:
   - `'uniform'` → `'medium'`
   - `'adaptive-density'` → `'adaptive'`
   - `'topn-focus'` → `'thick'`

5. **Optional enhancements**:
   - Consider using a `profile` for environment-specific optimization
   - Enable `performanceOverlay` for diagnostics

### Migration Mapping Reference

| v0.1.11 | v0.1.12 | Notes |
|---------|---------|-------|
| `outlineEmulation: false` | `outlineRenderMode: 'standard'`, `emulationScope: 'off'` | Standard rendering |
| `outlineEmulation: true` | `outlineRenderMode: 'emulation-only'`, `emulationScope: 'all'` | Full emulation |
| `outlineEmulation: 'topn'` | `outlineRenderMode: 'standard'`, `emulationScope: 'topn'` | TopN only |
| `outlineEmulation: 'non-topn'` | `outlineRenderMode: 'standard'`, `emulationScope: 'non-topn'` | Non-TopN only |
| `outlineWidthPreset: 'uniform'` | `outlineWidthPreset: 'medium'` | Name unification |
| `outlineWidthPreset: 'adaptive-density'` | `outlineWidthPreset: 'adaptive'` | Name unification |
| `outlineWidthPreset: 'topn-focus'` | `outlineWidthPreset: 'thick'` | Name unification |

### Complete Migration Example

```javascript
// v0.1.11 configuration
const oldConfig = {
  fitViewOptions: {
    pitch: -30,
    heading: 0
  },
  outlineEmulation: 'topn',
  outlineWidthPreset: 'uniform',
  outlineWidthResolver: (params) => {
    return params.isTopN ? 4 : 2;
  },
  outlineOpacityResolver: (ctx) => {
    return ctx.isTopN ? 1.0 : 0.6;
  }
};

// v0.1.12 migrated configuration
const newConfig = {
  profile: 'desktop-balanced',  // Consider using a profile
  fitViewOptions: {
    pitchDegrees: -30,
    headingDegrees: 0
  },
  outlineRenderMode: 'standard',
  emulationScope: 'topn',
  outlineWidthPreset: 'medium',
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [2, 4],
    outlineOpacityRange: [0.6, 1.0]
  },
  performanceOverlay: {
    enabled: true,
    position: 'top-right'
  }
};
```

---

### Common Migration Patterns (English)

#### Pattern 1: Resolver → Adaptive Control

```javascript
// Typical migration from resolvers to adaptive system
function migrateResolver(resolverOptions) {
  const { outlineWidthResolver, outlineOpacityResolver } = resolverOptions;

  // Heuristic: treat density-based width as adaptive
  const isAdaptive = outlineWidthResolver && outlineWidthResolver.toString().includes('normalizedDensity');

  return {
    adaptiveOutlines: true,
    outlineWidthPreset: isAdaptive ? 'adaptive' : 'medium',
    adaptiveParams: {
      outlineWidthRange: [1, 4],
      outlineOpacityRange: [0.4, 1.0]
    }
  };
}
```

#### Pattern 2: Conditional Emulation

```javascript
// Conditional emulation migration
function migrateConditionalEmulation(oldOptions) {
  const { outlineEmulation, highlightTopN } = oldOptions;

  if (outlineEmulation === 'topn' && highlightTopN) {
    return {
      outlineRenderMode: 'standard',
      emulationScope: 'topn',
      highlightTopN: true
    };
  }

  return {
    outlineRenderMode: outlineEmulation ? 'emulation-only' : 'standard',
    emulationScope: outlineEmulation === true ? 'all' : 'off'
  };
}
```

### Troubleshooting (English)

#### Q: I see deprecation warnings
**A**: You are using deprecated options. Replace them with the suggested ones in the warning.

```javascript
// Example warning
[Heatbox][DEPRECATION][v1.0.0] outlineEmulation is deprecated; use outlineRenderMode and emulationScope instead.

// Fix: use outlineRenderMode + emulationScope
{
  outlineRenderMode: 'standard',
  emulationScope: 'topn'
}
```

#### Q: My resolver function no longer works
**A**: Resolver-based options are deprecated. Use the adaptive control system instead.

```javascript
// Not supported in v0.1.12 (ignored)
outlineWidthResolver: (params) => params.isTopN ? 3 : 1

// Use adaptive control
{
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: { outlineWidthRange: [1, 3] }
}
```

#### Q: Visual output looks different
**A**: Preset renames and default tuning can change visuals.

```javascript
// Inspect defaults
const effectiveOptions = heatbox.getEffectiveOptions();
console.log('Effective preset:', effectiveOptions.outlineWidthPreset);

// Set explicitly
{
  outlineWidthPreset: 'medium',
  adaptiveOutlines: false
}
```

#### Q: Performance regressed
**A**: Use a profile or enable the performance overlay to tune.

```javascript
// Prefer performance-focused profile
{ profile: 'mobile-fast' }

// Or enable performance overlay
{
  performanceOverlay: { enabled: true, position: 'top-right' }
}
```

---

## 日本語

### 移行概要

このガイドは、CesiumJS Heatboxの異なるバージョン間での移行手順を説明します。v0.1.11からv0.1.12への移行では、APIの一貫性向上、レガシーResolver系の廃止、観測可能性機能の強化、fitViewの安定化が主な変更点です。

### 目次

- [破壊的変更](#破壊的変更)
- [新機能](#新機能)
- [詳細な移行手順](#詳細な移行手順)
- [コード例](#コード例)
- [一般的な移行パターン](#一般的な移行パターン)
- [トラブルシューティング](#トラブルシューティング)

### 破壊的変更

#### 1. オプション命名の統一

**fitViewOptions内の角度指定**

v0.1.12では、角度を表すオプション名を統一しました。

```javascript
// v0.1.11 (廃止予定、v1.0.0で削除)
{
  fitViewOptions: {
    pitch: -30,
    heading: 90
  }
}

// v0.1.12 (推奨)
{
  fitViewOptions: {
    pitchDegrees: -30,
    headingDegrees: 90
  }
}
```

#### 2. Resolver系オプションの廃止

動的制御Resolverシステムから、より予測可能な適応制御システムに移行しました。

```javascript
// v0.1.11 (廃止予定、v1.0.0で削除)
{
  outlineWidthResolver: (params) => {
    return params.isTopN ? 3 : 1;
  },
  outlineOpacityResolver: (ctx) => {
    return ctx.isTopN ? 1.0 : 0.6;
  },
  boxOpacityResolver: (ctx) => {
    return ctx.adaptiveParams.boxOpacity || 0.8;
  }
}

// v0.1.12 (推奨)
{
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    outlineWidthRange: [1, 4],
    outlineOpacityRange: [0.4, 1.0],
    boxOpacityRange: [0.2, 0.8]
  }
}
```

#### 3. レンダリングモードの統一

`outlineEmulation`から`outlineRenderMode`と`emulationScope`の組み合わせに変更されました。

```javascript
// v0.1.11 (廃止予定、v1.0.0で削除)
{
  outlineEmulation: true        // または 'topn', 'non-topn', 'all'
}

// v0.1.12 (推奨)  
{
  outlineRenderMode: 'emulation-only', // 'standard' | 'inset' | 'emulation-only'
  emulationScope: 'all'                // 'off' | 'topn' | 'non-topn' | 'all'
}
```

#### 4. プリセット名の統一

プリセット名をより直感的な名前に変更しました。

```javascript
// v0.1.11 (廃止予定、v1.0.0で削除)
{
  outlineWidthPreset: 'uniform'         // -> 'medium'
  // outlineWidthPreset: 'adaptive-density' -> 'adaptive'
  // outlineWidthPreset: 'topn-focus'       -> 'thick'
}

// v0.1.12 (推奨)
{
  outlineWidthPreset: 'medium'  // 'thin' | 'medium' | 'thick' | 'adaptive'
}
```

### 新機能

#### 1. 設定プロファイル機能

環境やデータ特性に応じた最適化設定を簡単に適用できます。

```javascript
// 事前定義プロファイルの使用
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast'  // 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data'
});

// 利用可能プロファイルの確認
const profiles = Heatbox.listProfiles();
console.log(profiles);

// プロファイル詳細の取得
const details = Heatbox.getProfileDetails('mobile-fast');
console.log(details.description);
```

#### 2. パフォーマンスオーバーレイ

リアルタイムの性能監視機能が追加されました。

```javascript
// オーバーレイ有効でインスタンス作成
const heatbox = new Heatbox(viewer, {
  performanceOverlay: {
    enabled: true,
    position: 'top-right',
    autoShow: true,
    updateIntervalMs: 500
  }
});

// 実行時での制御
heatbox.setPerformanceOverlayEnabled(true, { position: 'bottom-left' });
heatbox.togglePerformanceOverlay();
```

#### 3. API機能強化

デバッグ支援機能が強化されました。

```javascript
// 有効な設定の確認（デバッグ用）
const effectiveOptions = heatbox.getEffectiveOptions();
console.log(effectiveOptions);

// 統計情報の取得（レンダリング時間追加）
const stats = heatbox.getStatistics();
console.log(stats.renderTimeMs);  // 新規追加
```

#### 4. fitViewの安定化

v0.1.12では、`fitView`の実行が描画とカメラ移動の競合を避けるように改善されました。内部的に`viewer.scene.postRender`を使用した安定した実装に変更されていますが、アプリケーション側の使用方法は変更ありません。

### 詳細な移行手順

#### Step 1: 廃止予定警告の確認

v0.1.12では、古いオプション使用時にコンソールに警告が表示されます。

```
[Heatbox][DEPRECATION][v1.0.0] fitViewOptions.pitch is deprecated; use fitViewOptions.pitchDegrees.
```

#### Step 2: オプション名の更新

```javascript
// 1. fitViewOptions の更新
const oldOptions = {
  fitViewOptions: { pitch: -45, heading: 180 }
};

const newOptions = {
  fitViewOptions: { pitchDegrees: -45, headingDegrees: 180 }
};
```

#### Step 3: Resolver系の移行

```javascript
// 2. 動的制御から適応制御への移行
const oldResolverOptions = {
  outlineWidthResolver: (params) => params.isTopN ? 3 : 1,
  outlineOpacityResolver: (ctx) => ctx.isTopN ? 1.0 : 0.5
};

const newAdaptiveOptions = {
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    outlineWidthRange: [1, 3],
    outlineOpacityRange: [0.5, 1.0]
  }
};
```

#### Step 4: レンダリングモードの移行

```javascript
// 3. エミュレーション設定の移行
const migrationMap = {
  false: { outlineRenderMode: 'standard', emulationScope: 'off' },
  true: { outlineRenderMode: 'emulation-only', emulationScope: 'all' },
  'off': { outlineRenderMode: 'standard', emulationScope: 'off' },
  'all': { outlineRenderMode: 'emulation-only', emulationScope: 'all' },
  'topn': { outlineRenderMode: 'standard', emulationScope: 'topn' },
  'non-topn': { outlineRenderMode: 'standard', emulationScope: 'non-topn' }
};
```

### コード例

#### 完全な移行例

```javascript
// v0.1.11 設定
const oldConfig = {
  fitViewOptions: {
    pitch: -30,
    heading: 0
  },
  outlineEmulation: 'topn',
  outlineWidthPreset: 'uniform',
  outlineWidthResolver: (params) => {
    return params.isTopN ? 4 : 2;
  },
  outlineOpacityResolver: (ctx) => {
    return ctx.isTopN ? 1.0 : 0.6;
  }
};

// v0.1.12 移行後
const newConfig = {
  profile: 'desktop-balanced',
  fitViewOptions: {
    pitchDegrees: -30,
    headingDegrees: 0
  },
  outlineRenderMode: 'standard',
  emulationScope: 'topn',
  outlineWidthPreset: 'medium',
  adaptiveOutlines: true,
  adaptiveParams: {
    outlineWidthRange: [2, 4],
    outlineOpacityRange: [0.6, 1.0]
  },
  performanceOverlay: {
    enabled: true,
    position: 'top-right'
  }
};
```

#### プロファイル選択ガイド

```javascript
// ユースケース別プロファイル選択
const profileSelection = {
  // モバイルデバイス・低性能環境
  mobile: {
    profile: 'mobile-fast',
    description: '高速描画優先、視覚品質は最小限'
  },
  
  // デスクトップ・標準的な使用
  desktop: {
    profile: 'desktop-balanced', 
    description: '性能と品質のバランス型'
  },
  
  // 高密度データ（都市部・クラスタリングデータ）
  denseData: {
    profile: 'dense-data',
    description: '重複や密集に最適化'
  },
  
  // 疎データ（広域・散発的データ）
  sparseData: {
    profile: 'sparse-data',
    description: 'カバレッジと可視性重視'
  }
};
```

### 一般的な移行パターン

#### パターン 1: Resolver → 適応制御

```javascript
// 一般的なResolverパターンの移行
function migrateResolver(resolverOptions) {
  const { outlineWidthResolver, outlineOpacityResolver } = resolverOptions;
  
  // Resolver動作の分析
  const isAdaptive = resolverOptions.outlineWidthResolver && 
    resolverOptions.outlineWidthResolver.toString().includes('normalizedDensity');
    
  return {
    adaptiveOutlines: true,
    outlineWidthPreset: isAdaptive ? 'adaptive' : 'medium',
    adaptiveParams: {
      outlineWidthRange: [1, 4],
      outlineOpacityRange: [0.4, 1.0]
    }
  };
}
```

#### パターン 2: 条件付きエミュレーション

```javascript
// 条件付きエミュレーションの移行
function migrateConditionalEmulation(oldOptions) {
  const { outlineEmulation, highlightTopN } = oldOptions;
  
  if (outlineEmulation === 'topn' && highlightTopN) {
    return {
      outlineRenderMode: 'standard',
      emulationScope: 'topn',
      highlightTopN: true
    };
  }
  
  return {
    outlineRenderMode: outlineEmulation ? 'emulation-only' : 'standard',
    emulationScope: outlineEmulation === true ? 'all' : 'off'
  };
}
```

### トラブルシューティング

#### Q: 警告メッセージが表示される

**A**: 廃止予定のオプションを使用しています。警告に表示される推奨オプションに変更してください。

```javascript
// 警告例
[Heatbox][DEPRECATION][v1.0.0] outlineEmulation is deprecated; use outlineRenderMode and emulationScope instead.

// 対処：outlineRenderMode と emulationScope を使用
{
  outlineRenderMode: 'standard',
  emulationScope: 'topn'
}
```

#### Q: Resolver関数が動作しない

**A**: Resolver系は廃止されました。適応制御システムを使用してください。

```javascript
// 動作しない（v0.1.12では無視される）
outlineWidthResolver: (params) => params.isTopN ? 3 : 1

// 適応制御を使用
{
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    outlineWidthRange: [1, 3]
  }
}
```

#### Q: 視覚的な出力が変わった

**A**: プリセット名の変更やデフォルト値の調整が原因の可能性があります。

```javascript
// デフォルト値の確認
const effectiveOptions = heatbox.getEffectiveOptions();
console.log('Effective preset:', effectiveOptions.outlineWidthPreset);

// 明示的に設定
{
  outlineWidthPreset: 'medium',  // 明示的指定
  adaptiveOutlines: false        // 適応制御無効
}
```

#### Q: パフォーマンスが低下した

**A**: プロファイル機能を使用して最適化してください。

```javascript
// 性能優先プロファイルを使用
{
  profile: 'mobile-fast'
}

// またはパフォーマンスオーバーレイで監視
{
  performanceOverlay: {
    enabled: true,
    position: 'top-right'
  }
}
```

#### Q: プロファイルが期待通り動作しない

**A**: プロファイルはユーザーオプションより優先度が低いです。競合するオプションを確認してください。

```javascript
// プロファイル設定がユーザーオプションで上書きされる例
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast',           // maxRenderVoxels: 5000 を設定
  maxRenderVoxels: 20000            // ユーザー設定で上書き（優先）
});

// 有効設定の確認
console.log(heatbox.getEffectiveOptions().maxRenderVoxels); // 20000
```

### オプション対応表（完全版）

| カテゴリ | v0.1.11（廃止予定） | v0.1.12（推奨） | 備考 |
|---------|---------------------|-----------------|------|
| **ビューフィット角度** | `fitViewOptions.pitch` | `fitViewOptions.pitchDegrees` | 命名統一 |
|  | `fitViewOptions.heading` | `fitViewOptions.headingDegrees` | 命名統一 |
| **動的制御** | `outlineWidthResolver` | `adaptiveParams.outlineWidthRange` + `adaptiveOutlines: true` | Resolver廃止 |
|  | `outlineOpacityResolver` | `adaptiveParams.outlineOpacityRange` + `adaptiveOutlines: true` | Resolver廃止 |
|  | `boxOpacityResolver` | `adaptiveParams.boxOpacityRange` + `adaptiveOutlines: true` | Resolver廃止 |
| **レンダリング制御** | `outlineEmulation: true` | `outlineRenderMode: 'emulation-only'`, `emulationScope: 'all'` | 統一制御 |
|  | `outlineEmulation: 'topn'` | `outlineRenderMode: 'standard'`, `emulationScope: 'topn'` | 統一制御 |
|  | `outlineEmulation: 'non-topn'` | `outlineRenderMode: 'standard'`, `emulationScope: 'non-topn'` | 統一制御 |
|  | `outlineEmulation: false` | `outlineRenderMode: 'standard'`, `emulationScope: 'off'` | 統一制御 |
| **プリセット名** | `outlineWidthPreset: 'uniform'` | `outlineWidthPreset: 'medium'` | 名前統一 |
|  | `outlineWidthPreset: 'adaptive-density'` | `outlineWidthPreset: 'adaptive'` | 名前統一 |
|  | `outlineWidthPreset: 'topn-focus'` | `outlineWidthPreset: 'thick'` | 名前統一 |
| **新機能** | N/A | `profile: 'mobile-fast'` など | 環境別最適化 |
|  | N/A | `performanceOverlay: { enabled: true }` | 性能監視 |
|  | N/A | `heatbox.getEffectiveOptions()` | デバッグ支援 |

---

## サポート

移行に関する質問やサポートが必要な場合は、以下をご利用ください：

- [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues)
- [API Documentation](./docs/API.md)
- [Examples](./examples/)

このガイドは継続的に更新されます。最新版は[GitHub](https://github.com/hiro-nyon/cesium-heatbox)で確認してください。
