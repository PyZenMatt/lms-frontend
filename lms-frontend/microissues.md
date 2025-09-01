Ricevuto — preparo micro-issue concrete, piccole e tracciabili per implementare il supporto alle 3 votazioni + raccomandazioni; ognuna include: descrizione, file principali da toccare, stima, criteri di accettazione e dipendenze.

## Piano rapido
1) Scomporre il lavoro in micro-issue atomiche (modellazione → API → calcolo/ricompense → frontend → QA).  
2) Priorità: mantenere retrocompatibilità (accettare ancora `score`) e introdurre fallback.  
3) Dopo conferma, posso generare patch/apply_patch per i primi 3 issue.

## Micro-issue (10)

1) Modello: aggiungere breakdown e recommendations su `ExerciseReview`
- Descrizione: aggiungere campi nullable su `ExerciseReview`: `technical` (SmallIntegerField, 1–5, null), `creative` (SmallIntegerField, 1–5, null), `following` (SmallIntegerField, 1–5, null), `recommendations` (JSONField null/blank) e opzionale `skip_recommendations` boolean.
- File: models.py
- Stima: 0.5–1h (+migrazione)
- Criteri di accettazione: modello migrabile; campi presenti; default null; nessuna rottura esistente.
- Dipendenze: issue 2,3

2) Serializer: esporre breakdown nel backend
- Descrizione: aggiornare/creare serializer per `ExerciseReview` e aggiornare `ExerciseSubmissionSerializer` per includere `student` (id/name), top-level `exercise_id`, `title`, `lesson_id`, `course_id`, alias `text` e `files` (vuoto per ora).
- File: serializers.py
- Stima: 1–2h
- Criteri: GET `/submissions/:id/` e `/submissions/:id/review-detail/` restituiscono i nuovi campi; `student` presente; `text` === `content`.
- Dipendenze: issue 1

3) View: accettare breakdown + comment + recommendations in `ReviewExerciseView`
- Descrizione: modificare `ReviewExerciseView.post` per accettare payload `{technical,creative,following,comment,recommendations}` e legacy `{score}`; validare 1..5; salvare su `ExerciseReview` i campi nuovi; continuare a limitare autovalidazioni e permessi come ora.
- File: exercises.py
- Stima: 2–3h
- Criteri: POST con breakdown crea/aggiorna `ExerciseReview` e restituisce JSON con `review` e `submission` aggiornati (non solo stringa). Supporto legacy preservato.
- Dipendenze: issue 1,2

4) Calcolo media & pass/reward: adattare `calculate_average_score` e logica di reward
- Descrizione: usare per ogni review breakdown quando presente -> media_1_5 = mean(tech,creat,follow). Per legacy `score` convertire a 1–5 con `score/2`. Calcolare media submission in scala 1–5; pass = media_1_5 >= 2.5 (equiv. score>=5). Aggiornare reward logic threshold.
- File: models.py (ExerciseReview.calculate_average_score e punti in `ReviewExerciseView`)
- Stima: 2–4h (inclusi test)
- Criteri: test che prima fallivano devono essere aggiornati; reward e `submission.passed` seguono la nuova soglia; regressioni controllate.
- Dipendenze: issue 1–3

5) Assigned reviews endpoint: arricchire payload
- Descrizione: far tornare in `AssignedReviewsView` il campo `student` (id + name), `course_id`, `lesson_id`, `submitted_at`, `status`.
- File: exercises.py
- Stima: 0.5–1h
- Criteri: frontend può mostrare student object e metadata senza ulteriori chiamate.
- Dipendenze: issue 2

6) (Opzionale) Attachments per submissions
- Descrizione: aggiungere modello `ExerciseSubmissionAttachment` e aggiornare `SubmitExerciseView`/`ExerciseSubmissionSerializer` per gestire file PDF; valida tipo/file size; ritorna `files` nel serializer.
- File: models.py, serializers.py, exercises.py
- Stima: 2–4h + migrazione
- Criteri: upload via multipart funziona, file serializzati come `{url,name}`.
- Dipendenze: può essere fatto separatamente

7) Frontend: invio breakdown e raccomandazioni opzionali
- Descrizione: aggiornare reviews.ts e componenti peer-review per inviare `{technical,creative,following,comment,recommendations}`; allow skip raccomandazioni.
- File: reviews.ts, `src/components/figma/PeerReview.tsx` / `ReviewInterface.tsx`
- Stima: 1–3h
- Criteri: invio compatibile con backend dual-mode; UI permette skip e mostra breakdown nel risultato.

8) Tests backend: unit/integration
- Descrizione: aggiungere test per:
  - POST review con breakdown
  - POST legacy score ancora funzionante
  - calcolo media e pass/reward con mix di review types
  - AssignedReviewsView payload
- File: tests (aggiungere file)
- Stima: 2–4h
- Criteri: test suite verde, copertura per i casi nuovi e regressivi.

9) Migration & rollout plan
- Descrizione: creare migration file, applicare su staging; script di smoke test per confrontare ricompense pre/post per sample dataset; feature-flag opzionale per abilitare nuovo criterio.
- File: migrations + deployment docs
- Stima: 1–2h (staging run)
- Criteri: migration applicata senza errori; smoke test pass; risultato valido.

10) QA checklist & docs
- Descrizione: documentare API changes (esempi request/response), aggiornare README API e comunicare al frontend team; aggiungere changelog breve.
- File: docs o README.md
- Stima: 0.5–1h
- Criteri: doc con payload esemplificativo e note di compatibilità.

## Priorità suggerita
- Sprint 1: issue 1,2,3,4,8 (core backend + tests)
- Sprint 2: issue 5,7,6 (payload enrichment, frontend, attachments)
- Pre-deploy: issue 9,10

Dimmi se vuoi che io generi i patch per i primi N issue (consigliati: primi 3) e applico le modifiche e la migration; oppure preferisci che io crei ticket in formato Markdown pronto da incollare nella board.