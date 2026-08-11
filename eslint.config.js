import antfu from '@antfu/eslint-config'

const ignores = [
  '.nuxt',
  '**/.nuxt/**',
  '.output',
  '**/.output/**',
  'node_modules',
  '**/node_modules/**',
  'public',
  '**/public/**',
]

export default antfu({
  // .eslintignore is no longer supported in Flat config, use ignores instead
  ignores,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  vue: true,
  jsonc: false,
  yaml: false,
  rules: {
    'no-console': ['error', {
      allow: ['info', 'warn', 'trace', 'error', 'group', 'groupEnd'],
    }],
    'style/comma-dangle': 'off',
    'curly': ['error', 'all'],
    'node/prefer-global/process': ['error', 'always'],
  },
}, {
  files: ['test/**/*.ts'],
  rules: {
    // Test titles name HTTP verbs and components — `POST /api/...` and
    // `AppHeader` read correctly; the autofix turns them into `pOST`/`appHeader`.
    'test/prefer-lowercase-title': 'off',
  },
})
