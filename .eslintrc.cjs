module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:import/recommended'],
  rules: {
    // Disallow direct imports of ethers library from arbitrary modules.
  // Developers should use the on-chain wrapper in `src/web3/ethersWeb3.ts` (alias `@onchain/ethersWeb3`).
    'no-restricted-imports': [
      'error',
      {
        'paths': [
          {
            'name': 'ethers',
            'message': "Import 'ethers' only from the on-chain adapter (src/web3/ethersWeb3.ts or @onchain/ethersWeb3) and avoid direct usage in DB/REST modules."
          }
        ],
        'patterns': [
          {
            'group': ["@/components/figma/ui/*"],
            'message': "Import UI primitives only from '@/components/ui/*'. Direct imports from '@/components/figma/ui/*' are restricted — use the adapter files in 'src/components/ui/**' instead.",
            'allowTypeImports': false
          }
        ]
      }
    ],

    // Keep other rules permissive for incremental cleanup.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  }
};

// Allow adapter files to import directly from the figma primitives
module.exports.overrides = [
  {
    files: ["src/components/ui/**"],
    rules: {
      'no-restricted-imports': 'off'
    }
  }
]

// Add import/no-restricted-paths restrictions for presentational UI
module.exports.rules = module.exports.rules || {};
module.exports.rules['import/no-restricted-paths'] = [
  'error',
  {
    zones: [
      {
        target: './src/ui',
        from: './src/services',
        message: 'Presentational UI under src/ui must not import from src/services (use injected props or context).'
      },
      {
        target: './src/ui',
        from: './src/store',
        message: 'Presentational UI under src/ui must not import from src/store (use container components).'
      }
    ]
  }
];
