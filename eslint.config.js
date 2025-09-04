import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    rules: {
      // Prevent accidental on-chain balance reads from FE services.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@onchain/ethersWeb3', message: 'Do not import on-chain read helpers; use DB via services/wallet.ts' },
            { name: '@onchain/web3', message: 'Do not import on-chain read helpers; use DB via services/wallet.ts' }
          ],
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
