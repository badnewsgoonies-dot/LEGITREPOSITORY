module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Ban Math.random and Date.now in core game logic files
      files: ['src/core/**/*.ts', 'src/state/**/*.ts'],
      rules: {
        'no-restricted-globals': [
          'error',
          {
            name: 'Math.random',
            message: 'Use deterministic RNG from src/core/rng.ts instead of Math.random()',
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'MemberExpression[object.name="Math"][property.name="random"]',
            message: 'Use deterministic RNG from src/core/rng.ts instead of Math.random()',
          },
          {
            selector: 'MemberExpression[object.name="Date"][property.name="now"]',
            message: 'Use performance.now() or passed time instead of Date.now() in core logic',
          },
        ],
      },
    },
  ],
}
