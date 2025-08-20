module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'jest'
  ],
  rules: {
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    // Codebase uses semicolons; align rules accordingly
    'semi': ['error', 'always'],
    'space-before-function-paren': 'off',
    'padded-blocks': 'off',
    'no-trailing-spaces': 'off',
    // TypeScript rules (applied when TS files exist)
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // Jest
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
  globals: {
    Cesium: 'readonly'
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      env: { jest: true, node: true, browser: false },
      globals: { testUtils: 'readonly' },
      rules: {
        'no-new': 'off',
        'no-console': 'off',
        'no-multiple-empty-lines': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'types/',
    'coverage/',
    'node_modules/',
    '*.min.js'
  ]
};
