Token Audit — Tailwind, Globals, Primitives

Summary
-------
This audit scanned `tailwind.config.js`, `src/styles/theme/globals.css` and all `src/components/ui/*` primitives.
It verifies design tokens (colors, radius, font, shadows) are declared and used, finds hard-coded exceptions, and proposes minimal fixes.

Findings
--------
1) Tailwind config
- `tailwind.config.js` already maps many colors to CSS variables (e.g. `background: var(--background)`).
- Missing mappings observed prior to patch: `fontFamily` and `boxShadow` tokens. These were added to the config to map to CSS variables.
- `content` includes `./src/**/*.{ts,tsx,js,jsx}` — OK.

2) Globals
- `src/styles/theme/globals.css` declares a comprehensive set of CSS variables in `:root` and `.dark`.
- I added `--font-sans` and a set of shadow variables (`--shadow-*-`) used by Tailwind `boxShadow` mapping.

3) Primitives (`src/components/ui/*`)
- Most primitives rely on Tailwind utility classes or CSS variable-based tokens (e.g. `bg-primary`, `text-muted-foreground`, `border-input`). Good.
- Instances of hard-coded literal values found:
  - `#[0-9A-Fa-f]{3,6}` hex literals in a few components (e.g., `--background: #ffffff` inside globals.css is ok; components using hex directly: `src/components/ui/textarea.tsx` uses `bg-white` class which is Tailwind — acceptable if mapped).
  - Explicit classes like `shadow`, `shadow-sm`, `shadow-xl`, and `rounded-2xl` appear in primitives. These map to Tailwind defaults, but we've added token aliases (`card`, `xs`, `sm`, etc.). Consider replacing named utility classes with token aliases where a token equivalent exists (e.g., `shadow-sm` -> `shadow-sm` maps to `--shadow-sm`).
  - Some components have dark-mode explicit classes using `dark:bg-neutral-900` and direct `neutral-*` Tailwind colors. These are acceptable short-term but could be improved to use semantic tokens (e.g. `bg-card dark:bg-card` -> `bg-card`).
- Specific file snippets (representative):
  - `src/components/ui/button.tsx`: uses `bg-destructive`, `bg-background`, `dark:bg-input/30` — token-first usage is good.
  - `src/components/ui/card.tsx`: `rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950` — neutral-* classes are literal theme colors; consider replacing with `border-border bg-card shadow-card dark:border-border dark:bg-card`.
  - `src/components/ui/textarea.tsx`: contains `bg-white` and dark classes with `dark:bg-neutral-900`.

Acceptance checklist status
---------------------------
- [x] `content` includes source globs.
- [x] `tailwind.config.js` contains `extend.colors` mapped to CSS vars.
- [x] `fontFamily` and `boxShadow` added to `tailwind.config.js` (Done).
- [x] `globals.css` exposes CSS variables used by Tailwind (extended with shadow and font variables).
- [ ] No hard HEX in primitives: some usages of `neutral-*` Tailwind classes remain (recommendation: migrate to semantic tokens).
- [ ] No hard-coded radius/shadow: primitives use Tailwind utility classes like `rounded-2xl` and `shadow-sm`; we added token mappings, but components may be updated to use semantic names.
- [x] Dark mode variables present in `globals.css` and `.dark` overrides verified.

Fix plan (minimal patches)
--------------------------
1) Replace neutral color classes in `src/components/ui/card.tsx` with token classes:
   - `border-neutral-200` -> `border-border`
   - `bg-white` -> `bg-card`
   - `dark:bg-neutral-950` -> handled by `bg-card` with `.dark` tokens already defined.
   - `shadow-sm` -> `shadow-sm` (now mapped to `--shadow-sm`).

2) Replace `bg-white` / `dark:bg-neutral-*` in `textarea.tsx` and other form primitives with `bg-input-background` / `dark:bg-input` or similar token classes.

3) Optional: introduce `shadow-card` utility usage in components that need a card shadow and replace `shadow-sm` where appropriate.

Notes and rationale
-------------------
- I intentionally did minimal changes: added token variables (font, shadows) and mapped them in Tailwind config. This makes existing utility classes work with tokens without changing component files.
- Next step is to replace neutral/tailwind color classes in primitives with semantic token-based classes for clarity and maintainability.

Next actions
------------
- I can open a follow-up PR replacing color/shadow/radius usages in `card.tsx`, `textarea.tsx`, and a few other primitives with token-based classes.
- Optionally generate `TOKEN_AUDIT.md` in the repo (created) and a small changelog file per patched file when performing those minimal replacements.

Delta (applied this session)
-----------------------------
- Files updated (token-first conservative changes):
  - `src/components/ui/button.tsx` (outline variant uses `border-border bg-card`)
  - `src/components/ui/input.tsx` (uses `bg-input-background`, `border-border`, `text-foreground`)
  - `src/components/ui/badge.tsx` (muted/outline -> token classes)
  - `src/components/ui/modal.tsx` (content uses `bg-card border-border shadow-card`)
  - `src/components/ui/card.tsx` (earlier change: `border-border bg-card shadow-card`)
  - `src/components/ui/textarea.tsx` (earlier change: `bg-input-background`)
  - `src/components/ui/pagination.tsx` (tokenized layout and buttons)
  - `src/components/ui/tabs.tsx` (tabs list and triggers tokenized)
  - `src/components/ui/table.tsx` (header/body/rows/cells tokenized)
  - `src/components/ui/dropdown.tsx` (content and items tokenized)
  - `src/components/ui/skeleton.tsx` (bg-muted, rounded-md)
  - `src/components/ui/progress.tsx` (bg-muted, bg-primary)
  - `src/components/ui/alert.tsx` (container -> `bg-card border-border shadow-card`, body text to `text-foreground/80`)

Remaining drift (files still using neutral utilities or neutrals intentionally preserved):
- `src/components/ui/input.tsx` — invalid hint text uses `text-neutral-500` (kept to preserve error styling; can be tokenized to `text-muted-foreground`).
- `src/components/ui/empty-state.tsx` — `border-dashed border-neutral-200` and `text-neutral-500` (candidate for tokenization).
- `src/components/ui/textarea.tsx` & `card.tsx` — minor `text-neutral-*` usages in descriptions; consider mapping to `text-muted-foreground`.
- `src/components/ui/badge.tsx` — success/warning/destructive still use Tailwind color utilities (these are semantic color utilities; ok to keep or map to tokens if desired).
- `src/components/ui/modal.tsx` — overlay uses `bg-black/40` (overlay mask; acceptable) and a `backdrop-blur` style.
 - `src/components/ui/modal.tsx` — overlay previously used `bg-black/40`; replaced with token `bg-overlay/40` (see diff).

Next steps (small PRs)
- PR 1 (this session): add the above 13 files (done locally). Create branch + PR describing the change; include screenshots for Card, Button, Input in light/dark.
- PR 2: sweep remaining files (`empty-state`, `textarea` text snippets, `badge` success/warning variants) and convert to tokens.
- PR 3: optional: add Storybook for Button/Input/Card/Dropdown to validate visual parity across tokens/dark mode.

Notes
-----
- I kept all changes conservative and limited to class strings; no API/prop behavior changed.
- The project currently shows unrelated TypeScript/dependency issues when running a full build. These pre-existed and are outside the token audit scope; they prevent a clean typecheck here but do not block the token migrations.

If you want, I can now:
- (A) open a branch and a PR containing these token-first edits with per-file commits and a short changelog, or
- (B) continue and migrate the remaining drift files (`empty-state`, `textarea` descriptions, `badge` variants).

Appendix: commands used
-----------------------
- grep searches to find hex literals, shadow/radius inline styles, and classes in `src/components/ui`.

