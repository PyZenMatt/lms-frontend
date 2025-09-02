# INSTRUCTIONS — Montare un tema Figma su API reali (solo istruzioni, zero codice)

## Scopo

Collegare **componenti UI presentazionali** (tema Figma, “stupidi”) a **dati reali** del backend, mantenendo **il tema intoccabile** e PR piccole, verificabili e revert-friendly.

## Modalità e confini

* **MODE=THEME**: pixel-perfect, stati hover/focus, tipografia, spacing. Nessuna logica dati.
* **MODE=STACK**: integrazione dati, sicurezza, DX, caching, errori. Nessuna modifica stilistica.

**Regola d’oro:** se tocchi classi Tailwind o markup del tema → MODE=THEME (PR separata). Se tocchi fetch, auth, tipi, cache → MODE=STACK.

---

## Convenzioni di progetto (concettuali)

* **Tema**: cartelle del design rimangono **immutate** in MODE=STACK (es. `components/figma/*`, `components/ui/*`).
* **Domini**: raggruppa per ambito funzionale (auth, courses, lessons, teacher, payments, notifications, wallet).
* **Strati**:

  1. **Contratti API** (testo): elenco endpoint, metodi, parametri, risposte, status, auth.
  2. **Services**: funzioni di rete per dominio (nomi “intento-centrico”: es. “listare corsi” invece di “chiamare /course/list”).
  3. **Types/DTO**: modelli di richiesta/risposta minimali e stabili.
  4. **Hooks (React Query)**: query/mutation per dominio con chiavi cache e invalidation definite.
  5. **Adapters/Presenters**: mappano i dati di dominio in **props** dei componenti del tema.
  6. **Pagine**: collegano hook e presenter; nessuna fetch inline.

---

## Workflow standard per OGNI feature/pagina

1. **Allinea il contratto API** (1 mini-spec per pagina):

   * Endpoint coinvolti, input/parametri, campi di risposta, codici errore previsti, auth richiesta.
   * Nota le regole di ordinamento, paginazione e visibilità (es. anteprime per non iscritti).

2. **Definisci le responsabilità**:

   * **Service**: chiama l’endpoint; traduce errori noti in esiti chiari.
   * **Hook**: usa React Query; stabilisci chiavi cache (esempi: “courses\:list”, “course\:detail:{id}”, “teacher\:dashboard”), policy di stale time, retry, invalidation dopo mutation.
   * **Adapter**: converte i campi del backend in quelli attesi dal componente del tema (naming, formati, fallback).

3. **Collega la pagina**:

   * Loading → skeleton; Error → messaggio controllato; Empty → stato vuoto con CTA sensata.
   * Niente logica auth/negotiazione errori nel componente del tema: sta tutto in hook/service.

4. **Sicurezza & coerenza**:

   * Autorizzazione coerente con le route protette: se il router limita l’accesso, il service/hook non “maschera” 401/403 ma li propaga in forma gestibile.
   * Zero segreti hardcoded; URL base e flag da variabili d’ambiente.
   * CORS/CSRF corretti rispetto alla modalità (JWT header vs cookie httpOnly).

5. **Caching & invalidation**:

   * Chiavi cache **prevedibili** e stabili per dominio.
   * Ogni mutation indica esplicitamente quali chiavi invalidare (es. “lezione completata” invalida l’outline del corso).
   * Evita richieste duplicate impostando policy di stale/boundary di refetch.

6. **Error design**:

   * Mappa errori noti (validazione, permessi, risorsa mancante).
   * Evita allarmi rumorosi: messaggi chiari in pagina + eventuale toast discreto.

7. **PR discipline**:

   * Una pagina/feature alla volta.
   * Nessun mix THEME/STACK nella stessa PR.
   * Diff limitata; build e typecheck verdi; screenshot o GIF solo se tocca la UI (in THEME).

---

## Definition of Done (DoD) — generica e riusabile

* La pagina mostra **dati reali** coerenti con i contratti API, su refresh e su sessioni diverse.
* Non sono stati modificati file del tema (THEME out-of-scope).
* Nessuna fetch inline nei componenti presentazionali.
* Stati `loading/error/empty` sono gestiti e accessibili.
* Chiavi cache documentate; invalidation verificata dopo le mutation.
* Errori di rete e di business resi comprensibili all’utente.
* Build e typecheck verdi; nessun “any” non giustificato; linter pulito.

---

## Stop-rules (blocchi automatici)

* **Mix di scope**: se serve toccare UI/tema e logica dati nello stesso step → **split** in due PR.
* **Diff > 20 file** senza ragioni ottime → **fermati** e spezza il lavoro.
* **Build/typecheck rotti** → **rollback** alla versione verde, poi riprendi.
* **A11y/focus ring** sparito (in THEME) → blocca e ripristina prima di altro.

---

## Template “Contratto API” (solo testo)

* **Obiettivo pagina**: cosa deve vedere/fare l’utente.
* **Endpoint primari**: URL, metodo, parametri, ordinamento, paginazione.
* **Risposte**: campi minimi necessari per UI e presenter; chiarisci eventuali alias/format (date, valute, durate).
* **Permessi**: ruoli ammessi, comportamenti per non autenticati o non iscritti (es. anteprima).
* **Errori mappati**: elenco status → comportamento UI.

---

## Template “Issue STACK” (senza codice)

**Titolo:** Collegare `<PaginaX>` a dati reali tramite Services + Hooks (+ Adapters)
**Diagnosi:** UI pronta; serve integrare API reali definite nel contratto; evitare modifiche al tema.
**Piano:**

1. Scrivere mini-spec API per `<PaginaX>` (endpoint, campi, errori).
2. Implementare lo **strato Services** per gli endpoint coinvolti.
3. Esporre **Hooks** React Query con chiavi e policy di cache.
4. Aggiungere **Adapter** (se il componente del tema richiede mappature diverse).
5. Collegare la pagina usando solo gli hook; gestire loading/error/empty; definire invalidation.
   **Verifiche:** DoD standard (dati persistenti su refresh, errori gestiti, cache/invalidation), build/typecheck verdi.
   **Stop-rules:** niente mix THEME/STACK; diff piccola; rollback se build rossa.
   **Output atteso:** pagina `<PaginaX>` mostra i dati reali; nessun cambiamento al tema.

---

## Prompt “per l’assistente AI” (istruzioni, non codice)

* Lavorare in **MODE=STACK**.
* Non modificare file del tema né classi/markup; se necessario, proporre **issue MODE=THEME** separata.
* Prima consegnare **Diagnosi → Piano**; produrre patch **solo** su richiesta esplicita.
* Per `<PaginaX>`:

  * Leggere o costruire il **contratto API** (endpoint, parametri, campi risposta, errori).
  * Definire i **Services** necessari con nomi basati sull’intento (es. “elenca corsi docente”).
  * Definire gli **Hooks** con chiavi cache chiare e invalidation dopo le mutation.
  * Se serve, aggiungere un **Adapter** che mappa il modello dei dati alle props del componente del tema.
  * Descrivere il **wiring** nella pagina (solo stati e collegamenti, niente codice).
  * Elencare la **checklist DoD** e i **rischi** (CORS, 401/403, pagination, formati data/valuta).

---

## Rischi tipici da prevenire (spunta mentale)

* Endpoint non idempotenti usati come se lo fossero.
* Invalidation dimenticata → UI “vecchia” dopo una mutation.
* Errori 401/403 “mangiati” nei componenti → comportamenti ambigui.
* Dipendenze circolari tra presentational e domain.
* “Any” silenziosi che nascondono divergenze di contratto.

---

## Prossimi passi consigliati

* Standardizzare le **chiavi cache** per dominio.
* Documentare in README/INSTRUCTIONS l’elenco di endpoint per pagina.
* Aggiungere una breve **matrice permessi** (route × ruolo) per prevenire regressioni.
* Introdurre una **checklist PR**: DoD spuntata, stop-rules rispettate, note su invalidation.


