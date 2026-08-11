const isCoverageRun = process.argv.includes('--coverage');

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
    // Long-running performance regression smoke test remains opt-in.
    '/test/performance/performance-regression.test.js',
    // Istanbul instrumentation distorts wall-clock microbenchmarks.
    ...(isCoverageRun ? [
      '/test/performance/classification-performance.test.js',
      '/test/performance/aggregation-performance.test.js'
    ] : [])
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
