/**
 * Logging utility.
 * NODE_ENV and debug flags control the log level.
 * ログ出力制御ユーティリティ。NODE_ENV や debug フラグによってログレベルを制御します。
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
