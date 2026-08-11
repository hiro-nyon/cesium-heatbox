describe('Logger', () => {
  function loadFreshLogger() {
    let logger;
    jest.isolateModules(() => {
      ({ Logger: logger } = require('../../src/utils/logger.js'));
    });
    return logger;
  }

  test('debug設定に応じて全ログと重要ログを切り替える', () => {
    const logger = loadFreshLogger();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.setLogLevel({ debug: true });
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    logger.setLogLevel({ debug: false });
    logger.debug('hidden debug');
    logger.info('hidden info');
    logger.warn('visible warn');

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  test('object形式のdebug設定は詳細ログを有効にする', () => {
    const logger = loadFreshLogger();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.setLogLevel({ debug: { showBounds: true } });
    logger.debug('visible');

    expect(logSpy).toHaveBeenCalledWith('[Heatbox DEBUG]', 'visible');
  });
});
