# Changelog

Toutes les évolutions notables de **Delivery** sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : [SemVer](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Analyse complète de l'ancien script `code.gs` (récupération commits GitHub, génération IA
  deux versions, rapport long Google Doc, brouillon Gmail threadé, archivage des notes).
- Décisions d'architecture verrouillées (voir `docs/PLAN.md`) : PWA Next.js, notes en base
  Supabase, IA pluggable (Gemini par défaut / Groq), rapport long Google Doc dans Drive,
  brouillon Gmail validé manuellement, hébergement Vercel, mono-utilisateur.
- Documents de cadrage : `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/TDD_WORKFLOW.md`,
  `NEXT_SESSION.md`, `CLAUDE.md`, `.env.example`, `README.md`.
- Commande de handoff `/handoff` (`.claude/commands/handoff.md`).

- **Phase 0 — Scaffolding** : projet Next.js 16 (App Router, TS strict, Tailwind, src/) ;
  configuration Vitest 4 + Testing Library + jsdom ; scripts `test`, `test:run`, `typecheck` ;
  installation du skill `find-skills` (vercel-labs).
- **Phase 1 — Domaine (terminée)** : `dates.ts` (libellés semaine FR, date injectable),
  `notes.ts` (7 sections + `notesToPromptText`), `prompt.ts` (prompt IA porté de `code.gs`),
  `reportSchema.ts` (schémas Zod long/court + `parseReportResponse` tolérant aux ```json). TDD.
- **Phase 2 — Providers IA (terminée)** : abstraction `LlmProvider`, `createGeminiProvider`
  (défaut, free tier), `createGroqProvider`, fabrique `createLlmProvider` ; pipeline
  `generateReport` (notes → prompt → IA → rapport validé), providers testés avec `fetch` mocké.
- **Phase 3 — GitHub (terminée)** : `client.ts` (`fetchCommits`, `fetch` mocké, cas 200/401/404/500,
  mapping sha court/message/date) + `importCommits.ts` (`dedupeCommits` par sha,
  `formatCommitsForNotes` groupé par dépôt). Porté de `code.gs`.
- **Phase 4 — Construction du rapport (terminée)** :
  - `emailHtml.ts` (`buildEmailHtml`) — corps HTML version courte, mono/multi-projets + replis.
  - `longReport.ts` (`buildLongReportBlocks`) — version longue en blocs de document (7 sections
    numérotées, replis « Aucun … »), portée de `creerDocRapportLong`.
  - `google/gmailThread.ts` — helpers purs de threading (`pickReplyReference`, `buildReplySubject`,
    `buildReplyHeaders`), portés de `creerBrouillonReponse`.
- **Phase 0 (complétée) — env typé** : `src/lib/env.ts` (`loadEnv`/`getEnv`) — lecteur
  d'environnement server-only validé par Zod, exige la clé du provider IA sélectionné. TDD.
- **Phase 5a — Persistance Supabase** :
  - Migration `supabase/migrations/0001_init.sql` : tables `settings`/`projects`/`repos`/`weeks`/
    `notes`/`commits`/`reports`/`oauth_tokens` + contraintes (unicité notes par section, commits par
    sha) + index + **RLS** (policies `authenticated`).
  - `src/lib/supabase/` : types `Database` (miroir SQL) + fabriques client anon / service-role.
  - Repositories TDD (`settings`/`weeks`/`notes`/`commits`/`reports`) avec faux client Supabase
    chaînable (`src/test/fakeSupabase.ts`) : upsert notes par section, insert commits idempotent.
- **Phase 4 (complétée) — clients Google** (fetch injectable, mocké) :
  - `google/oauth.ts` — `refreshAccessToken`, `getValidAccessToken` (réutilise/rafraîchit).
  - `google/docs.ts` — `createLongReport` (documents.create → batchUpdate depuis `Block[]` →
    déplacement Drive), mapping blocs → requêtes Docs (headings/bullets).
  - `google/gmail.ts` — `createReplyDraft` (MIME base64url threadé, réutilise `gmailThread` +
    `buildEmailHtml`), en-têtes In-Reply-To/References, `Re:` non doublé.
- **Phase 5b — Orchestration (terminée)** :
  - `repositories/projectsRepo.ts` et `repositories/reposRepo.ts` ajoutés (TDD).
  - `google/gmail.ts` : ajout de `getGmailThread` pour lire les métadonnées d'un fil.
  - `orchestration/importDailyCommits.ts` : pipeline d'import GitHub → dédoublonnage → upsert Supabase → mise à jour de la section notes "commits".
  - `orchestration/runWeeklyReport.ts` : vérification idempotence → génération IA → Google Doc → brouillon Gmail → mise à jour statut `draft_created`.
  - `orchestration/closeWeek.ts` : archivage de la semaine courante et création de la suivante.
- Suite : **108 tests verts** (+17), `typecheck` et `lint` OK.

### Configuré
- **Setup des comptes terminé** : `.env.local` rempli (hors git) — Supabase, Google OAuth + Drive,
  Gemini, Groq, GitHub, `CRON_SECRET` généré. Connectivité vérifiée : **GitHub** et **Groq** OK (200) ;
  Gemini/Google/Supabase à valider au runtime (googleapis injoignable depuis le shell de dev).

### À venir
- **Routes API/Cron** (Phase 6), **UI** (Phase 7), **Auth Google** (Phase 8), **PWA/déploiement** (Phase 9).
- Étapes manuelles à faire côté comptes : appliquer la migration Supabase, config OAuth Google,
  déploiement Vercel + Cron, validation runtime des clients Google.

---

<!--
Modèle d'entrée à copier lors d'une release :

## [x.y.z] - AAAA-MM-JJ
### Ajouté
### Modifié
### Corrigé
### Supprimé
-->
