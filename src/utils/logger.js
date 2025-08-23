/**
 * ログ出力制御ユーティリティ
 * NODE_ENVやdebugフラグによってログレベルを制御
 */

/**
 * ログレベル定数
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * 現在のログレベルを決定
 * NODE_ENV=production では ERROR と WARN のみ
 * DEBUG=true または NODE_ENV=development では全レベル出力
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
 * ログ出力の共通ユーティリティ
 */
export const Logger = {
  /**
   * エラーログ（常に出力）
   * @param {...any} args - ログ引数
   */
  error(...args) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error('[Heatbox ERROR]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * 警告ログ
   * @param {...any} args - ログ引数
   */
  warn(...args) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn('[Heatbox WARN]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * 情報ログ
   * @param {...any} args - ログ引数
   */
  info(...args) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log('[Heatbox INFO]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * デバッグログ
   * @param {...any} args - ログ引数
   */
  debug(...args) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log('[Heatbox DEBUG]', ...args); // eslint-disable-line no-console
    }
  },

  /**
   * オプション設定によるログレベル制御
   * @param {Object} options - オプション
   */
  setLogLevel(options) {
    if (options && typeof options.debug === 'boolean') {
      // debug: true → 詳細ログ、debug: false → 重要ログのみ
      currentLogLevel = options.debug ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    }
    return currentLogLevel;
  }
};

/**
 * 下位互換のためのラッパー関数群
 * 既存のconsole.log置き換え用
 */
export const log = Logger.debug;
export const warn = Logger.warn;
export const error = Logger.error;
export const info = Logger.info;
