# Advanced Examples Index / 上級例索引

> v0.1.16 以降、上級例はカテゴリ別ディレクトリに再編されました。ここでは各カテゴリと代表的なファイルへのリンクをまとめています。

## Category Index / カテゴリ一覧

| Category / カテゴリ | Directory | 主なファイル / Key Files |
| --- | --- | --- |
| Observability（観測可能性・メトリクス） | `../observability/` | `performance-overlay-demo.html`, `adaptive-phase3-demo.html` |
| Rendering（描画モード・高さ表現） | `../rendering/` | `wireframe-height-demo-umd.html`, `wireframe-height-demo.js`, `v0.1.12-features-demo.html` |
| Classification（分類エンジン） | `.` | `classification-demo.html` *(v1.0.0 新規)* |
| Outlines（枠線・エミュレーション） | `../outlines/` | `outline-overlap-demo-umd.html`, `emulation-scope-demo.html` *(new)* |
| Selection & Limits（選択戦略・描画上限） | `../selection-limits/` | `adaptive-rendering-demo.html`, `adaptive-rendering-demo.js`, `performance-optimization.js`, `selection-strategy-demo.html` *(new)* |
| Data（データ生成・フィルタリング） | `../data/` | `entity-filtering.js` |

## Usage Notes / 利用時の注意

- すべての HTML 例は **Cesium Ion を無効化** し、OSM/Carto ベースマップと `EllipsoidTerrainProvider` を既定で使用します（黒画面対策）。
- Ion ベースのアセットを利用する場合は、`Cesium.Ion.defaultAccessToken` を公開トークンで明示設定してください。設定がない場合でも OSM/エリプソイドにフォールバックします。
- 各カテゴリには README を配置し、目的・主要オプション・補足情報（ヒント/落とし穴）を日英併記でまとめています。
- UMD デモ (`*-umd.html`) はブラウザで直接開けます。モジュール形式の例は `npm install` 後に `npm run dev` でローカルサーバーを立ち上げるか、`npx http-server` 等で公開して動作を確認してください。

## Related Documentation / 関連ドキュメント

- ADR-0012（v0.1.16 Examples 体系化・整理）
- ROADMAP v0.1.16 チェックリスト
- Playground（`gh-pages` ブランチ）でのベース設定例
