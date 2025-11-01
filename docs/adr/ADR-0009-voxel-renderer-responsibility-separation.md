# ADR-0009: VoxelRenderer責任分離とSingle Responsibility Principle適用

## Status
Accepted — 2025-09-07

Supersedes: ADR-0008 (実装上の問題により再設計)

## Context

### 現状の問題
- `VoxelRenderer.js` が現在1,265行と巨大で、複数の責任を同時に担っている「神クラス」(God Class)状態
- Single Responsibility Principleに明確に違反し、保守性・テスタビリティが低下
- ADR-0008のリファクタリングが複雑すぎて実装上の問題が発生

### VoxelRendererが現在担っている責任
1. **色計算・カラーマッピング** - `interpolateColor()`, `_interpolateFromColorMap()`, `_interpolateDivergingColor()`
2. **選択戦略** - `_selectVoxelsForRendering()`, `_selectByDensity()`, `_selectByCoverage()`, `_selectByHybrid()`
3. **適応的制御** - `_calculateAdaptiveParams()`
4. **実際の描画** - `render()`, ボクセルエンティティの作成
5. **補助的描画** - インセット枠線、エッジポリライン、バウンディングボックス
6. **状態管理** - エンティティリストの管理、可視性制御

### 責任境界の分析
各責任の入出力を整理すると：
- **色計算**: `(normalizedDensity, options) → Color`
- **選択戦略**: `(allVoxels, maxCount, strategy) → selectedVoxels`
- **適応制御**: `(voxelInfo, context) → adaptiveParams`
- **描画**: `(voxelData, renderParams) → renderedCount`

## Decision

### 1. 段階的責任分離アプローチ
即座に全体をリファクタリングするのはリスクが高いため、以下の段階的アプローチを採用：

#### Phase 1: ColorCalculator の分離（最優先）
- 最もリスクが低く、独立性が高い色計算ロジックから開始
- 純粋関数として実装し、単体テストが容易
- 既存のVoxelRenderer内で段階的に移行

#### Phase 2: VoxelSelector の分離
- 選択戦略は比較的独立性が高い
- 既存インターフェースを維持しつつ内部実装を委譲

#### Phase 3: AdaptiveController の分離
- 適応的制御ロジックを専門クラスに分離
- 近傍密度計算など複雑なロジックを独立化

#### Phase 4: GeometryRenderer の分離
- ジオメトリ描画を専門クラスに分離
- エンティティ管理を統一化

#### Phase 5: VoxelRenderer のオーケストレーション化
- 最終的に各専門クラスを組み合わせるオーケストレーション役に特化

### 2. 新しいクラス構造

```
src/core/
├── color/
│   └── ColorCalculator.js          # 色計算・カラーマッピング専門
├── selection/
│   └── VoxelSelector.js            # ボクセル選択戦略専門
├── adaptive/
│   └── AdaptiveController.js       # 適応的制御専門
├── geometry/
│   └── GeometryRenderer.js         # ジオメトリ描画専門
└── VoxelRenderer.js                # オーケストレーション役（300行以下目標）
```

### 3. 各クラスの責任

#### ColorCalculator
- 色計算ロジック（線形補間、カラーマップ、二極性配色）
- 純粋関数として実装
- 設定: `colorMap`, `minColor`, `maxColor`, `diverging`, `divergingPivot`

#### VoxelSelector
- ボクセル選択戦略（密度、カバレッジ、ハイブリッド）
- 選択アルゴリズムの実装
- 設定: `renderLimitStrategy`, `minCoverageRatio`, `coverageBinsXY`

#### AdaptiveController
- 適応的パラメータ計算（枠線幅、不透明度）
- 近傍密度計算
- 設定: `adaptiveOutlines`, `outlineWidthPreset`, `adaptiveParams`

#### GeometryRenderer
- Cesiumエンティティの作成・管理
- ボクセルボックス、インセット枠線、エッジポリライン描画
- エンティティのライフサイクル管理

#### VoxelRenderer（リファクタリング後）
- 各専門クラスのオーケストレーション
- 公開APIの維持
- 描画フローの制御

### 4. 互換性維持戦略
- 既存の公開APIは完全に維持
- 内部実装のみを段階的に変更
- 既存のオプション体系は変更しない
- テストが100%パスすることを保証

### 5. 依存関係と境界
本設計における許可された依存方向と境界を明示する。

```
VoxelRenderer (orchestrator)
  ├─> ColorCalculator     # 純粋/無状態（optionsのみ）
  ├─> VoxelSelector       # grid/statisticsに依存可、Cesium依存不可
  ├─> AdaptiveController  # voxelData, grid, statisticsに依存可、Cesium依存不可
  └─> GeometryRenderer    # Cesium依存可、他コンポーネントへ依存不可

禁止: GeometryRenderer → {Selector, Adaptive, Color} への逆参照
禁止: 各コンポーネント → VoxelRenderer への逆参照
```

契約（主要シグネチャ）
- ColorCalculator: `(normalizedDensity: number, rawValue?: number, options) => Cesium.Color`
- VoxelSelector: `(voxels: Entry[], maxCount: number, ctx: { grid }) => Entry[]`
- AdaptiveController: `(voxelInfo, ctx: { voxelData, grid, statistics, options }) => { outlineWidth, boxOpacity, outlineOpacity, shouldUseEmulation }`
- GeometryRenderer: `renderVoxel(voxel, params) => Entity[]` / `clear() => void`

## Consequences

### 利点
1. **責任の明確化**: 各クラスが単一の明確な責任を持つ
2. **テスタビリティ向上**: ColorCalculatorなどは純粋関数として単体テスト可能
3. **拡張性**: 新しい色計算方式や選択戦略を簡単に追加可能
4. **再利用性**: ColorCalculatorは他の描画クラスでも使用可能
5. **保守性**: コードの理解・修正が容易になる

### 潜在的な課題
1. **クラス増加による複雑性**: 4つの新しいクラスが追加される
2. **パフォーマンス/メモリ**:
   - サブコンポーネント常駐によるメモリ使用量の増加
   - 初期化コストの増加（コンストラクション/準備処理）
   - 呼び出しチェーンの深化に伴う関数呼び出しオーバーヘッド
3. **学習コスト**: 開発者が新しいアーキテクチャを理解する必要

### エラーハンドリング戦略
コンポーネント分離後の例外・失敗モードを統一方針で扱う。

- 方針
  - Fatal（描画不能）: 明示的に例外をスローし、上位（VoxelRenderer）でキャッチしてレンダリングを中断。ユーザーに通知（Logger.error）。
  - Recoverable（劣化許容）: デフォルト値でフォールバックし、処理継続（Logger.warn）。
  - Programming error（契約違反）: 単体テストで検出し、実行時はGuardで防止。

- 代表例と扱い
  - ColorCalculator失敗: `Cesium.Color.GRAY.withAlpha(opacity)` でフォールバック、処理継続。
  - AdaptiveController失敗: `outlineWidth/opacity` をオプション既定値にフォールバック。
  - GeometryRenderer失敗（単一エンティティ）: 当該ボクセルのみスキップし、全体は継続。
  - VoxelSelector失敗: 既定の密度ソート選抜へフォールバック。

- ロギングレベル
  - error: レンダリング継続不能／繰り返し再現する致命障害
  - warn: 単一ボクセル/サブシステムのフォールバック発生
  - debug: デバッグ支援情報（採用戦略、フォールバック回数など）

### リスク軽減策
1. **段階的移行**: 一度に全体を変更せず、フェーズごとに実装
2. **既存API維持**: 外部から見える動作は完全に同じ
3. **性能/メモリ監視**: 各フェーズでベンチ/プロファイル（CPU/Heapスナップショット）を実施
4. **Lazy初期化**: 各コンポーネントは初回利用時に生成（必要なければ生成しない）
5. **オブジェクト再利用**: 一時配列/バッファの再利用、ホットパスでの割り当て削減
6. **呼び出し最適化**: クリティカルパスでは薄い委譲・インライン化を検討（関数境界最小化）
7. **依存境界の静的検査**: CIで循環依存検出（例: `madge`）を実行

### 非目標（Non-goals）
- 外部API/オプションの破壊的変更は含まない（削除は別途Migration合意の上で実施）
- 新機能の追加は本ADRの範囲外（責務分離のみに集中）

## Acceptance Criteria

### 構造目標
- [ ] `VoxelRenderer.js` の行数 ≤ 300行
- [ ] 新設する4つの専門クラスの実装
- [ ] 循環依存の回避

### 機能要件
- [ ] 既存のすべてのユースケースが動作
- [ ] 既存のオプションがすべて機能
- [ ] 視覚的な出力が既存と同一

### 品質要件
- [ ] すべてのテストが100%パス
- [ ] Lint errors 0
- [ ] パフォーマンスが既存比±5%以内
 - [ ] メモリ使用量が既存比±10%以内（代表データセットでHeap差分を計測）
 - [ ] 初期化時間（レンダラ生成→初回描画まで）が既存比±5%以内
 - [ ] クリティカルパスの関数呼び出し深さの増分 ≤ +2 レベル

### ドキュメント
- [ ] 各新クラスのJSDoc整備
- [ ] アーキテクチャ図の更新

## Implementation Plan

### Phase 1: ColorCalculator分離（Week 1）
```javascript
// VoxelRenderer内で段階的移行
constructor(viewer, options = {}) {
  this.viewer = viewer;
  this.options = options;
  this.colorCalculator = new ColorCalculator(options); // 新規追加
  // 既存のコードは残す
}

interpolateColor(normalizedDensity, rawValue) {
  // 新しい実装に委譲
  return this.colorCalculator.calculateColor(normalizedDensity, rawValue);
}
```

### Phase 2: VoxelSelector分離（Week 2）
```javascript
_selectVoxelsForRendering(allVoxels, maxCount, bounds, grid) {
  // 新しいVoxelSelectorに委譲しつつ、既存インターフェースを維持
  if (!this.voxelSelector) {
    this.voxelSelector = new VoxelSelector(this.options);
  }
  return this.voxelSelector.selectVoxels(allVoxels, maxCount, { grid });
}
```

### Phase 3: AdaptiveController分離（Week 3）
- 適応的パラメータ計算の分離
- 近傍密度計算の独立化

### Phase 4: GeometryRenderer分離（Week 4）
- エンティティ作成・管理の分離
- 描画機能の統一化

### Phase 5: 最終統合とテスト（Week 5）
- 全体の統合テスト
- パフォーマンステスト
- ドキュメント更新

## Rollout Plan

### Phase 1: ColorCalculator分離 (Week 1)
**目標**: 色計算ロジックの完全分離
- [ ] `src/core/color/ColorCalculator.js` 作成
  - [ ] 基本色補間（線形）実装
  - [ ] カラーマップ補間（viridis, inferno）実装  
  - [ ] 二極性配色（diverging）実装
  - [ ] JSDoc完備
- [ ] VoxelRenderer内での段階的移行
  - [ ] ColorCalculatorインスタンス化
  - [ ] `interpolateColor()` メソッドの委譲実装
  - [ ] 既存メソッドを段階的に置換
- [ ] テスト実装
  - [ ] ColorCalculator単体テスト作成
  - [ ] 既存統合テストが100%パス
- [ ] **マイルストーン**: 色計算関連の行数を~150行削減

### Phase 2: VoxelSelector分離 (Week 2)
**目標**: ボクセル選択戦略の完全分離
- [ ] `src/core/selection/VoxelSelector.js` 作成
  - [ ] 密度選択戦略実装
  - [ ] カバレッジ選択戦略実装
  - [ ] ハイブリッド選択戦略実装
  - [ ] JSDoc完備
- [ ] VoxelRenderer内での段階的移行
  - [ ] VoxelSelectorインスタンス化
  - [ ] `_selectVoxelsForRendering()` メソッドの委譲実装
  - [ ] 選択戦略メソッドの移行
- [ ] テスト実装
  - [ ] VoxelSelector単体テスト作成
  - [ ] 選択戦略別のテストケース
  - [ ] 既存統合テストが100%パス
- [ ] **マイルストーン**: 選択戦略関連の行数を~200行削減

### Phase 3: AdaptiveController分離 (Week 3)
**目標**: 適応的制御ロジックの完全分離
- [ ] `src/core/adaptive/AdaptiveController.js` 作成
  - [ ] 適応的パラメータ計算実装
  - [ ] 近傍密度計算実装
  - [ ] プリセット適用ロジック実装
  - [ ] JSDoc完備
- [ ] VoxelRenderer内での段階的移行
  - [ ] AdaptiveControllerインスタンス化
  - [ ] `_calculateAdaptiveParams()` メソッドの委譲実装
  - [ ] 近傍密度計算の移行
- [ ] テスト実装
  - [ ] AdaptiveController単体テスト作成
  - [ ] 近傍密度計算テスト
  - [ ] 既存統合テストが100%パス
- [ ] **マイルストーン**: 適応制御関連の行数を~180行削減

### Phase 4: GeometryRenderer分離 (Week 4)
**目標**: ジオメトリ描画機能の完全分離
- [ ] `src/core/geometry/GeometryRenderer.js` 作成
  - [ ] ボクセルボックス描画実装
  - [ ] インセット枠線描画実装
  - [ ] エッジポリライン描画実装
  - [ ] エンティティライフサイクル管理実装
  - [ ] JSDoc完備
- [ ] VoxelRenderer内での段階的移行
  - [ ] GeometryRendererインスタンス化
  - [ ] エンティティ作成メソッドの委譲実装
  - [ ] 描画関連メソッドの移行
- [ ] テスト実装
  - [ ] GeometryRenderer単体テスト作成
  - [ ] エンティティ管理テスト
  - [ ] 既存統合テストが100%パス
- [ ] **マイルストーン**: 描画関連の行数を~250行削減

### Phase 5: 最終統合とオーケストレーション化 (Week 5)
**目標**: VoxelRendererのオーケストレーション役への特化
- [ ] VoxelRenderer最終リファクタリング
  - [ ] 各専門クラスの統合
  - [ ] オーケストレーションロジック実装
  - [ ] 不要コードの削除
  - [ ] JSDoc更新
- [ ] 統合テスト
  - [ ] 全機能統合テスト実行
  - [ ] パフォーマンステスト実行（±5%以内確認）
  - [ ] メモリリークテスト実行
- [ ] ドキュメント更新
  - [ ] アーキテクチャ図更新
  - [ ] API仕様書更新
  - [ ] サンプルコード検証
- [ ] **マイルストーン**: VoxelRenderer.js ≤ 300行達成

### 品質ゲート
各Phase完了時に以下を確認：
- [ ] **機能テスト**: 既存の全テストケースが100%パス
- [ ] **性能テスト**: 処理時間が既存比±5%以内
- [ ] **Lint**: ESLintエラー0件
- [ ] **API互換性**: 既存のサンプルコードが無修正で動作
- [ ] **視覚検証**: examples/basic, examples（カテゴリディレクトリ）で出力が同一

### リスク管理と対応策
#### 高リスク項目
1. **パフォーマンス劣化**
   - 対策: 各Phaseでベンチマークテスト実行
   - 閾値: 処理時間±5%以内、メモリ使用量±10%以内
   
2. **API互換性破綻**
   - 対策: 既存テストの100%パス維持
   - ロールバック条件: 既存サンプルが動作しない場合

3. **循環依存発生**
   - 対策: 各Phase完了時に依存関係チェック
   - ツール: `madge`等による循環依存検出

### デプロイメント戦略
#### ブランチ戦略
```
main (stable v0.1.9)
 ├── next (Phase実装ブランチ)
 │   ├── feature/phase1-color-calculator
 │   ├── feature/phase2-voxel-selector  
 │   ├── feature/phase3-adaptive-controller
 │   ├── feature/phase4-geometry-renderer
 │   └── feature/phase5-integration
 └── hotfix/* (必要に応じて)
```

#### マージ戦略
- 各Phase完了時にnextブランチにマージ
- 全Phase完了後、v0.1.11-alpha.1としてタグ付け
- 安定性確認後、mainブランチにマージしv0.1.11リリース

### モニタリング・メトリクス
#### コード品質メトリクス
- [ ] VoxelRenderer.js行数: 1,265行 → ≤300行
- [ ] 循環複雑度: 現状値 → 20%削減目標
- [ ] テストカバレッジ: 現状維持（90%以上）

#### パフォーマンスメトリクス
- [ ] setData処理時間: ベースライン±5%以内
- [ ] render処理時間: ベースライン±5%以内
- [ ] メモリ使用量: ベースライン±10%以内

### 完了判定基準
全ての以下条件を満たした場合に完了とする：
- [ ] 5つのPhaseすべてが完了
- [ ] VoxelRenderer.js ≤ 300行
- [ ] 既存テスト100%パス
- [ ] パフォーマンス要件クリア
- [ ] examples/basic とカテゴリ別 examples/* が正常動作
- [ ] JSDoc完備、Lintエラー0

## References
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [God Object Anti-pattern](https://en.wikipedia.org/wiki/God_object)
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
