# Class: PerformanceOverlay（PerformanceOverlayクラス）

**日本語** | [English](#english)

## English

Performance Overlay UI component

### Constructor

#### new PerformanceOverlay(options)

### Methods

#### destroy()

Destroy overlay

#### hide()

Hide overlay

#### show()

Show overlay

#### startAutoUpdate()

Start automatic updates

#### stopAutoUpdate()

Stop automatic updates

#### toggle()

Toggle visibility

#### update(stats, frameTimeopt)

Update overlay content with statistics

| Name | Type | Attributes | Description |
|---|---|---|---|
| stats | Object |  | Performance statistics / パフォーマンス統計 |
| frameTime | number | <optional> | Frame time in ms / フレーム時間（ミリ秒） |


## 日本語

パフォーマンスオーバーレイUIコンポーネント

### コンストラクタ

#### new PerformanceOverlay(options)

### メソッド

#### destroy()

オーバーレイを破棄

#### hide()

オーバーレイを非表示

#### show()

オーバーレイを表示

#### startAutoUpdate()

自動更新を開始

#### stopAutoUpdate()

自動更新を停止

#### toggle()

表示/非表示を切り替え

#### update(stats, frameTimeopt)

統計情報でオーバーレイ内容を更新

| 名前 | 型 | 属性 | 説明 |
|---|---|---|---|
| stats | Object |  | Performance statistics / パフォーマンス統計 |
| frameTime | number | <optional> | Frame time in ms / フレーム時間（ミリ秒） |
