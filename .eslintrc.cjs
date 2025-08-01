/* eslint-env node */

/**
 * The layering rule (blueprint §3.1) is enforced here and nowhere else.
 * Imports point DOWN: router -> pages -> components -> hooks -> queries -> endpoints ->
 * client -> http -> errors/contracts. Two files break it on purpose and carry an inline
 * disable with a ticket reference. If you are adding a third, open a ticket first.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh', 'jsx-a11y', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    'public/mockServiceWorker.js',
    'src/api/openapi/*.json',
    '.eslintrc.cjs',
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // a11y is not advisory here. Tal will send it back.
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-autofocus': 'error',

    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [{ pattern: '@payzeno/contracts', group: 'external', position: 'after' }],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // One config read surface. import.meta.env is legal in src/config/env.ts only —
    // the override below re-permits it there.
    'no-restricted-properties': [
      'error',
      {
        object: 'import',
        property: 'meta',
        message: 'Read configuration through src/config/env.ts. See ADR 0002.',
      },
    ],

    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='fetch']",
        message:
          'The only fetch() in this repo lives in src/api/http/fetch-transport.ts. Go through an endpoint.',
      },
    ],
  },
  overrides: [
    {
      // components/ is a leaf. It may not reach up into features/ or sideways into api/.
      files: ['src/components/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@features/*', '**/features/*', '@api/*', '**/api/*'],
                message:
                  'components/ is presentational. Pass data in as props. (Two grandfathered exceptions carry an inline disable.)',
              },
            ],
          },
        ],
      },
    },
    {
      // Only queries files may hold an endpoint. Hooks go through the queries factory.
      files: ['src/features/**/use*.ts', 'src/features/**/use*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@api/endpoints/*', '**/api/endpoints/*'],
                message:
                  'Hooks call <feature>.queries.ts, which is the only caller of an endpoint. See ADR 0004.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/config/env.ts', 'src/vite-env.d.ts'],
      rules: { 'no-restricted-properties': 'off' },
    },
    {
      files: ['src/api/http/fetch-transport.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      files: ['src/api/legacy/**/*.ts'],
      rules: {
        // Pre-ADR-0004 code. Frozen, not fixed. Do not add files here.
        'no-restricted-syntax': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      files: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**/*.{ts,tsx}'],
      extends: ['plugin:testing-library/react'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-restricted-imports': 'off',
      },
    },
  ],
};
