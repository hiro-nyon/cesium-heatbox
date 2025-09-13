# CesiumJS Heatbox - テスト戦略 v0.1.12

## 🎯 テストの階層とスコープ

### **コアテストスイート** (常時実行)
```bash
npm test  # 14 test suites, 183 tests
```

**対象範囲**:
- **単体テスト**: 各クラス・関数の動作確認
- **統合テスト**: 基本的なサンプルコード検証
- **パフォーマンス**: レガシーResolverテスト
- **実行時間**: ~3秒

### **品質保証テスト** (個別実行)
```bash
# 移行シナリオテスト
npm test test/migration/migration-scenarios.test.js

# パフォーマンス劣化チェック  
npm test test/performance/performance-regression.test.js

# 統合品質保証テスト
npm test test/integration/quality-assurance.test.js
```

**特徴**:
- **環境依存**: 特定の実行条件が必要
- **時間要求**: より詳細な検証でコストが高い
- **Phase 4専用**: ADR-0010品質保証プロセス

## 🛠️ テストヘルパーの活用

### **統一テストインフラ**
```javascript
// test/helpers/testHelpers.js
import { createMockViewer, createWarningAssertions, generateTestData } from '../helpers/testHelpers.js';

describe('My Test', () => {
  let mockViewer, warnings;
  
  beforeEach(() => {
    mockViewer = createMockViewer();  // 標準化されたモック
    warnings = createWarningAssertions(consoleSpy);  // 警告テスト
  });
});
```

### **共通設定・データ**
```javascript
import { TEST_CONFIGS } from '../helpers/testHelpers.js';

// レガシー設定
const v011Config = TEST_CONFIGS.LEGACY_V011;

// 新API設定
const v012Config = TEST_CONFIGS.NEW_V012;

// テストデータ生成
const testData = generateTestData(1000, { clustered: true });
```

## 📊 テスト実行戦略

### **開発時**: 高速フィードバック
```bash
npm test                    # コアテスト（3秒）
npm run test:coverage       # カバレッジ付き
npm test --watch           # ウォッチモード
```

### **品質保証時**: 包括検証
```bash
# 段階的実行
npm test                                    # Step 1: コア
npm test test/migration/migration-scenarios.test.js  # Step 2: 移行
npm test test/performance/performance-regression.test.js  # Step 3: 性能
npm test test/integration/quality-assurance.test.js      # Step 4: 統合

# 個別スモークテスト
npm test -t "Profile-based configuration"
npm test -t "Performance overlay"
```

### **CI/CD環境**: 効率的パイプライン
```yaml
# GitHub Actions例
- name: Core Tests
  run: npm test --reporters=summary --bail=1

- name: Quality Gates (manual trigger)  
  run: |
    npm test test/migration/migration-scenarios.test.js --silent
    npm test test/performance/performance-regression.test.js --silent
```

## 🔍 テスト種別と責務

| テスト種別 | 責務範囲 | 実行頻度 | 実行時間 |
|-----------|---------|---------|----------|
| **単体** | クラス・関数の動作 | 毎コミット | <1秒 |
| **統合** | モジュール間連携 | 毎コミット | 1-2秒 |
| **移行** | v0.1.11→v0.1.12パス | PR前 | ~10秒 |
| **性能** | パフォーマンス劣化 | リリース前 | ~30秒 |
| **品質** | 全体品質保証 | リリース前 | ~15秒 |

## 🎨 テストコード品質ガイドライン

### **簡潔性**: DRYの原則
```javascript
// ❌ 繰り返し
test('test A', () => {
  const mockViewer = { /* 長い設定 */ };
  const consoleSpy = jest.spyOn(console, 'warn')...
  // テストロジック
});

// ✅ ヘルパー活用
test('test A', () => {
  const mockViewer = createMockViewer();
  const warnings = createWarningAssertions(consoleSpy);
  // テストロジック（簡潔）
});
```

### **可読性**: 意図明確化
```javascript
// ❌ 複雑な警告チェック
expect(consoleSpy).toHaveBeenCalledWith(
  expect.stringContaining('[Heatbox][DEPRECATION]...'))

// ✅ 直感的な警告チェック  
warnings.expectWarnContains('fitViewOptions.pitch is deprecated');
```

### **保守性**: 設定の集約
```javascript
// ❌ ハードコーディング
const legacyOptions = { 
  fitViewOptions: { pitch: -45, heading: 0 },
  outlineEmulation: 'topn'
};

// ✅ 定数化
const legacyOptions = TEST_CONFIGS.LEGACY_V011;
```

## 📈 カバレッジ目標

### **現在の達成状況**
- **Branches**: 65%+ (目標達成)
- **Functions**: 80%+ (目標達成)  
- **Lines**: 80%+ (目標達成)
- **Statements**: 80%+ (目標達成)

### **品質重視領域**
- **Migration logic**: 95%+ カバレッジ
- **Deprecation warnings**: 100% カバレッジ
- **Profile application**: 90%+ カバレッジ
- **Error handling**: 85%+ カバレッジ

## 🚀 継続的改善

### **Phase 5以降の改善案**
- **E2Eテスト**: Cypressによる実ブラウザテスト
- **Visual Regression**: スクリーンショット比較
- **Load Testing**: 大規模データでの性能テスト
- **Property-based Testing**: ランダム入力での堅牢性検証

### **メンテナンス方針**
- **月次レビュー**: テスト実行時間の最適化
- **四半期見直し**: テスト戦略の見直し
- **リリース前**: 品質保証テストの全実行

---

**📝 メモ**: このテスト戦略はv0.1.12で大幅に整理・改善され、開発効率と品質保証の両立を実現しています。Phase 4品質保証テストは特別な実行環境要件があるため、通常の開発ワークフローから分離されています。
