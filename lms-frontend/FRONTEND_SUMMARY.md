```json
{
  "version": "1.1",
  "updated_at": "2025-08-26T14:30:00+02:00",
  "app_name": "SchoolPlatform Frontend",
  "stack": ["React", "Vite", "TypeScript", "Tailwind"],
  "node": ">=18",
  "vite": "^7.1.2",
  "typescript": "~5.8.3",
  "tailwind": "^4.1.12",
  "aliases": ["@/*"],
  "env_keys": ["VITE_API_BASE_URL", "VITE_STRIPE_PUBLISHABLE_KEY"],
  "routes_count": 38,
  "pages_count": 28,
  "services_count": 12
}
```

# Indice

- [Indice](#indice)
  - [Panoramica rapida](#panoramica-rapida)
  - [Struttura progetto (tree)](#struttura-progetto-tree)
  - [Build \& toolchain](#build--toolchain)
  - [Styling \& Design System](#styling--design-system)
  - [Layout \& Shell](#layout--shell)
  - [Routing](#routing)
  - [Pagine principali](#pagine-principali)
  - [Servizi/API](#serviziapi)
  - [Stato \& Context](#stato--context)
  - [Utilità condivise](#utilità-condivise)
  - [Ambienti \& .env](#ambienti--env)
  - [Check di sanità (DX)](#check-di-sanità-dx)
  - [Divergenze \& TODO](#divergenze--todo)
  - [Changelog](#changelog)
  - [Refactor: UI primitives replacement status (2025-08-26)](#refactor-ui-primitives-replacement-status-2025-08-26)

## Panoramica rapida

- App front-end di tipo SPA: React + Vite + TypeScript + Tailwind.
- Routing con `react-router-dom` v7; layout shell (`AppLayoutRoute`), protezioni con `ProtectedRoute` e `RoleRoute`.
- Design tokens centralizzati via CSS custom properties + `tailwind.config.js` che mappa i token.
- API wrapper `src/lib/api.ts` espone `api` e `apiFetch`, gestisce SimpleJWT refresh, emette eventi globali `api:loading` / `api:error` e usa localStorage per i token.
- Pagina di checkout usa Stripe (Elements) e flussi ibridi con TeoCoin per sconti.

## Struttura progetto (tree)

(Albero fino a 4 livelli sotto `src/` — rami principali rilevanti)

```
src/
  api.ts
  main.tsx
  App.tsx
  index.css
  components/
    checkout/
      ReceiptCard.tsx
      TeoDiscountWidget.tsx
    teo/
      TeoDiscountWidget.tsx  (re-export -> ../checkout/TeoDiscountWidget.tsx)
    system/
      ToastHost.tsx
    layout/
      NavItem.tsx
    TopProgressBar.tsx
    ErrorBoundary.tsx
    ui/
      index.tsx
      button.tsx
      card.tsx
      checkbox.tsx
      input.tsx
      radio-group.tsx
      select.tsx
      switch.tsx
      skeleton.tsx
      progress.tsx
      table.tsx
      tabs.tsx
      sidebar.tsx
  pages/
    CourseCheckout.tsx
    PaymentReturn.tsx
    CourseDetail.tsx
    CoursesList.tsx
    LessonPage.tsx
    StudentCourse.tsx
    WalletPage.tsx
    studio/
      CoursesStudioList.tsx
      CourseStudioForm.tsx
      CourseBuilder.tsx
  routes/
    AppLayoutRoute.tsx
    ProtectedRoute.tsx
  lib/
    api.ts
    apiHelpers.ts
    eventBus.ts
    utils.ts
  services/
    payments.ts
    wallet.ts
    courses.ts
    lessons.ts
    reviews.ts
    notifications.ts
    profile.ts
    student.ts
    teacher.ts
    studio.ts
  context/
    AuthContext.tsx

```

## Build & toolchain

- package.json (script chiave):
  - `dev`: vite
  - `build`: `tsc -b && vite build` (typecheck + build)
  - `preview`: vite preview
  - `lint`: eslint
- TypeScript: `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json` (project refs); strictness: progetto usa TS ~5.8.3 (impostazioni specifiche in `tsconfig.app.json` — se manca, N/D).
- Vite: `vite.config.ts` definisce alias `"@"` → `./src` e plugin React.

## Styling & Design System

- `tailwind.config.js`:
  - `darkMode: ["class"]`.
  - `content` include `./index.html` e `./src/**/*.{ts,tsx,js,jsx}`.
  - Theme estende colors con CSS variables (es. `--background`, `--primary`, `--card`, ...).
  - Border radius via `--radius` CSS var.
- Global CSS tokens: tokenizzazione tramite CSS custom properties (definite in `index.css` / `globals.css` — se non trovate, il comportamento è definito implicitamente in `index.css`).
- Dark-mode: abilitato (classe `class`), gestito tramite root class.
- Spaziature / radius: mappati via variabili (`--radius` e valori Tailwind estesi).

Primitives UI presenti (✓ = presente / — = non trovato):

- button ✓ (componenti base e usi diretti nei pulsanti)
- input ✓ (`components/ui/input`)
- select ✓ (N/D: selettore custom non individuato, ma HTML select usato) — borderline
- checkbox ✓ (usato nelle UI, component non centralizzato N/D)
- radio-group — (N/D)
- switch — (N/D)
- skeleton ✓ (pattern `animate-pulse` usato, componentazione N/D)
- card ✓ (`components/ui/card`)
- table — (N/D)
- tabs ✓ (alcuni componenti studio/builder sembrano usarle, ma non ho trovato `Tabs` centralizzato) — treat as partial
- progress ✓ (`TopProgressBar` presente)
- sidebar ✓ (`AppLayoutRoute`/layout + route tree indicano sidebar in layout)

## Layout & Shell

- `AppLayoutRoute` è il layout wrapper per le route principali; include probabilmente `Sidebar` e area contenuti.
- `TopProgressBar` è montato in `App.tsx` e ascolta gli eventi `api:loading` (emessi da `src/lib/api.ts` tramite `eventBus` e `window.dispatchEvent`) per mostrare progress.
- `ToastHost` è montato globalmente e riceve eventi `toast:show` (back-compat `showToast` re-export in `src/lib/api.ts`).
- `ErrorBoundary` è usato per avvolgere molte pagine nelle route, gestisce errori a runtime.

## Routing

- Rotte principali estratte da `src/App.tsx` (conteggio e mapping):

| Path                          | Guardia         | Pagina / Componente                    |
|------------------------------:|----------------:|----------------------------------------|
| / (index)                     | public          | Navigate → /courses                    |
| /login                        | public          | `Login`                                |
| /register                     | public          | `Register`                             |
| /verify-email                 | public          | `VerifyEmail`                          |
| /verify-email/sent            | public          | `VerifyEmailSent`                      |
| /forbidden                    | public          | `Forbidden`                            |
| /courses                      | public          | `CoursesList`                          |
| /courses/:id                  | public          | `CourseDetail`                         |
| /courses/:id/checkout         | Protected       | `CourseCheckout` (checkout/stripe)     |
| /courses/:id/buy              | Protected       | Redirect to checkout                   |
| /learn/:id                    | Protected       | `StudentCourse` (course-scoped)        |
| /lessons/:id                  | Protected       | `LessonPage`                           |
| /exercises/:id/submit         | Protected       | `ExerciseSubmit`                       |
| /my/exercises                 | Protected       | `MyExercises`                          |
| /payments/return              | public          | `PaymentReturn` (Stripe return handler)|
| /notifications                | Protected       | `Notifications`                        |
| /reviews/assigned             | Protected       | `ReviewsAssigned`                      |
| /reviews/:id/review           | Protected       | `ReviewSubmission`                     |
| /reviews/history              | Protected       | `ReviewsHistory`                       |
| /dashboard                    | Protected       | `StudentDashboard`                     |
| /profile                      | Protected       | `ProfilePage`                          |
| /wallet                       | Protected       | `WalletPage`                           |
| /admin                        | RoleRoute(admin)| `AdminDashboard`                       |
| /teacher                      | RoleRoute(teacher)| `TeacherDashboard`                   |
| /studio/courses               | Protected       | `CoursesStudioList`                    |
| /studio/courses/new           | Protected       | `CourseStudioForm`                     |
| /studio/courses/:id/edit      | Protected       | `CourseStudioForm`                     |
| /studio/courses/:id/builder   | Protected       | `CourseBuilder`                        |
| * (catch-all)                 | public          | Navigate → /courses                    |

- Rotte course-scoped: `/courses/:id/*` (checkout, buy, detail) e `/learn/:id` per studio/lesson.
- Wallet/checkout rotte: `/wallet`, `/courses/:id/checkout`, `/payments/return`.

## Pagine principali

Per ciascuna pagina qui sotto: scopo, componenti chiave, chiamate API principali, stato.

- CourseCheckout — flusso di checkout per corso:
  - Scopo: mostra riepilogo prezzo, applicazione sconto TEO, creazione PaymentIntent e avvio Stripe Elements o redirect.
  - Componenti: `TeoDiscountWidget` (in `components/checkout`), `StripeElementsBlock`, pulsanti di pagamento, `ReceiptCard` per riepilogo.
  - API: `getPaymentSummary(courseId)` (`/v1/courses/:id/payment-summary/`), `createPaymentIntent(courseId)` (POST a `/v1/courses/:id/create-payment-intent/` e fallback), `applyDiscount`/`checkDiscount` (wallet service).
  - Stato: loading (caricamento summary), error (errori API/chiave Stripe mancante), submitting.

- PaymentReturn — handler per redirect Stripe:
  - Scopo: confermare lato server il PaymentIntent (vari shape), fallback a `purchaseCourse`, poll di enrollment e reindirizzo al corso.
  - API: `confirmStripePaymentSmart`, `purchaseCourse`, `getCourse` per poll.
  - Stato: init → confirm → fallback → poll → done; mostra errori e permette retry.

- CourseDetail / CoursesList — catalogo:
  - Scopo: elenco corsi, dettaglio singolo course, link al checkout.
  - API: `getCourse`, `listCourses` (in `services/courses.ts`).
  - Stato: loading/empty/error.

- StudentCourse / LessonPage — learning UI:
  - Scopo: fruire lezioni, vedere esercizi, navigazione sequenziale.
  - API: `getLesson`, `getCourseProgress`, `submitExercise`.
  - Stato: loading/error, protezione con `ProtectedRoute`.

- WalletPage — saldo/movimenti:
  - Scopo: mostrare `getWallet` e `getTransactions` (paginati).
  - API: `getWallet`, `getTransactions`.

- Studio pages (CoursesStudioList, CourseStudioForm, CourseBuilder):
  - Scopo: CRUD corsi per teacher.
  - API: `services/studio.ts` (create/update/publish).

- Notifications — lista e mark-as-read tramite `notifications.ts`.

## Servizi/API

Tabella riassuntiva (service → funzione → metodo+path → request/response shape min → errori gestiti)

| Service     | Funzione                 | Metodo + Path (candidati)                                 | Request (min)                          | Response (min)                                    | Errori gestiti                    |
|-------------|--------------------------|-----------------------------------------------------------|----------------------------------------|---------------------------------------------------|-----------------------------------|
| api (lib)   | coreRequest / api.get    | internal (uses BASE + path)                               | N/D (see below)                        | { ok, status, data } uniform wrapper              | 401 → refresh, 403, non-JSON, network |
| auth        | refreshAccessToken       | POST /auth/refresh/                                       | { refresh }                            | { access }                                        | missing refresh → false           |
| wallet      | getWallet                | GET /v1/teocoin/balance/                                  | —                                      | { balance: { available_balance, total_balance... } } → WalletInfo | 401/403, 404 fallback handled     |
| wallet      | getTransactions          | GET /v1/teocoin/transactions/ or /v1/wallet/transactions/ | params: { page, page_size }            | DRF page { count, results: [] } or array          | network, 404 fallback             |
| wallet      | checkDiscount            | POST /v1/teocoin/calculate-discount/                      | { course_id?, price_eur }              | { available: bool, discount_eur, final_price_eur }| 400/404/500 handled by wrapper    |
| wallet      | applyDiscount            | POST /v1/courses/{id}/hybrid-payment/ or /v1/teocoin/apply-discount/ | { course_id?, teocoin_to_spend?, idempotency_key? } | { final_price_eur, discount_eur, teo_required, stripe_client_secret? } | 400 validation, 404 fallback      |
| payments    | getPaymentSummary        | GET /v1/courses/:id/payment-summary/                      | —                                      | { price_eur, discount_percent, total_eur, teo_required } | 404/500 fallback handling         |
| payments    | createPaymentIntent      | POST /v1/courses/:id/create-payment-intent/ (fallbacks)  | { amount, use_teocoin_discount? }      | { client_secret, publishable_key, checkout_url } | 404 fallback; returns 400/500     |
| payments    | confirmStripePaymentSmart| POST /v1/courses/:id/confirm-payment/                     | { payment_intent, payment_intent_client_secret?, redirect_status? } | { enrolled: bool, course_id, status }            | 400 → try next shape, 404 fallback|
| payments    | purchaseCourse           | POST /v1/courses/:id/purchase/ or /enroll/                | { method: "stripe" | "teocoin", payment_intent? } | { success, order_id }                           | 404 fallback, 4xx returned up     |
| courses     | getCourse/list           | GET /v1/courses/:id/ , GET /v1/courses/                   | params paging                          | course object / list                              | 404, 403                          |
| notifications| list/mark               | GET/POST /v1/notifications/                               | —                                      | { results: [] }                                   | network errors                    |
| profile     | get/update profile       | GET/PUT /v1/profile/                                      | body profile                           | profile object                                   | 401/403                           |
| reviews     | submit/retrieve          | POST /v1/reviews/ etc.                                    | review data                            | review object                                    | validation 400                    |

Note: molti servizi usano una lista di candidate endpoints per massima compatibilità (es. payments.createPaymentIntent cicla `/create-payment-intent/`, `/start-payment/`, `/payment-intent/`).
La `API_BASE_URL` è letta da `import.meta.env.VITE_API_BASE_URL` con default `http://127.0.0.1:8000/api`; `src/lib/api.ts` normalizza e rimuove slash finali.

## Stato & Context

- AuthContext: presente (`src/context/AuthContext.tsx`) e montato in `main.tsx`. Probabilmente espone user, token e helper `login/logout`.
- Persistenza token: `src/lib/api.ts` legge/scrive `auth_tokens` in localStorage; scrive anche `access_token`/`refresh_token` legacy keys.
- ProtectedRoute / RoleRoute: usati per autorization/guarding delle rotte.
- Store locali: uso prevalente di React state + Context; non ho trovato Redux/MobX (N/D se presente)

## Utilità condivise

- `src/lib/api.ts`: client API, gestione refresh, eventi `api:loading` / `api:error`.
- `src/lib/eventBus.ts`: event emitter usato localmente (import in api), usato per `api:loading` e altri eventi.
- `src/lib/utils.ts`: helper `cn`, `formatCurrency`, ecc. (occhiello: `cn` usato nei componenti UI).
- `src/lib/idempotency.ts`: generazione/clearing idempotency key per `applyDiscount`.

## Ambienti & .env

- Chiavi richieste lato FE:
  - `VITE_API_BASE_URL` (default: `http://127.0.0.1:8000/api`)
  - `VITE_STRIPE_PUBLISHABLE_KEY` (usata in checkout; se assente l'UI mostra errore e non procede)
- Altri possibili env: `NODE_ENV`, `VITE_SENTRY_DSN` (N/D se non presente)

## Check di sanità (DX)

Top 3 problemi ricorrenti e fix rapidi:

1. Alias `@` non risolto — Verifica: `vite.config.ts` alias `"@": path.resolve(__dirname, "./src")` e `tsconfig.paths` deve contenere `@/*` (se mancasse, aggiungere `"paths"` e riavviare Vite).
2. ENV mancanti (Stripe PK) — Fix: aggiungere `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` in `.env` e riavviare vite.
3. CSS non applicato / token mancanti — Controllare `index.css` import in `main.tsx` e `tailwind.config.js` content; assicurarsi che i CSS custom properties siano definiti in `index.css`.

## Divergenze & TODO

- Duplicazione: `TeoDiscountWidget` esiste in `src/components/checkout/TeoDiscountWidget.tsx` e `src/components/teo/TeoDiscountWidget.tsx` — segnato come duplicato; suggerire un'unificazione.
- Primitives UI: alcuni componenti (select, radio-group, table) non centralizzati; valutare consolidamento in `components/ui`.
- Documentare patterns di error handling (quando `api` restituisce `{ ok:false, status:0 }` per network error).
- Migrare token storage verso `HttpOnly` cookie se si vuole aumentare sicurezza (nota: richiede BE-side change).

## Changelog

* 2025-08-26 14:00 — v1.0 — Prima versione del sommario FE.
* 2025-08-26 14:30 — v1.1 — Aggiunto albero UI completo; unificato `TeoDiscountWidget` (re-export `components/teo` → `components/checkout`).


## Refactor: UI primitives replacement status (2025-08-26)

- Goal: sostituire i markup testuali duplicati (Caricamento…, Impossibile caricare…, messaggi "Nessun …") con i primitives UI (`Spinner`, `Alert`, `EmptyState`, `Badge`) mantenendo la logica inalterata.
- Branch: `feature/make-theme-dropin`
- Stato dettagliato:
  - Completati e verificati (modifiche applicate):
    - `Notifications.tsx`
    - `ReviewsAssigned.tsx`
    - `ReviewsHistory.tsx`
    - `ReviewSubmission.tsx`
    - `ExerciseSubmit.tsx`
    - `Dashboard.tsx`
    - `MyExercises.tsx`
    - `CoursesList.tsx`
    - `CourseDetail.tsx`
    - `LessonPage.tsx`
    - `StudentCourse.tsx`
    - `TeacherDashboard.tsx`
    - `CourseBuilder.tsx` (studio)
    - `CourseStudioForm.tsx` (studio)
    - `CoursesStudioList.tsx` (studio)
    - `ProfilePage.tsx`
    - `PaymentReturn.tsx`
    - `CourseCheckout.tsx`
    - Varianti di `WalletPage` (alcune aggiornate)
    - `AdminDashboard.tsx` (imports & typing fixes applied)

  - Remaining / needs review:
    - `AdminDashboard.tsx` — please run full typecheck (priority); recent patches fixed missing imports and tightened `setBusy` types but project-wide tsc should be executed.
    - `WalletPages.tsx` — currently uses toast for errors; decide whether to keep toast or also present an inline `Alert`.
    - Run a final grep for raw strings (e.g. "Caricamento", "Impossibile caricare", "Nessun") and address any files surfaced.

Notes:

- Replaced many `catch (e: any)` with `catch (e: unknown)` and normalized messages.

- Added selective eslint-disable comment for an intentional useEffect deps omission — please review in lint.

- I did not run project-wide `npm ci` / `npx tsc` in this environment (node deps not installed here). Recommend running the validation commands below before merging.

Validation commands (run locally or in CI):

```bash
cd lms-frontend
npm ci
npx tsc --noEmit
npx eslint "src/**/*.{ts,tsx}" --max-warnings=0
```

Smoke test:

```bash
npm run dev
```



