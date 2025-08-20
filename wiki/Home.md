# CesiumJS Heatbox Wiki

> **⚠️ 重要な注意**: このライブラリは現在npm未登録です。GitHubから直接ダウンロードしてご利用ください。

CesiumJS Heatbox は、CesiumJS 上の既存 Entity を対象に、3D ボクセルで密度を可視化するヒートマップライブラリです。エンティティ分布から自動で範囲を推定し、最小限のボクセル数で効率よく描画します。

## 主要機能
- エンティティ連携: `viewer.entities` から自動集計
- 自動範囲設定: 分布に基づく立方体範囲の推定
- ボクセル最適化: 範囲を内包する最少ボクセル数で生成
- 相対色分け: データ内 min/max に応じた動的カラー
- パフォーマンス配慮: バッチ描画と描画上限制御

## クイックリンク
- Getting Started: [[Getting-Started]]
- Quick Start: [[Quick-Start]]
- API リファレンス: [[API-Reference]]
- サンプルと使い方: [[Examples]]
- トラブルシューティング: [[Troubleshooting]]
- アーキテクチャ: [[Architecture]]
- 開発ガイド: [[Development-Guide]]
- コントリビュート: [[Contributing]]
- リリースノート: [[Release-Notes]]

## インストール
```
npm install cesium cesium-heatbox
```

## 対応環境
- Cesium: `^1.120.0`（peer dependency）
- Node.js: `>=18`
- ブラウザ: 最新のモダンブラウザ（WebGL 必須）

## 最小コード例
```javascript
import Heatbox from 'cesium-heatbox';

const heatbox = new Heatbox(viewer, {
  voxelSize: 20,
  opacity: 0.8,
});

const entities = viewer.entities.values;
const stats = await heatbox.createFromEntities(entities);
console.log(stats);
```

> 補足: UMD 版は `CesiumHeatbox` として参照可能です。
