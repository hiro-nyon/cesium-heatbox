# CesiumJS Heatbox - Migration Guide

このガイドは、CesiumJS Heatboxの異なるバージョン間での移行手順を説明します。

## 目次

- [v0.1.11 → v0.1.12](#v0111--v0112)
  - [Breaking Changes](#breaking-changes)
  - [New Features](#new-features)
  - [Migration Steps](#migration-steps)
  - [Code Examples](#code-examples)
- [Common Migration Patterns](#common-migration-patterns)
- [Troubleshooting](#troubleshooting)

---

## v0.1.11 → v0.1.12

v0.1.12では、APIの一貫性向上と観測可能性機能の追加を行いました。一部の破壊的変更が含まれますが、段階的な廃止により移行をサポートしています。

### Breaking Changes

#### 1. オプション命名の統一

**fitViewOptions内の角度指定**

```javascript
// ❌ v0.1.11 (廃止予定、v0.2.0で削除)
{
  fitViewOptions: {
    pitch: -30,
    heading: 90
  }
}

// ✅ v0.1.12 (推奨)
{
  fitViewOptions: {
    pitchDegrees: -30,
    headingDegrees: 90
  }
}
```

#### 2. Resolver系オプションの廃止

**動的制御から適応制御システムへ**

```javascript
// ❌ v0.1.11 (廃止予定、v0.2.0で削除)
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

// ✅ v0.1.12 (推奨)
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

#### 3. レンダリングモードの統一

**outlineEmulationからoutlineRenderMode + emulationScopeへ**

```javascript
// ❌ v0.1.11 (廃止予定、v0.2.0で削除)
{
  outlineEmulation: true        // または 'topn', 'non-topn', 'all'
}

// ✅ v0.1.12 (推奨)  
{
  outlineRenderMode: 'emulation-only', // 'standard' | 'inset' | 'emulation-only'
  emulationScope: 'all'                // 'off' | 'topn' | 'non-topn' | 'all'
}
```

#### 4. プリセット名の統一

```javascript
// ❌ v0.1.11 (廃止予定、v0.2.0で削除)
{
  outlineWidthPreset: 'uniform'         // → 'medium'
  // outlineWidthPreset: 'adaptive-density' → 'adaptive'
  // outlineWidthPreset: 'topn-focus'       → 'thick'
}

// ✅ v0.1.12 (推奨)
{
  outlineWidthPreset: 'medium'  // 'thin' | 'medium' | 'thick' | 'adaptive'
}
```

### New Features

#### 1. 設定プロファイル機能

```javascript
// 事前定義プロファイルの使用
const heatbox = new Heatbox(viewer, {
  profile: 'mobile-fast'  // 'mobile-fast' | 'desktop-balanced' | 'dense-data' | 'sparse-data'
});

// 利用可能プロファイルの確認
const profiles = Heatbox.listProfiles();
console.log(profiles); // ['mobile-fast', 'desktop-balanced', 'dense-data', 'sparse-data']

// プロファイル詳細の取得
const details = Heatbox.getProfileDetails('mobile-fast');
console.log(details.description); // "Mobile devices - prioritizes performance over visual quality"
```

#### 2. パフォーマンスオーバーレイ

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
heatbox.showPerformanceOverlay();
heatbox.hidePerformanceOverlay();
```

#### 3. 強化されたAPI

```javascript
// 有効な設定の確認（デバッグ用）
const effectiveOptions = heatbox.getEffectiveOptions();
console.log(effectiveOptions);

// 統計情報の取得（レンダリング時間追加）
const stats = heatbox.getStatistics();
console.log(stats.renderTimeMs);  // 新規追加
```

### Migration Steps

#### Step 1: 廃止予定警告の確認

v0.1.12では、古いオプション使用時に警告が表示されます：

```
[Heatbox][DEPRECATION][v0.2.0] fitViewOptions.pitch is deprecated; use fitViewOptions.pitchDegrees.
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
  // outlineEmulation → outlineRenderMode + emulationScope
  false: { outlineRenderMode: 'standard', emulationScope: 'off' },
  true: { outlineRenderMode: 'emulation-only', emulationScope: 'all' },
  'off': { outlineRenderMode: 'standard', emulationScope: 'off' },
  'all': { outlineRenderMode: 'emulation-only', emulationScope: 'all' },
  'topn': { outlineRenderMode: 'standard', emulationScope: 'topn' },
  'non-topn': { outlineRenderMode: 'standard', emulationScope: 'non-topn' }
};
```

### Code Examples

#### Complete Migration Example

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
  profile: 'desktop-balanced',  // プロファイル使用を検討
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

#### Profile Selection Guide

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

## Common Migration Patterns

### Pattern 1: Resolver → Adaptive Control

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
      // 推定される範囲（実際の動作から調整が必要）
      outlineWidthRange: [1, 4],
      outlineOpacityRange: [0.4, 1.0]
    }
  };
}
```

### Pattern 2: Conditional Emulation

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

### Pattern 3: Custom Styling Migration

```javascript
// カスタムスタイリングの移行
function migrateCustomStyling(resolverOptions) {
  // Resolver関数の分析（実際にはより複雑になる場合があります）
  const hasTopNLogic = resolverOptions.outlineWidthResolver?.toString().includes('isTopN');
  const hasDensityLogic = resolverOptions.outlineWidthResolver?.toString().includes('density');
  
  if (hasTopNLogic && hasDensityLogic) {
    return {
      adaptiveOutlines: true,
      outlineWidthPreset: 'adaptive',
      highlightTopN: true,
      highlightStyle: {
        boostOpacity: 0.3,
        boostOutlineWidth: 1.5
      }
    };
  }
  
  return {
    adaptiveOutlines: false,
    outlineWidthPreset: 'medium'
  };
}
```

## Troubleshooting

### Q: 警告メッセージが表示される

**A**: 廃止予定のオプションを使用しています。警告に表示される推奨オプションに変更してください。

```javascript
// 警告例
[Heatbox][DEPRECATION][v0.2.0] outlineEmulation is deprecated; use outlineRenderMode and emulationScope instead.

// 対処：outlineRenderMode と emulationScope を使用
{
  outlineRenderMode: 'standard',
  emulationScope: 'topn'
}
```

### Q: Resolver関数が動作しない

**A**: Resolver系は廃止されました。適応制御システムを使用してください。

```javascript
// ❌ 動作しない
outlineWidthResolver: (params) => params.isTopN ? 3 : 1

// ✅ 適応制御を使用
{
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive',
  adaptiveParams: {
    outlineWidthRange: [1, 3]
  }
}
```

### Q: 視覚的な出力が変わった

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

### Q: パフォーマンスが低下した

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

### Q: プロファイルが期待通り動作しない

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

---

## サポート

移行に関する質問やサポートが必要な場合は、以下をご利用ください：

- [GitHub Issues](https://github.com/hiro-nyon/cesium-heatbox/issues)
- [API Documentation](./docs/API.md)
- [Examples](./examples/)

このガイドは継続的に更新されます。最新版は[GitHub](https://github.com/hiro-nyon/cesium-heatbox)で確認してください。
