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
- **Phase 6 — API & Cron (terminée)** :
  - `repositories/oauthTokensRepo.ts` (TDD) : `getOAuthToken`/`saveOAuthToken` — la table
    `oauth_tokens` existait depuis la Phase 5a sans repository pour la lire.
  - `api/auth.ts` (TDD) : garde `Authorization: Bearer CRON_SECRET`, comparaison à temps constant,
    refus si le secret attendu est vide. Partagé par les routes cron **et** actions.
  - `api/googleAuth.ts` (TDD) : `resolveAccessToken` — lit le jeton en base, le rafraîchit via
    `getValidAccessToken` et ne le re-persiste que s'il a changé.
  - `api/handlers.ts` (TDD) : `handleImportCommits`, `handleReport`, `handleCloseWeek` — garde →
    semaine active → orchestration. Contrat commun 401 / 409 (aucune semaine active) / 200 / 500
    (détail logué côté serveur, jamais renvoyé au client).
  - `api/deps.ts` : composition root — seul module qui lit l'env et crée les clients.
  - Routes : `/api/cron/commits` et `/api/cron/report` (GET, Vercel Cron) ; `/api/actions/commits`,
    `/api/actions/report`, `/api/actions/close-week` (POST, future UI).
  - `vercel.json` : schedules `0 13 * * *` et `30 13 * * 5` (UTC) = 16h00 quotidien et vendredi
    16h30 à Antananarivo, à l'identique de `code.gs`.
- Suite : **139 tests verts** (+31), `typecheck` et `lint` OK.

- **Phase 7 — UI (terminée)** : les 4 écrans de l'application, sous `src/app/(app)/`.
  - **Fondations** : shadcn/ui installé (Tailwind v4 / React 19), `layout.tsx` en `lang="fr"` avec
    titre réel, coque `(app)/layout.tsx` + navigation, `/` redirige vers `/notes`.
  - **Éditeur de notes** (TDD, 12 tests) : les 7 sections de `SECTION_KEYS`, placeholders portés de
    `code.gs`, **autosave debounce 800 ms par section**, états par section
    (enregistrement / enregistré / échec), **garde anti-course** (le retour d'un enregistrement
    obsolète n'écrase pas l'état d'une saisie plus récente), section `commits` en **lecture seule**
    (le cron GitHub la réécrit) — refusée aussi côté Server Action.
  - **Aperçu rapport** (TDD, 8 tests) : onglets court / long, validation Zod des colonnes
    `long_json` / `short_json` (typées `unknown`) via `parseStoredReport` — un JSON hors schéma
    donne un encart « illisible », pas un plantage ; bouton **Générer** réellement câblé, échec
    affiché.
  - **Réglages** (TDD, 19 tests) : identité / destinataires / CC / sujet du fil / provider IA ;
    CRUD projets (**rôle obligatoire** — le prompt impose un respect strict des rôles) ; CRUD dépôts
    avec validation du format `owner/repo`.
  - **Historique** (TDD, 5 tests) : une ligne par semaine, statut en français, lien Google Doc,
    état vide.
  - **Repositories manquants** (TDD) : `listProjects` + CRUD projets, `listRepos` + CRUD dépôts,
    `listReports`, `listWeeks` — les écrans Réglages et Historique en avaient besoin.
  - **`domain/history.ts`** (TDD, pur) : `joinReportsToWeeks` — jointure en mémoire (le type
    `Database` fait main type mal les selects imbriqués), semaines sans rapport en `pending`,
    rapports orphelins ignorés.
  - **`api/operations.ts`** : extraction du métier hors de `handlers.ts`, résultat discriminé
    (`ok` / `no_week` / `error`) au lieu d'une `Response`. Permet au bouton « Générer » d'appeler
    `runReport` **en process**. `handlers.ts` ne garde que l'auth et le mapping HTTP ; les tests
    Phase 6 restent verts **sans modification**.
  - `ReportStatus` déplacé dans le domaine (comme `SectionKey`) pour garder le sens `lib → domain`.
- Suite : **225 tests verts** (+86), `typecheck`, `lint` et `next build` OK.

### Configuré
- **Setup des comptes terminé** : `.env.local` rempli (hors git) — Supabase, Google OAuth + Drive,
  Gemini, Groq, GitHub, `CRON_SECRET` généré. Connectivité vérifiée : **GitHub** et **Groq** OK (200) ;
  Gemini/Google/Supabase à valider au runtime (googleapis injoignable depuis le shell de dev).

### À venir
- **Auth Google** (Phase 8), **PWA/déploiement** (Phase 9).
- Étapes manuelles à faire côté comptes : **corriger `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`
  (voir `NEXT_SESSION.md`)**, appliquer la migration Supabase, config OAuth Google,
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
