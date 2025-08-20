# Release Notes

最新の変更はリポジトリの `CHANGELOG.md` を参照してください。ここでは主要トピックを抜粋します。

## 0.1.1 (2025-10-05)
- **レンダリング実装の変更**: PrimitiveベースからEntityベースへ移行
- **互換性の向上**: Cesium 1.132との完全互換性を確保
- **エラー処理の強化**: エンティティの削除と表示/非表示切り替えでのエラー処理改善
- **デバッグ支援**: バウンディングボックス表示と詳細ログ出力

## 0.1.0 (2025-09-15)
- 安定版リリース（alpha から移行）
- CI（GitHub Actions）導入、ツリーシェイキング対応
- README/設定の整理、重複設定の解消

## 0.1.0-alpha.3
- 新規 API 追加: `createFromEntities`, `getOptions`, `getDebugInfo`, `Heatbox.filterEntities`
- Jest 設定の安定化、JSDoc/型定義生成スクリプト整備
- ESM/UMD エントリーポイント整理、外部モジュール扱い調整

## 0.1.0-alpha.2 / alpha.1
- 初期実装、基本ボクセル可視化と統計
- 仕様・開発ガイド・クイックスタートの追加

> 詳細は `CHANGELOG.md` を参照してください。
