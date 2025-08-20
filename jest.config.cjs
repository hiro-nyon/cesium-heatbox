module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/setup.js'],
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
    '^cesium$': '<rootDir>/test/__mocks__/cesium.js'
  },
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
