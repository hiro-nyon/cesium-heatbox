# Layer Aggregation Examples (v0.1.18)

レイヤ別集約機能のデモンストレーション例です。ボクセル内のエンティティをレイヤ（カテゴリ）別に分類・集約し、統計情報や説明文で参照できます。

Demonstration examples for layer-based aggregation feature. Classify and aggregate entities within voxels by layer (category), making them accessible in statistics and descriptions.

## Examples / 例

### 1. Single Source (`single-source.html`)

**Purpose / 目的:**
- 単一データソース（建物タイプ）のレイヤ別集約を実演
- `byProperty` オプションを使用した基本的な集約パターン
- レイヤ統計の可視化

**Demonstrates:**
- Layer aggregation from a single data source (building types)
- Basic aggregation pattern using `byProperty` option
- Layer statistics visualization

**Features / 機能:**
- 5種類の建物タイプ（residential, commercial, office, industrial, mixed-use）
- 重み付きランダム生成（実際の都市分布を模擬）
- レイヤ別の色分けと統計グラフ
- ボクセル説明文でのレイヤ内訳表示

**Use Cases / ユースケース:**
- 都市計画: 建物用途の空間分布分析
- 不動産分析: エリアごとの建物タイプ構成
- ゾーニング分析: 用途地域の実態把握

**How to Use / 使い方:**
1. "Generate Buildings" で建物データを生成（100〜2000件）
2. "Enable Layer Aggregation" をチェック（集約有効化）
3. "Create Heatmap" でヒートマップを作成
4. 統計パネルでレイヤ分布を確認
5. ボクセルをクリックして詳細な内訳を表示

**Options / オプション:**
- Building Count: 生成する建物の数
- Enable Layer Aggregation: レイヤ集約の有効/無効
- Show in Description: 説明文への内訳表示
- Voxel Size: ボクセルサイズ（20〜200m）

---

### 2. Multi-Source (`multi-source.html`)

**Purpose / 目的:**
- 複数データソース（人流 + POI）の統合分析
- `keyResolver` を使用した高度な集約パターン
- 異種データの空間的共起分析

**Demonstrates:**
- Integrated analysis of multiple data sources (pedestrian flow + POI)
- Advanced aggregation pattern using `keyResolver`
- Spatial co-occurrence analysis of heterogeneous data

**Features / 機能:**
- 人流データ: 時間帯別（朝/昼/夕/夜）の歩行者分布
- POIデータ: 施設タイプ別（飲食/小売/駅/公園）の位置
- ホットスポット周辺のクラスタリング生成
- カスタムkeyResolverによる柔軟なレイヤ定義
- 8種類のデータソースを統合集約

**Use Cases / ユースケース:**
- 都市分析: 人流とPOIの関係性分析
- 商圏分析: 施設種別と来訪者の時間帯分布
- 交通計画: 駅周辺の時間帯別人流パターン
- イベント計画: エリアごとの混雑度と施設分布

**How to Use / 使い方:**
1. "Generate Data" で人流データとPOIを生成
   - Pedestrian Count: 歩行者データ数（100〜2000件）
   - POI Count: POIデータ数（50〜500件）
2. "Enable Layer Aggregation" をチェック
3. "Create Heatmap" でヒートマップを作成
4. 統計パネルで8種類のデータソース分布を確認
5. Legendでデータソースの色分けを参照
6. ボクセルをクリックして混在状況を確認

**Data Generation / データ生成:**
- **Pedestrian Flow**: ホットスポット（駅/商業地/オフィス街）周辺にクラスタリング
- **POI**: エリア全体にランダム配置（実際の施設分布を模擬）

**Options / オプション:**
- Pedestrian Count: 人流データの数
- POI Count: POIデータの数
- Enable Layer Aggregation: レイヤ集約の有効/無効
- Show in Description: 説明文への内訳表示
- Voxel Size: ボクセルサイズ（20〜150m）

---

## Technical Details / 技術詳細

### Aggregation Options / 集約オプション

```javascript
// Single source example (byProperty)
aggregation: {
  enabled: true,
  byProperty: 'buildingType',  // エンティティのプロパティキーを指定
  showInDescription: true
}

// Multi-source example (keyResolver)
aggregation: {
  enabled: true,
  keyResolver: (entity) => {
    // カスタムロジックでレイヤキーを決定
    return entity.properties?.dataSource || 'unknown';
  },
  showInDescription: true
}
```

### Statistics Output / 統計出力

```javascript
const stats = heatbox.getStatistics();

// stats.layers: Top-10 layers sorted by count
// [
//   { key: 'residential', total: 450 },
//   { key: 'commercial', total: 280 },
//   ...
// ]
```

### Voxel Properties / ボクセルプロパティ

各ボクセルエンティティには以下のプロパティが追加されます:

```javascript
voxelEntity.properties = {
  type: 'voxel',
  count: 15,
  layerTop: 'residential',  // 最多レイヤ
  layerStats: {             // レイヤ別カウント（オブジェクト形式）
    'residential': 8,
    'commercial': 5,
    'office': 2
  },
  // ... other properties
};
```

---

## Performance Considerations / パフォーマンス考慮事項

### Memory Overhead / メモリオーバーヘッド
- レイヤ集約有効時: 約 +5〜10% のメモリ使用量増加
- 1000〜5000ボクセルの範囲で検証済み

### Processing Time / 処理時間
- レイヤ集約有効時: 約 +5〜10% の処理時間増加
- エンティティ数に対してほぼ線形

### Best Practices / ベストプラクティス

1. **Use Categorical Keys / カテゴリカルなキーを使用**
   - ✅ Good: `'residential'`, `'commercial'`, `'type-A'`
   - ❌ Avoid: Timestamps, UUIDs, continuous values

2. **Limit Layer Count / レイヤ数を制限**
   - 推奨: 10〜20種類以下
   - 統計出力は自動的にTop-10に制限されます

3. **Consistent Key Format / 一貫したキー形式**
   - 文字列として扱われます（数値は自動変換）
   - 大文字小文字を区別します

4. **XSS Prevention / XSS防止**
   - レイヤキーは自動的にHTMLエスケープされます
   - ユーザー入力をそのまま使用しても安全

---

## Related Documentation / 関連ドキュメント

- [ADR-0014: Voxel Layer Aggregation](../../docs/adr/ADR-0014-v0.1.18-voxel-layer-aggregation.md)
- [API Documentation](../../docs/api/)
- [Main README](../../README.md)

---

## Version / バージョン

- Feature: v0.1.18
- ADR: ADR-0014
- Examples Created: 2025-11

