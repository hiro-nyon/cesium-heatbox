# ADR-0005: 適応的枠線制御とエミュレーション専用表示モード（v0.1.7）

## Status
Proposed (for v0.1.7)

## Context
- v0.1.6 では枠線重なり対策（voxelGap/outlineOpacity/outlineWidthResolver）と二極性配色、TopN強調を実装。
- v0.1.6.1 ではインセット枠線（outlineInset/outlineInsetMode）を導入。
- v0.1.6.2 では太線エミュレーション（WebGL線幅制限の回避）を「外縁とインセットの中間位置」ポリラインで改善し、隣接ボクセルとの重なりを軽減。
- 実運用では、データの密/疎・ズーム・強調対象（TopN/選択）など「場面」によって、最適な見せ方（太さ/透明度/位置/手段）が動的に変わる。

→ 0.1.7 では「適応的表示（Adaptive Outlines）」を核に、太枠エミュレーションを含む枠線手段を状況に応じて自動制御し、さらに「エミュレーション専用表示モード（標準枠線/インセットなし）」を提供する。

## Decision
1) 表示モードの拡張（互換維持）
- `outlineRenderMode: 'standard' | 'inset' | 'emulation-only'` を導入（デフォルト: 'standard'）
  - standard: 既存の `box.outline` + 必要に応じて `outlineInset` を併用
  - inset: インセット（二重Box）を主に使用。`box.outline` は用途に応じてON/OFF
  - emulation-only: `box.outline` とインセットBoxを出さず、太枠エミュ（中間位置ポリライン）だけで枠線を描画

2) 適応的枠線制御（Adaptive Outlines）
- 代表的な入力シグナルを組み合わせ、枠線の見せ方を自動調整：
  - 近傍密度（一定半径 or 近傍数）
  - TopN/選択/注目フラグ
  - カメラ距離（ピクセル密度）
  - 重なりリスク（隣接線の接触しやすさ）
- 自動調整の対象：
  - 枠線の太さ（outlineWidthResolver）
  - 透明度：
    - ボックス塗り用 `boxOpacityResolver: (ctx) => number(0–1)`
    - 枠線用 `outlineOpacityResolver: (ctx) => number(0–1)`（標準枠線/インセット/エミュに適用）
    - 既存 `outlineOpacity` はフォールバック固定値（resolverが優先）
  - インセット量（outlineInset の微調整）
  - 太枠エミュレーションのON/OFF（および太さ）
- ユーザーが簡易に選べるプリセット：
  - `outlineWidthPreset: 'adaptive-density'|'topn-focus'|'uniform'`

3) 優先順位とフォールバック
- 優先度1: ユーザーが `outlineWidthResolver` を与えた場合はそれを尊重（適応ロジックは係数/クランプで補助）
- 優先度2: プリセット指定時はプリセット→適応ヒューリスティクスの順
- 優先度3: いずれも指定なしの場合、既定の適応ヒューリスティクスを適用
- 透明度は `boxOpacityResolver` / `outlineOpacityResolver` があればそれを優先、なければ固定 `opacity` / `outlineOpacity` を使用
- いかなる場合も、性能・視認性の安全域（太さ/インセット/透明度のクランプ）は保持

## Alternatives Considered
- 枠線をShaderやPrimitiveで一から描く：柔軟だが0.1系のスコープ外。将来の0.4系で検討。
- 常に太枠エミュを使う：重なりが解消されても遠景で太すぎ/情報過多になりやすい。適応的に使い分ける方が視認性が安定。

## Interactions
- `voxelGap`: 重なり/ちらつき軽減に有効。適応的にギャップを増やすのは0.1系では見送り、チューニングガイドで案内。
- `outlineOpacity`: 密集時にうっすら抑えるなど、適応の調整対象。resolverが指定されていればresolver優先。
- `outlineInset`: 重なりリスクが高いときに少し増やす。上限は片側20%（両側40%）。
- `outlineEmulation`: 0.1.6.2 の中間位置ポリラインを用い、適応的にON/OFF。emulation-onlyでは常時ON。
- `highlightTopN`: 優先表示（太く）を適応ロジックで尊重。
- `wireframeOnly`: 表示モードと排他ではないが、0.1系では `emulation-only` と併用の優先度を明記（emulation優先）。

## Constraints
- 0.1系ではEntityベースで実装（エンジン側の線幅制限に注意）。
- 太枠エミュは「外縁とインセットの中間位置」で描画し、隣接線の重なりを軽減。
- 適応ロジックのオーバーヘッドは <5% を目標（事前計算/キャッシュを活用）。
- 透明度/インセット/太さは安全域でクランプ（透明度0–1、インセット0–100mかつ片側20%以内、太さは0.5–N）。
- 透明度resolverは NaN/無効値を許容せず、フォールバック固定値に切り替える。

## Acceptance Criteria
- 視認性：密集/疎/混在のサンプルで、一律表示よりも読みやすくなる（TopN/選択が埋もれない）。
- 性能：1000–5000ボクセル規模でのオーバーヘッド<5%。
- 安定性：複数回の描画/再設定でエンティティリークなし。ちらつき/重なり発生が減少。
- 使い勝手：Examplesに「適応的表示」UIと「エミュレーション専用」トグルを追加。プリセットで即時試せる。
- ドキュメント：API（新オプションと優先順位）、ガイド（チューニング手順）、FAQ（重なり/ちらつき対策）を整備。
 - 透明度：fill/outline/inset/エミュの全対象で resolver の効果が期待どおり反映し、0–1 クランプが保証される。

## Rollout Plan
- 0.1.7 で導入。デフォルトは互換（standard）。
- `outlineRenderMode` 追加（'standard'|'inset'|'emulation-only'）。
- 適応ロジックはオプトイン（例: `adaptiveOutlines: true`）とし、プリセットで簡単に有効化。
- Examples/Wikiのチュートリアルで導入方法とチューニングを案内。

## Open Questions
- `adaptiveOutlines` の構成パラメータ（近傍半径・しきい値・ズーム補正係数）のデフォルト値と露出範囲。
- `outlineRenderMode` の名称：将来の拡張（primitive/backend切替）を見据えた命名にするか。
- CIでの視認性の自動検証の方法（画像比較 or 数量化指標）。
