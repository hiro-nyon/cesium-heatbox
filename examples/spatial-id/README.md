# Spatial ID Examples

**日本語** | [English](#english)

## 日本語

このディレクトリには、空間ID（METI準拠 / Ouranos）タイルグリッドモードのデモ例が含まれています。

### デモ一覧

#### 1. Comparison (比較)
**ファイル**: `comparison.html`

従来の一様グリッドと空間IDタイルグリッドの視覚的比較を行います。

**検証項目**:
- 一様グリッドとタイルグリッドの配置の違い
- 同じデータでのボクセル数・分布の比較
- 空間IDによる地理的精度の向上

**使い方**:
1. ブラウザで `comparison.html` を開く
2. 「生成」ボタンをクリックしてデータを生成
3. 「一様グリッド表示」「空間IDグリッド表示」「両方表示」を切り替え
4. 統計情報パネルで比較データを確認

#### 2. Zoom Levels (ズームレベル検証)
**ファイル**: `zoom-levels.html`

異なるズームレベル（15, 20, 25, 30）でのボクセル生成を検証します。

**検証項目**:
- ズームレベルによるセルサイズの変化
- 各ズームレベルでの適切な粒度
- パフォーマンスとメモリ使用量の関係

**使い方**:
1. ブラウザで `zoom-levels.html` を開く
2. ズームレベル選択ドロップダウンから選択
3. 「生成」ボタンをクリック
4. 異なるズームレベルでのボクセルサイズを比較

#### 3. Containment Verification (包含検証)
**ファイル**: `containment.html`

大きいズームレベルが小さいズームレベルを正しく内包しているかを検証します。

**検証項目**:
- Zoom 25 の各ボクセルが Zoom 20 のどのボクセルに含まれるか
- Zoom 30 の各ボクセルが Zoom 25 のどのボクセルに含まれるか
- 空間ID階層構造の正しさ

**使い方**:
1. ブラウザで `containment.html` を開く
2. 「親ズーム」と「子ズーム」を選択
3. 「検証」ボタンをクリック
4. 包含関係の結果を確認（緑=正常、赤=異常）

### 技術仕様

#### データ生成範囲
- **中心**: 新宿駅周辺 (139.7°E, 35.69°N)
- **範囲**: 東西 0.02度 × 南北 0.02度 × 高度 0-200m
- **データ件数**: 100エンティティ（デフォルト）

#### ズームレベルとセルサイズ

| ズーム | セルサイズ (赤道) | 新宿付近 | ボクセル数目安 |
|--------|------------------|----------|----------------|
| 15     | ~1220 m          | ~1000 m  | 数個           |
| 20     | ~38 m            | ~31 m    | 数十個         |
| 25     | ~1.2 m           | ~1 m     | 数百個         |
| 30     | ~3.7 cm          | ~3 cm    | 数千個         |

### トラブルシューティング

**Q: 空間IDモードでボクセルが表示されない**
- `ouranos-gex-lib-for-javascript` がインストールされているか確認
- ブラウザコンソールでフォールバックメッセージを確認
- フォールバック時は内蔵Web Mercator変換が使用されます

**Q: ズームレベルが高すぎてパフォーマンスが低下する**
- `maxRenderVoxels` オプションで制限を設定
- `renderLimitStrategy: 'density'` で密度順にレンダリング
- より低いズームレベルを試す

**Q: 包含検証で異常が検出される**
- 境界付近での丸め誤差による誤検知の可能性
- フォールバックモードでは完全な包含が保証されない場合があります

---

## English

This directory contains demonstration examples for Spatial ID (METI-compliant / Ouranos) tile-grid mode.

### Demo List

#### 1. Comparison
**File**: `comparison.html`

Visual comparison between traditional uniform grid and spatial ID tile-grid.

**Validation Points**:
- Differences in uniform grid vs tile-grid placement
- Comparison of voxel count and distribution with same data
- Geographic accuracy improvements with Spatial ID

**How to Use**:
1. Open `comparison.html` in browser
2. Click "Generate" button to create data
3. Switch between "Uniform Grid", "Spatial ID Grid", "Both"
4. Check comparison data in statistics panel

#### 2. Zoom Levels
**File**: `zoom-levels.html`

Validation of voxel generation at different zoom levels (15, 20, 25, 30).

**Validation Points**:
- Cell size changes by zoom level
- Appropriate granularity at each zoom level
- Performance and memory usage relationship

**How to Use**:
1. Open `zoom-levels.html` in browser
2. Select from zoom level dropdown
3. Click "Generate" button
4. Compare voxel sizes across different zoom levels

#### 3. Containment Verification
**File**: `containment.html`

Verification that larger zoom levels properly contain smaller zoom levels.

**Validation Points**:
- Which Zoom 20 voxel contains each Zoom 25 voxel
- Which Zoom 25 voxel contains each Zoom 30 voxel
- Correctness of Spatial ID hierarchy

**How to Use**:
1. Open `containment.html` in browser
2. Select "Parent Zoom" and "Child Zoom"
3. Click "Verify" button
4. Check containment results (green=valid, red=invalid)

### Technical Specifications

#### Data Generation Area
- **Center**: Shinjuku Station area (139.7°E, 35.69°N)
- **Extent**: 0.02° lon × 0.02° lat × 0-200m alt
- **Entity Count**: 100 entities (default)

#### Zoom Level vs Cell Size

| Zoom | Cell Size (equator) | Shinjuku area | Est. Voxels |
|------|---------------------|---------------|-------------|
| 15   | ~1220 m             | ~1000 m       | Few         |
| 20   | ~38 m               | ~31 m         | Tens        |
| 25   | ~1.2 m              | ~1 m          | Hundreds    |
| 30   | ~3.7 cm             | ~3 cm         | Thousands   |

### Troubleshooting

**Q: Voxels not displayed in Spatial ID mode**
- Verify `ouranos-gex-lib-for-javascript` is installed
- Check browser console for fallback messages
- Built-in Web Mercator conversion is used during fallback

**Q: Performance degradation at high zoom levels**
- Set limit with `maxRenderVoxels` option
- Use `renderLimitStrategy: 'density'` for density-order rendering
- Try lower zoom levels

**Q: Anomalies detected in containment verification**
- Possible false positives from rounding errors near boundaries
- Perfect containment may not be guaranteed in fallback mode

