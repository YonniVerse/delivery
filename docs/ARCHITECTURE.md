# Architecture — Delivery

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA (Next.js, Vercel)                     │
│  UI React ── Route Handlers /api ── Cron (/api/cron/*)       │
└───────┬───────────────┬───────────────┬────────────┬────────┘
        │               │               │            │
   Supabase        Google APIs       GitHub       LLM Provider
 (Postgres+Auth)  (Gmail/Drive/Docs)  REST      (Gemini | Groq)
```

- **Front + Back** dans une même app Next.js (App Router). Le back = Route Handlers.
- **Supabase** : persistance (notes, réglages, rapports…) + Auth Google (fournit aussi les tokens
  pour Gmail/Drive/Docs via scopes étendus).
- **Vercel Cron** appelle des Route Handlers protégés pour les tâches planifiées.

## Structure de dossiers (cible)

```
src/
  domain/            # Logique PURE, sans I/O — testée en premier (TDD)
    dates.ts         # libellés de semaine FR, formatage
    notes.ts         # modèle de sections, agrégation → texte prompt
    prompt.ts        # construction du prompt IA (repris de code.gs)
    reportSchema.ts  # schémas Zod long/court + parser tolérant
  lib/               # Intégrations (I/O), clients — mockées en test
    llm/             # LlmProvider, GeminiProvider, GroqProvider
    github/          # client commits
    google/          # drive/docs (rapport long) + gmail (brouillon threadé) + oauth
    supabase/        # client typé (anon + service-role)
    repositories/    # accès tables typés (settings, weeks, notes, commits, reports, oauth_tokens)
    orchestration/   # importDailyCommits, runWeeklyReport, closeWeek (deps injectées)
    api/             # operations (métier), handlers (HTTP), auth (garde Bearer), googleAuth, deps
    env.ts           # lecture env validée (Zod)
  components/        # ui/ (shadcn) + EtatMessage (encart erreur/vide partagé)
  app/               # Next.js App Router
    (app)/           # pages : notes, rapport, reglages, historique (+ actions.ts par écran)
    api/actions/     # Route Handlers UI (POST) : commits, report, close-week
    api/cron/        # commits, report (GET, protégés par secret Cron)
```

**Découplage opérations / transport** : le métier vit dans `lib/api/operations.ts` et reçoit ses
dépendances par un `ctx` (client, orchestration, provider IA) ; il renvoie un résultat discriminé
(`ok` / `no_week` / `error`), pas une `Response`. `lib/api/handlers.ts` n'ajoute que le garde d'auth
et la traduction en JSON ; les `app/api/**/route.ts` sont des délégations d'une ligne. Seul
`lib/api/deps.ts` lit l'environnement et crée les clients — d'où des opérations testables sans env
ni réseau, et réutilisables **en process** par les Server Actions de l'UI.

**Sens des dépendances** : `lib → domain`, jamais l'inverse. `lib/supabase/types.ts` importe
`SectionKey` et `ReportStatus` du domaine ; `domain/history.ts` décrit ses entrées structurellement
plutôt que d'importer les Row.

**UI (Phase 7)** : lecture par Server Component, écriture par Server Action, toutes deux via le
client **service-role**. Ce n'est pas un choix de style : la RLS vise `authenticated`, l'auth arrive
en Phase 8, et le navigateur ne peut pas détenir `CRON_SECRET`. ⚠️ Sans auth, service-role = accès
total pour qui atteint l'URL — **ne pas déployer avant la Phase 8**.
Les composants sont présentationnels : données et fonctions de sauvegarde arrivent **en props**
(même principe d'injection que le `ctx` des opérations), ce qui les rend testables sans Supabase.
Chaque page isole son chargement du rendu (`charger()` → état discriminé) : un `try/catch` autour du
JSON n'attraperait pas les erreurs de rendu, et une base injoignable doit donner un encart lisible,
pas une stack trace.

## Flux détaillés

### A. Import commits (Cron quotidien + bouton)
1. Cron `/api/cron/commits` (auth via `CRON_SECRET`).
2. Pour chaque `repos.active` → `githubClient.fetchCommits(repo, jour, auteur)`.
3. Dédup par `sha` (déjà en base ?) → insert `commits` + rattacher à la semaine courante.
4. Idempotent : relancer le même jour ne crée pas de doublon.

### B. Génération du rapport (Cron vendredi + bouton "Générer")
1. Charger notes de la semaine (sections + commits) → `notes.toPromptText()`.
2. `prompt.build(notes, settings.projects)` → `LlmProvider.generate()`.
3. `reportSchema.parse()` (strip ```json, valide long+court, mono/multi-projets).
4. Créer **Google Doc long** (Drive/Docs API) → récupérer l'URL.
5. Créer **brouillon Gmail** (réponse dans le fil : In-Reply-To/References du dernier message tiers)
   avec le rapport court + lien Drive.
6. Enregistrer `reports` (long_json, short_json, drive_url, gmail_draft_id, status=`draft_created`).
7. **L'utilisateur relit et envoie depuis Gmail** (l'app n'envoie pas).

### C. Clôture de semaine
Marquer `weeks.status=archived`, créer la semaine suivante avec sections vierges.

## Auth & sécurité
- Connexion **Google OAuth** (Supabase Auth) avec scopes : `gmail.compose`, `drive.file`,
  `documents`, profil e-mail. Refresh token stocké côté serveur (chiffré).
- Mono-utilisateur : verrouiller l'accès à l'e-mail autorisé. RLS activé sur toutes les tables.
- Route Cron protégées par `CRON_SECRET` (header). Secrets uniquement via env.

## Mapping avec `code.gs` (parité fonctionnelle)
| `code.gs` | Nouveau module |
|---|---|
| `recupererCommitsDepot` | `lib/github/client.ts` |
| `genererDeuxVersionsAvecGroq` + prompt | `domain/prompt.ts` + `lib/llm/*` |
| parsing JSON réponse | `domain/reportSchema.ts` |
| `creerDocRapportLong` | `lib/google/driveDoc.ts` |
| `creerBrouillonReponse` + threading | `lib/google/gmailDraft.ts` |
| `formaterDateFR`, `getLibelleSemaine*` | `domain/dates.ts` |
| `installerDeclencheur` | Vercel Cron (`api/cron/*`) |
| notes Google Doc | tables `notes`/`weeks` (Supabase) |
