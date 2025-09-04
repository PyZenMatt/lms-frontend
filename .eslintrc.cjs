module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
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
