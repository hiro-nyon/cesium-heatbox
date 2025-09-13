module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/setup.js'],
  // CI環境でのログ出力制御: console.warn/errorを無効化
  silent: Boolean(process.env.CI || process.env.GITHUB_ACTIONS),
  verbose: !Boolean(process.env.CI || process.env.GITHUB_ACTIONS),
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
    '^cesium$': '<rootDir>/test/__mocks__/cesium.js'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/performance/heatbox-v0.1.9-performance.test.js',
    // Phase 4 perf smoke tests are environment-sensitive; exclude from default CI/unit runs
    '/test/performance/performance-regression.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/utils/sampleData.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/test/**/*.{test,spec}.js'
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
