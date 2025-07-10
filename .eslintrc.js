module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    webextensions: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    
    // General
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Chrome Extension specific
    'no-undef': 'off' // TypeScript handles this better
  },
  globals: {
    chrome: 'readonly',
    browser: 'readonly'
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'public/**/*',
    '*.js'
  ]
}; 