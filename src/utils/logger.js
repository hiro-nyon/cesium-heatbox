/**
 * Comprehensive logging utility with configurable levels and environment-aware output.
 * 設定可能なレベルと環境対応出力を備えた包括的ログユーティリティ。
 * 
 * This logging system provides intelligent log level management based on environment
 * variables (NODE_ENV, DEBUG) and runtime configuration. Supports multiple log levels
 * (ERROR, WARN, INFO, DEBUG) with automatic filtering based on production vs development
 * environments. Essential for debugging and monitoring heatbox operations.
 * 
 * このログシステムは、環境変数（NODE_ENV、DEBUG）と実行時設定に基づく
 * インテリジェントなログレベル管理を提供します。複数のログレベル
 * （ERROR、WARN、INFO、DEBUG）をサポートし、本番環境vs開発環境に基づく
 * 自動フィルタリングを行います。ヒートボックス操作のデバッグと監視に必須です。
 * 
 * @namespace Logger
 * @since v0.1.0
 * @version 1.2.0 - Enhanced environment detection and configuration support
 */

/**
 * Log level constants.
 * ログレベル定数。
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Determine current log level.
 * 現在のログレベルを決定します。
 * NODE_ENV=production では ERROR と WARN のみ、DEBUG=true または NODE_ENV=development では全レベル出力。
 */
function getLogLevel() {
  // 明示的にDEBUG=trueが設定されている場合
  if (typeof process !== 'undefined' && process.env && process.env.DEBUG === 'true') {
    return LOG_LEVELS.DEBUG;
  }
  
  // NODE_ENVをチェック
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return LOG_LEVELS.WARN;
  }
  
  // デフォルトは開発モード（全ログ出力）
  return LOG_LEVELS.DEBUG;
}

let currentLogLevel = getLogLevel();

/**
 * Common logging utility.
 * ログ出力の共通ユーティリティ。
 */
export const Logger = {
  /**
   * Error log (always output).
   * エラーログ（常に出力）。
   * @param {...any} args - Log arguments / ログ引数
   */
  error(...args) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error('[Heatbox ERROR]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * Warning log.
   * 警告ログ。
   * @param {...any} args - Log arguments / ログ引数
   */
  warn(...args) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn('[Heatbox WARN]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * Info log.
   * 情報ログ。
   * @param {...any} args - Log arguments / ログ引数
   */
  info(...args) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log('[Heatbox INFO]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * Debug log.
   * デバッグログ。
   * @param {...any} args - Log arguments / ログ引数
   */
  debug(...args) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log('[Heatbox DEBUG]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * Control log level by options.
   * オプション設定によるログレベル制御。
   * v0.1.5: debug オプションがオブジェクトの場合に対応。
   * @param {Object} options - Options / オプション
   */
  setLogLevel(options) {
    if (options && options.debug !== undefined) {
      if (typeof options.debug === 'boolean') {
        // debug: true → 詳細ログ、debug: false → 重要ログのみ
        currentLogLevel = options.debug ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
      } else if (typeof options.debug === 'object' && options.debug !== null) {
        // オブジェクトの場合はログレベルをDEBUGに設定（境界表示制御は別途処理）
        currentLogLevel = LOG_LEVELS.DEBUG;
      }
    }
    return currentLogLevel;
  }
};

/**
 * Wrapper functions for backward compatibility.
 * 既存の console.log 置き換え用のラッパー関数群。
 */
export const log = Logger.debug;
export const warn = Logger.warn;
export const error = Logger.error;
export const info = Logger.info;
