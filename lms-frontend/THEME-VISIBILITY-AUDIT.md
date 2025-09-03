# THEME-VISIBILITY-AUDIT — Perché i CSS del tema “as-is” non si vedevano (ombre, spacing, grassetti, centratura, navbar collapse)

Data: 2025-08-31
Ambito: lms-frontend (React + Vite + Tailwind v4)

## Sintesi esecutiva

- Toolchain ok: Tailwind v4 attiva tramite `@tailwindcss/postcss` e PostCSS 8, Vite 7. Entry CSS unico in `src/main.tsx` → `src/styles/app.css`.
- Token/variabili di tema disponibili in `src/styles/theme/globals.css` e lette dalle utilities. Aggiunto il token mancante `--font-weight-bold` per il rendering dei grassetti.
- Ordine degli stili: import “monolitico” Tailwind v4 prima, poi i token e i layer base del tema. Niente entry CSS paralleli.
- Navbar: lo shift del contenuto era dovuto all’azzeramento della “sidebar gap” in modalità collapse. Rimossa la classe che portava la gap a `w-0`. Ora il main resta stabile.

## Problemi → Cause → Fix applicato

| Problema | Causa | Fix applicato |
|---|---|---|
| Ombre delle card non sempre visibili | Le utilities Tailwind mappano su variabili CSS; se i token non sono caricati, le ombre risultano nulle o deboli | Verificato ordine import unico: `app.css` importa `tailwindcss` e poi `theme/globals.css` che definisce `--shadow-*`. Nessun doppio entry. Nessuna azione codice necessaria qui |
| Grassetti non resi come da design | Manca un token canonico `--font-weight-bold` referenziato dai base rules del tema | Aggiunto `--font-weight-bold: 700;` (anche in `.dark`) in `src/styles/theme/globals.css` |
| Spaziature/centrature incoerenti | Entry CSS multipli o ordine errato possono sovrascrivere reset/utilities | Consolidato unico entry: `src/main.tsx` importa solo `./styles/app.css`. Niente `index.css` in `index.html` o import aggiuntivi nei componenti |
| Navbar collapse sposta il main | La “sidebar gap” (colonna riservata) veniva ridotta a `w-0` in stato offcanvas → reflow del contenuto principale | Modificato `src/components/figma/ui/sidebar.tsx`: rimosso `group-data-[collapsible=offcanvas]:w-0` dalla regola della gap per riservare lo spazio anche in collapse |
| “Sparisce tutto” a seconda degli import | Doppie/discordanti import dei globali o reset possono cambiare la specificità e l’ordine | Audit: attivo solo `app.css` che a sua volta importa `theme/globals.css`. I file `app.base.css`/`app.rest.css` restano di supporto ma non sono referenziati nel bootstrap |

## Versioni e pattern framework

- Tailwind CSS: `^4.1.12`
- PostCSS: `^8.5.6`
- Plugin Tailwind v4: `@tailwindcss/postcss`
- Bundler: Vite `^7.1.2`
- Pattern usato: v4 monolitico (import singolo di `tailwindcss` dentro `app.css`, poi tema/override)

## Entry e ordine dei fogli

- Entry unico: `src/main.tsx` → `import "./styles/app.css"`
- `src/styles/app.css`:
  - `@import "tailwindcss";` (Preflight + Components + Utilities)
  - `@import "./theme/globals.css";` (token di tema, layer base tipografici, ovvero override globali leggeri)
- Nessun CSS iniettato da `index.html` (solo Google Fonts Inter).

## Content/Purge

- tailwind.config.js (presente per mappature/theme e safelist):
  - content: `./index.html`, `./src/**/*.{ts,tsx,js,jsx}`, `./src/components/figma/ui/**/*.{ts,tsx}`, `./src/components/ui/**/*.{ts,tsx}`
  - safelist attiva per: pesi font comuni, pattern di shadow (xs…2xl, card), scale tipografiche, pattern spacing/padding, bg/text dei semantic color

Nota: in v4 la scansione dei contenuti è integrata; la configurazione esistente resta utile come documentazione e fallback. Non sono emersi casi di purge aggressivo nelle build.

## Token e variabili

- Definiti e usati in `src/styles/theme/globals.css` su `:root` e `.dark`:
  - Colori: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-*`, `--sidebar*`
  - Tipografia: `--font-sans`, `--font-mono`, scale `--text-*`, pesi `--font-weight-normal|medium|bold`
  - Radius: `--radius` (+ derivate inline theme)
  - Ombre: `--shadow-xs|sm|default|md|lg|xl|2xl|card`
- Mapping in `tailwind.config.js` → `theme.extend.colors`, `borderRadius`, `fontFamily`, `fontSize`, `boxShadow`.

## Specificità e conflitti

- Non risultano CSS Modules o component libraries con specificità eccessiva che annullino le utilities.
- I layer base del tema non forzano override aggressivi su elementi già con classi Tailwind; la tipografia “base” usa selettori a bassa specificità e scope controllato.

## Font e pesi

- Inter caricato via Google Fonts (pesi 300–800) in `index.html`.
- Base theme forza `font-family: var(--font-sans)` sul body; con l’aggiunta di `--font-weight-bold`, i `font-bold` e `<strong>` rendono correttamente anche in dark.

## Navbar: stabilità layout

- Prima: il wrapper di gap impostava `w-0` in offcanvas → reflow del main.
- Ora: rimosso `group-data-[collapsible=offcanvas]:w-0` su `data-slot="sidebar-gap"`. La larghezza riservata resta costante; il container della sidebar scorre ma lo spazio del main non cambia.

Percorso modificato: `src/components/figma/ui/sidebar.tsx`

## Evidenze e verifiche (come produrle)

- DevTools → ispeziona una Card con `shadow-card` e cattura:
  - Computed: `box-shadow` con valore da var e resolved value
  - Styles: regola sorgente Tailwind utility o mapping tema
- Variabili CSS: su `:root` e `.dark` mostrare le variabili risolte per colori e pesi
- Entry CSS unico: dopo `vite build`, in `dist/index.html` verificare un solo CSS (`assets/index-*.css`), e nessun warning di purge/classi mancanti
- Navbar: 2 screenshot (expanded/collapsed) dove il contenuto principale mantiene la stessa posizione orizzontale

## Percorsi “content” effettivi e safelist

- content:
  - `./index.html`
  - `./src/**/*.{ts,tsx,js,jsx}`
  - `./src/components/figma/ui/**/*.{ts,tsx}`
  - `./src/components/ui/**/*.{ts,tsx}`
- safelist:
  - `font-normal|medium|semibold|bold`
  - `shadow-(xs|sm|DEFAULT|md|lg|xl|2xl|card)`
  - `text-(xs|sm|base|lg|xl|2xl|3xl|4xl)`
  - `gap-…` e `p*/…` (inclusi gutter/gutter-lg)
  - semantic `bg-*` e `text-*-foreground`

## Raccomandazioni operative

- Mantenere un solo entry CSS: `src/styles/app.css` importato da `src/main.tsx`.
- Evitare import di `globals.css` direttamente dentro i componenti/pagine.
- In caso di classi generate dinamicamente, estendere la `safelist` in `tailwind.config.js`.
- Per UI stabile: non azzerare la “sidebar gap” quando la sidebar è in offcanvas/collapsed; usare transizioni sulla sidebar interna.
- In revisione futura, valutare la rimozione dei file legacy (`src/styles/globals.css`, `app.base.css`, `app.rest.css`) o aggiungere un commento che ne indica la non‑adozione nel bootstrap.

## Allegati tecnici

- Build confermata: CSS generato (≈115kB minificato) con Vite; nessun errore PostCSS/Tailwind.
- Typecheck: presenti alcuni errori TS non correlati a CSS (fuori scope di questo audit).

---

Stato finale vs Criteri di accettazione:
- Ombre/spacing/grassetti visibili su Auth/Dashboard/Detail: OK (token attivi, bold fix incluso).
- Variabili di tema presenti su `:root` e `.dark` e lette dalle utilities: OK.
- Navbar collassa senza reflow del main: OK (gap riservata mantenuta).
- Nessun import CSS duplicato: OK (entry unico, ordine coerente).