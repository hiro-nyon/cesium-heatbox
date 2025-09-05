# Migration Guide - v0.1.10 API Changes

**このガイドは ADR-0008 Phase 4 で実装された API 変更（非破壊的）への対応方法を説明します。**

## 📋 **概要**

v0.1.10 では以下の API 変更が行われました（**後方互換性維持**）：

1. **fitViewOptions 統一**: `pitch`/`heading` → `pitchDegrees`/`headingDegrees` (**非推奨化**)
2. **outlineEmulation 非推奨化**: `outlineRenderMode` への統合推奨 (**v0.1.11で削除予定**)
3. **動的リゾルバ非推奨化**: プリセットベース適応制御への移行推奨 (**v0.1.11で削除予定**)

> ⚠️ **重要**: v0.1.10では既存コードは動作し続けますが、非推奨警告が表示されます。v0.1.11で完全削除予定です。

## 🔄 **移行手順**

### 1. fitViewOptions の統一

#### **旧API (v0.1.10: 非推奨、v0.1.11: 削除予定)**
```javascript
const heatbox = new Heatbox(viewer, {
  autoView: true,
  fitViewOptions: {
    pitch: -45,     // ⚠️ 非推奨（v0.1.11で削除予定）
    heading: 30,    // ⚠️ 非推奨（v0.1.11で削除予定）  
    paddingPercent: 0.1
  }
});
```

#### **新API (推奨)**
```javascript
const heatbox = new Heatbox(viewer, {
  autoView: true,
  fitViewOptions: {
    pitchDegrees: -45,    // ✅ 新API
    headingDegrees: 30,   // ✅ 新API
    paddingPercent: 0.1
  }
});
```

#### **後方互換性**
- 旧API (`pitch`/`heading`) は自動的に新APIに変換されます
- 警告メッセージが表示されますが、機能は正常に動作します
- 将来のバージョンでは完全に削除される予定です

---

### 2. outlineEmulation の非推奨化

#### **旧API (v0.1.10: 非推奨、v0.1.11: 削除予定)**
```javascript
const heatbox = new Heatbox(viewer, {
  outlineEmulation: 'topn'  // ⚠️ 非推奨（v0.1.11で削除予定）
});
```

#### **新API (代替)**
```javascript
const heatbox = new Heatbox(viewer, {
  outlineRenderMode: 'emulation-only'  // ✅ 新API
});
```

#### **移行対応表**
| 旧 outlineEmulation | 新 outlineRenderMode | 説明 |
|-------------------|-------------------|------|
| `'off'` | `'standard'` | 標準枠線表示 |
| `'topn'` | `'emulation-only'` | エミュレーション専用 |
| `'non-topn'` | `'inset'` | インセット枠線 |
| `'all'` | `'emulation-only'` | 全体エミュレーション |

---

### 3. 動的リゾルバの非推奨化

#### **旧API (v0.1.10: 非推奨、v0.1.11: 削除予定)**
```javascript
const heatbox = new Heatbox(viewer, {
  // ⚠️ すべて非推奨（v0.1.11で削除予定）
  outlineWidthResolver: ({ isTopN, normalizedDensity }) => {
    return isTopN ? 6 : 2;
  },
  boxOpacityResolver: ({ normalizedDensity }) => {
    return 0.3 + 0.7 * normalizedDensity;
  },
  outlineOpacityResolver: ({ isTopN }) => {
    return isTopN ? 1.0 : 0.5;
  }
});
```

#### **新API (プリセット使用)**
```javascript
const heatbox = new Heatbox(viewer, {
  // ✅ プリセットベース適応制御
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density', // または 'topn-focus'
  
  // 基本的な制御オプション
  outlineOpacity: 0.8,
  opacity: 0.7
});
```

#### **プリセット種類**
| プリセット | 動作 | 使用場面 |
|----------|------|----------|
| `'uniform'` | 一律同じ太さ | 標準表示 |
| `'adaptive-density'` | 密度に応じた適応制御 | 密度重視 |
| `'topn-focus'` | TopN 強調型 | 重要データ強調 |

---

## 🔧 **高度な移行対応**

### カスタム動的制御が必要な場合

動的リゾルバで複雑な制御を行っていた場合は、以下の方法で対応できます：

#### **方法1: adaptiveParams の調整**
```javascript
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,
  outlineWidthPreset: 'adaptive-density',
  adaptiveParams: {
    neighborhoodRadius: 100,    // 近傍計算範囲を拡大
    densityThreshold: 3,        // 密度閾値を調整
    cameraDistanceFactor: 1.5   // カメラ距離補正を強化
  }
});
```

#### **方法2: highlightTopN との組み合わせ**
```javascript
const heatbox = new Heatbox(viewer, {
  highlightTopN: 10,
  highlightStyle: {
    outlineWidth: 8,     // TopN の枠線太さ
    boostOpacity: 0.3    // TopN の透明度ブースト
  },
  adaptiveOutlines: true,
  outlineWidthPreset: 'topn-focus'
});
```

---

## 📝 **移行チェックリスト**

- [ ] `fitViewOptions.pitch` → `fitViewOptions.pitchDegrees`
- [ ] `fitViewOptions.heading` → `fitViewOptions.headingDegrees`
- [ ] `outlineEmulation` → `outlineRenderMode`
- [ ] `outlineWidthResolver` → `adaptiveOutlines` + `outlineWidthPreset`
- [ ] `boxOpacityResolver` → `opacity` + `highlightStyle.boostOpacity`
- [ ] `outlineOpacityResolver` → `outlineOpacity` + 適応制御
- [ ] 型定義ファイルの更新 (TypeScript使用時)
- [ ] テストコードの更新
- [ ] ドキュメント・コメントの更新

---

## 🚨 **トラブルシューティング**

### よくある問題

#### **1. 枠線が表示されない**
```javascript
// 解決方法: outlineRenderMode を明示的に指定
const heatbox = new Heatbox(viewer, {
  showOutline: true,
  outlineRenderMode: 'standard'  // 追加
});
```

#### **2. 適応制御が効かない**
```javascript
// 解決方法: adaptiveOutlines を有効化
const heatbox = new Heatbox(viewer, {
  adaptiveOutlines: true,        // 追加
  outlineWidthPreset: 'adaptive-density'
});
```

#### **3. 旧APIの警告が表示される**
```javascript
// 解決方法: 新APIに変更
fitViewOptions: {
  pitchDegrees: -30,  // pitch → pitchDegrees
  headingDegrees: 0   // heading → headingDegrees  
}
```

---

## 📚 **参考情報**

- [ADR-0008: v0.1.10 API Cleanup](./docs/adr/ADR-0008-v0.1.10-refactor-and-api-cleanup.md)
- [API Reference](./docs/API.md)
- [Examples](./examples/)

---

**この移行は v0.1.10 で一度だけ発生します。今後は安定したAPIを維持する予定です。**
