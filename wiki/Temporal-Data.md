# Temporal Data / 時系列データ

**日本語** | [English](#english)

## 日本語

### 概要
Heatbox v1.2.0 では `temporal` オプションを指定するだけで Cesium の `viewer.clock` と自動連携し、時間帯ごとに異なるヒートマップを再生できます。`TimeController` が `clock.onTick` を監視し、エントリーが変わったタイミングでだけ `setData()` を呼び出すため、毎フレームの再計算や手動スロットリングは不要です。

### オプション一覧
- `temporal.enabled` — true で時間依存モードを有効化（`updateOptions` でも切替可能）
- `temporal.data` — `{ start, stop, data }` の配列。`data` には通常の `setData()` と同じエンティティ配列を渡します
- `classificationScope` — `'global'` は全期間共通、`'per-time'` は時点ごとに統計量を再計算
- `updateInterval` — `'frame'` またはミリ秒値。値を大きくすると更新頻度を抑制
- `outOfRangeBehavior` — `'hold'`（既定）か `'clear'`。Clock が範囲外にいるときの表示制御
- `overlapResolution` — `'prefer-earlier'`（既定）/`'prefer-later'`/`'skip'`。時間帯が重なるデータの扱い

### データ準備の手順
1. **時刻の正規化**: 生データの timestamp を ISO8601 または JulianDate に揃える  
2. **スライス分割**: `[{ start, stop, data: Cesium.Entity[] }]` 形式で配列化  
3. **重複対策**: 時間が重なる場合は `overlapResolution` の方針（早い方/遅い方/エラー）を決める  
4. **Clock設定**: `viewer.clock.startTime/stopTime/currentTime` をデータ範囲に合わせ、`clockRange = Cesium.ClockRange.LOOP_STOP` などで挙動を定義

### 使用例
```javascript
const slices = buildSlices(); // 24エントリーなど
const heatbox = new Heatbox(viewer, {
  voxelSize: 40,
  temporal: {
    enabled: true,
    data: slices,
    classificationScope: 'global',
    updateInterval: 200,
    outOfRangeBehavior: 'clear',
    overlapResolution: 'prefer-later'
  }
});

viewer.clock.startTime = Cesium.JulianDate.fromIso8601(slices[0].start);
viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(slices.at(-1).stop);
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = 600;
viewer.clock.shouldAnimate = true;
```

### ベストプラクティス
- **データサイズ**: 1スライスあたり 1,000〜2,000 エンティティを目安に調整（必要に応じて `maxRenderVoxels` で抑制）
- **スロットリング**: ランダムアクセスが多い UI（スクラバー等）では `updateInterval: 0` 相当の `'frame'` を指定し、通常再生では 100〜250ms が推奨
- **統計スコープ**: 時刻間の絶対比較をしたい場合は `'global'`、その瞬間のコントラストを最大化したい場合は `'per-time'`
- **監視**: `heatbox.getStatistics()` は従来どおり取得可能。`_externalStats` を渡している場合でも `classification.domain` はグローバル値で固定されます

---

## English

### Overview
Heatbox 1.2.0 ships with a built-in `TimeController` that synchronizes with `viewer.clock`. Provide ordered slices via the `temporal` option and Heatbox will automatically call `setData()` only when the active slice changes, eliminating manual `onTick` handlers and ad-hoc throttling.

### Options
- `temporal.enabled` — enable/disable temporal mode (can be toggled through `updateOptions`)
- `temporal.data` — array of `{ start, stop, data }` slices using Cesium entities
- `classificationScope` — `'global'` shares statistics across the entire timeline, `'per-time'` recomputes per slice
- `updateInterval` — `'frame'` or a millisecond interval for throttling
- `outOfRangeBehavior` — `'hold'` (keep last frame) or `'clear'`
- `overlapResolution` — `'prefer-earlier'`, `'prefer-later'`, or `'skip'` to control overlapping intervals

### Preparation Checklist
1. Normalize timestamps to ISO8601/JulianDate  
2. Chunk your entities per time window and store them as slices  
3. Decide how to resolve overlaps via `overlapResolution`  
4. Configure `viewer.clock` (start/stop/current time, multiplier, loop range) to match your dataset

### Example
```javascript
const slices = buildSlices();
const heatbox = new Heatbox(viewer, {
  voxelSize: 40,
  temporal: {
    enabled: true,
    data: slices,
    classificationScope: 'per-time',
    updateInterval: 150,
    outOfRangeBehavior: 'hold',
    overlapResolution: 'prefer-earlier'
  }
});

viewer.clock.startTime = Cesium.JulianDate.fromIso8601(slices[0].start);
viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(slices.at(-1).stop);
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = 900;
viewer.clock.shouldAnimate = true;
```

### Tips
- Target ~1k entities per slice; rely on `maxRenderVoxels` and `renderLimitStrategy` if your slices are heavier
- Use `'frame'` updates for scrubber-heavy UX, otherwise throttle with 100–250 ms
- Toggle scopes via `heatbox.updateOptions({ temporal: { classificationScope: 'global' } })` to reuse the same Heatbox instance
- When `outOfRangeBehavior: 'clear'`, ensure your Cesium clock range eventually leaves the dataset to avoid stale overlays
