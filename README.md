Frontend — React + Vite + TypeScript

Overview & prerequisites
------------------------
- Node LTS recommended (v18+). npm/yarn/pnpm supported.
- This frontend talks to the Django/DRF backend via `/api/...` endpoints. Auth is JWT-based unless backend exposes httpOnly cookies.

Quickstart (dev)
-----------------
1. From repo root: cd `lms-frontend`
2. Install deps: `npm ci` (or `pnpm install` / `yarn`)
3. Start dev server: `npm run dev` — default URL: `http://localhost:5173`
4. Open the app and authenticate against the backend (see Auth section).

Build & preview
----------------
1. Build: `npm run build` → outputs `dist/`.
2. Preview locally: `npm run preview` (serves the built `dist/`).

Deploy options
--------------
Static hosting (GitHub Pages / Cloudflare Pages / Netlify)
- Upload the `dist/` folder.
- Configure SPA fallback: route 404 → `index.html` to enable client-side routing.
- Set cache headers: long cache for hashed assets, short/no-cache for `index.html`.

Served by backend (Whitenoise)
- Copy contents of `dist/` into backend static folder (or configure your build pipeline to copy at deploy).
- Run `collectstatic` if using WhiteNoise + Django staticfiles.

Structure & conventions
-----------------------
- `src/components/` — small, reusable presentational components.
- `src/pages/` — route-level pages (mapped in router).
- `src/routes/` — routing definitions and lazy-loading.
- `src/hooks/` — reusable hooks (useAuth, useCart, useFetch).
- `src/services/` — API clients, Stripe helpers, abstraction over fetch/axios.
- `src/store/` — global state (if used: Redux/Zustand/React Query usage documented here).
- `src/types/` — shared TypeScript types for API responses and domain objects.
- `src/utils/`, `src/assets/`, `src/styles/` — helpers, static assets, styles.

Env & config (Vite)
-------------------
- Vite exposes only env variables prefixed with `VITE_` at build time. Do not put secrets here.
- Minimal `.env` variables (see `lms-frontend/.env.example`):
  - `VITE_API_URL` — e.g. `http://localhost:8000/api/v1`
  - `VITE_STRIPE_PUBLISHABLE_KEY` — public key for Stripe client
  - `VITE_ENV` — dev|staging|prod
  - `VITE_FEATURE_DISCOUNTS` — example feature flag
  - `VITE_SENTRY_DSN` — optional

Auth & API integration
-----------------------
- Prefer server-set httpOnly cookies for auth if backend supports it.
- If storing tokens in the client, prefer in-memory + refresh token rotation; LocalStorage increases XSS risk.
- Base HTTP client: centralize baseURL, timeout and interceptors in `src/services/api.ts`.
- 401 handling: interceptor attempts token refresh once, then routes to login if refresh fails; avoid infinite loops.

Stripe integration (FE responsibilities)
--------------------------------------
- Mode: this repo uses Stripe Checkout (redirect) by default; if Elements is used, initialization happens in `src/services/stripe.ts`.
- Only the publishable key (`VITE_STRIPE_PUBLISHABLE_KEY`) is exposed to the client. All settlement logic and wallet updates are performed server-side.
- Errors & edge cases: show user-friendly messages on payment failures and keep server logs authoritative.

Quality & tooling
-----------------
- Lint: `npm run lint`
- Format: `npm run format` (pre-commit hooks may run via Husky)
- Tests: `npm run test` (unit/RTL) — ensure CI runs these.

Troubleshooting (common FE issues)
----------------------------------
- CORS errors: ensure `VITE_API_URL` origin is on backend `CORS_ALLOWED_ORIGINS`.
- `.env` not applied: Vite reads env at build start; restart dev server after edits.
- 404 on refresh (static host): configure SPA fallback to `index.html`.
- Stripe key missing: ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set; build-time only.
- Auth 401 loops: check refresh token flow and interceptor logic.
- Clock skew issues: ensure server and client times are reasonable for exp checks.

Links
-----
- Backend payments README: `../apps/payments/README.md`
- Backend users README: `../apps/users/README.md`

Owner & last updated
--------------------
- Owner: frontend team / repo maintainer (add actual owner)
- Last updated: 2025-09-11
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
