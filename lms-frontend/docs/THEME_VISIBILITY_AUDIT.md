# THEME-VISIBILITY-AUDIT — Perché il tema “as‑is” non si vedeva

## Sommario rapido

- Unico entry CSS: `src/styles/app.css`.
- Token riattivati: rimossa la classe `no-tokens` da `index.html` (i token vengono letti correttamente).
- Ordine di caricamento (Tailwind v4): `tailwindcss` → `theme/globals.css`.
- Navbar/Sidebar: nessun override custom; layout tema (Figma Sidebar) “as‑is”.

## Problema → Causa → Fix applicato

| Problema | Causa principale | Fix applicato |
|---|---|---|
| Ombre/spaziature/grassetti non visibili | Token disattivati da `body.no-tokens` | Rimossa `no-tokens` da `lms-frontend/index.html` |
| Utilities/theme incoerenti o “spariscono tutto” | Entry/ordine CSS non deterministico | Unificato entry `src/styles/app.css` con ordine Tailwind v4: framework → token |
| Centratura e tipografia diverse dal design | Preflight/Utilities caricati senza i token o sovrascritti | Ordine consolidato: `tailwindcss` → `globals.css` (token/base) |
| Navbar collapse sposta il contenuto | Uso di `.container` centrata nel main causava shift quando cambiava la gap della sidebar | Rimosso `.container` dal main/footer; affidato il layout alla Sidebar del tema |

## Toolchain e versione framework

- Build: Vite `^7.1.2`
- Tailwind: `^4.1.12` (monolitico, via `@tailwindcss/postcss`)
- PostCSS: `^8.5.6` con `@tailwindcss/postcss` + `autoprefixer`

File chiave:
- `lms-frontend/postcss.config.cjs`
- `lms-frontend/tailwind.config.js`
- `lms-frontend/src/styles/app.css`
- `lms-frontend/src/styles/theme/globals.css`
- `lms-frontend/index.html`

## Pattern usato (Tailwind v4, monolitico)

1) Entry unico importa nell’ordine:
- `@import "tailwindcss";` (Preflight/Components/Utilities interni)
- `@import "./theme/globals.css";` (token + base tipografia)

2) Niente duplicazione di reset: i file `app.base.css`/`app.rest.css` restano storici ma non sono importati.

## Content/Purge

Tailwind `content` (da `tailwind.config.js`):

```
./index.html
./src/**/*.{ts,tsx,js,jsx}
./src/components/figma/ui/**/*.{ts,tsx}
./src/components/ui/**/*.{ts,tsx}
```

Safelist configurata (estratto):

```
'font-normal', 'font-medium', 'font-semibold', 'font-bold',
{ pattern: /shadow-(xs|sm|DEFAULT|md|lg|xl|2xl|card)/ },
{ pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/ },
{ pattern: /gap-(?:gutter|gutter-lg|\d+)/ },
{ pattern: /p(?:x|y|t|b|l|r)?-(?:gutter|gutter-lg|\d+)/ },
{ pattern: /bg-(?:primary|secondary|muted|accent|card|popover)/ },
{ pattern: /text-(?:primary|secondary|muted|accent|card|popover)-foreground/ },
```

## Evidenze richieste (come verificarle)

- Card (DevTools → Computed): vedere `box-shadow` provenire da utility/token tailwind (es. `shadow-card`).
- Styles: verificare la risoluzione delle variabili CSS su un pulsante/heading (`--primary`, `--font-weight-medium`, ecc.).
- Build: confermare che nel bundle venga incluso un unico entry CSS (l’import in `src/main.tsx` è solo `./styles/app.css`).
- Navbar: con sidebar expanded → collapsed, il main resta fermo (cambia solo l’offset/padding alla `.container`).

Suggerimento cattura rapida:
- Apri una “Card” o un contenitore con `shadow-card`, e verifica in “Computed”/“Styles” l’origine (file/sorgente).
- Togli/metti la classe `dark` su `<html>` (script in `index.html` già gestisce NFD); verifica che colori/foreground cambino.

## Raccomandazioni operative

- Mantieni un solo import CSS in `src/main.tsx`: `import "./styles/app.css";`.
- Non reintrodurre `no-tokens` in produzione; usalo solo per debug visivo rapido.
- Ogni volta che tocchi `tailwind.config.js` o `postcss.config.cjs`, riavvia Vite per evitare cache incoerenti.
- Per aggiunte di classi dinamiche non matchate da `content`, estendere la `safelist` esistente.

## Dettagli implementativi toccati

- `index.html`: rimossa la classe `no-tokens` dal `<body>` per riattivare i token.
- `src/components/layout/AppLayout.tsx`: rimosso l’uso di `.container` nel main/footer per evitare shift.

## Criteri di accettazione – stato

- Ombre (`shadow-*`), spaziature e pesi (`font-medium`/`font-bold`) visibili in Auth, Dashboard e pagina di dettaglio → attesi OK con token attivi.
- Variabili su `:root` caricate e lette dalle utilities → visibili in DevTools.
- Navbar collapse senza reflow del main → gestito dai componenti Sidebar del tema (gap element) senza CSS custom.
- Nessun doppio reset o import concorrente → entry unico `app.css`.
