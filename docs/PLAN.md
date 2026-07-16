# Delivery — Plan de projet

> Application web (PWA) mono-utilisateur qui centralise la rédaction de notes d'activité,
> la génération assistée par IA de rapports de stage hebdomadaires, et leur envoi
> (brouillon Gmail + Google Doc dans Drive). Migration de l'ancien script Google Apps Script (`code.gs`).

- **Statut** : 🟡 Planification terminée — scaffolding à venir (Phase 0)
- **Méthode** : TDD strict (Red → Green → Refactor)
- **Dernière mise à jour** : 2026-07-05

---

## 1. Contexte & objectif

Yonni (stagiaire chez MADA-Digital) envoie chaque semaine un rapport d'activité. Aujourd'hui
c'est un script Apps Script (`code.gs`) qui : récupère les commits GitHub → les injecte dans un
Google Doc de notes → chaque vendredi, envoie les notes à une IA → génère un rapport long (Doc)
et un rapport court (brouillon Gmail en réponse dans un fil) → archive et réinitialise les notes.

**Limites de l'existant** : pas de vraie UI, notes coincées dans un Google Doc unique,
pas d'édition confortable multi-appareils, configuration en dur dans le code.

**Objectif** : une vraie app installable, synchronisée sur tous les appareils, qui centralise
tout le flux avec une bonne UX, tout en **conservant les acquis du script** (prompt IA soigné,
threading Gmail, rapport long dans Drive, import commits).

## 2. Décisions d'architecture (verrouillées)

| Dimension | Décision |
|---|---|
| Plateforme | Web app **Next.js 15 (App Router)** + TypeScript, installable en **PWA** |
| Notes | **Source de vérité = base Postgres (Supabase)**. Fini le Google Doc de notes |
| Email | App crée le **brouillon Gmail** (réponse dans le fil), aperçu in-app, **validation/envoi manuel dans Gmail** |
| Hébergement | **Vercel** (front + API + Cron), **Supabase** (Postgres + Auth) |
| Auth | Mono-utilisateur, **Google OAuth** (donne aussi les scopes Gmail + Drive/Docs) |
| IA | **Abstraction provider**. Défaut : **Gemini 2.5 Flash** (gratuit). Alt : **Groq** (llama-3.3-70b) |
| Rapport long | **Google Doc créé dans Drive** (via Docs/Drive API), lien inséré dans l'email |
| Commits GitHub | Import **auto quotidien** (Cron) + repos gérés dans les réglages + import manuel |

## 3. Stack technique

- **Framework** : Next.js 15 (App Router, Route Handlers), React 19, TypeScript strict
- **UI** : Tailwind CSS + shadcn/ui, éditeur de notes (textarea riche / sections)
- **PWA** : Web App Manifest + service worker (offline lecture + file d'attente d'écriture)
- **DB / Auth** : Supabase (Postgres, RLS, Auth Google avec scopes étendus)
- **Planification** : Vercel Cron → Route Handlers `/api/cron/*`
- **Intégrations** : Gmail API (drafts), Google Drive + Docs API, GitHub REST API
- **IA** : couche `LlmProvider` (Gemini | Groq), même prompt métier
- **Tests** : Vitest (unit/intégration) + Testing Library (composants) + Playwright (e2e). TDD via Vitest.
- **Qualité** : ESLint, Prettier, tsc `--noEmit`, Zod (validation des I/O et des réponses IA)

## 4. Modèle de données (Postgres)

```
settings        (singleton) nom_prenom, destinataires, cc, sujet_fil, timezone,
                            llm_provider, drive_folder_id, gmail_thread_id, schedules...
projects        id, nom, role, description                 -- contexte/rôles par projet
repos           id, full_name (owner/repo), active         -- repos GitHub suivis
weeks           id, label_fr, start_date, end_date, status -- semaine ISO
notes           week_id, section, content                  -- notes structurées par section
commits         week_id, repo, sha, message, committed_at  -- commits importés
reports         week_id, long_json, short_json, drive_url,
                            gmail_draft_id, status, generated_at, sent_at
oauth_tokens    provider, access_token, refresh_token, expiry, scopes   -- Google
secrets         github_token, llm_api_key (chiffrés / via env selon sensibilité)
```

Sections de notes (reprises du script) : *Points importants à mettre en avant*, *Tâches réalisées*,
*Points de blocage*, *Objectifs semaine prochaine*, *Tests effectués*, *Livrables produits*,
*Commits GitHub* (auto).

## 5. Features (portée v1)

1. **Éditeur de notes hebdo** — sections, autosave, synchro multi-appareils, offline-friendly.
2. **Import commits GitHub** — auto quotidien (Cron) + bouton manuel ; anti-doublon ; injecté dans la section commits.
3. **Réglages** — profil, destinataires/CC, sujet du fil, projets & rôles, repos GitHub, provider IA, horaires.
4. **Génération de rapport** — notes → IA → JSON (long + court) validé par Zod ; réutilise le prompt de `code.gs`.
5. **Aperçu in-app** — rendu du rapport court (email) et du rapport long avant création.
6. **Création du Google Doc long** dans Drive + récupération du lien.
7. **Création du brouillon Gmail** en réponse dans le fil (In-Reply-To/References), avec lien Drive.
8. **Archivage & nouvelle semaine** — clôture la semaine, prépare la suivante.
9. **Historique des rapports** — liste des semaines passées, liens Doc, statut d'envoi.
10. **PWA installable** — manifest, icônes, offline.

### Hors périmètre v1 (backlog)
- Multi-utilisateurs / partage équipe
- Notifications push
- Édition riche WYSIWYG avancée
- Export PDF (le long reste un Google Doc)

## 6. Flux principaux

**Quotidien (Cron ~16h)** : pour chaque repo actif → GitHub API commits du jour (auteur = user) →
dédup → insert `commits` + section notes de la semaine courante.

**Vendredi (Cron ~16h30) OU bouton "Générer"** : lire notes semaine → `LlmProvider.generate(prompt)` →
parse + valide JSON (Zod) → `reports.long_json/short_json` → créer Google Doc (Drive) → créer brouillon
Gmail (fil) → statut `draft_created`. **L'utilisateur relit et envoie depuis Gmail.**

**Clôture** : marquer la semaine `archived`, créer la semaine suivante avec sections vierges.

## 7. Roadmap TDD (jalons)

> Chaque tâche = écrire le test qui échoue (Red), le faire passer (Green), refactorer. Voir `docs/TDD_WORKFLOW.md`.

### Phase 0 — Scaffolding & infra
- [ ] Init Next.js + TS strict + Tailwind + shadcn/ui
- [ ] Config Vitest + Testing Library + Playwright ; script `test` ; premier test smoke
- [ ] ESLint/Prettier, `tsconfig` strict, structure de dossiers (`src/domain`, `src/lib`, `src/app`)
- [ ] `.env.example`, chargement env typé (Zod)
- [ ] Supabase : projet, schéma SQL (tables §4), migrations, client typé

### Phase 1 — Cœur métier (pur, testable sans I/O)
- [ ] `dates.ts` : `getLibelleSemaine`, `getLibelleSemaineProchaine`, `formaterDateFR` (tests FR, dimanche, changement de mois)
- [ ] `notes.ts` : modèle de sections, agrégation notes → texte brut pour le prompt
- [ ] `prompt.ts` : construction du prompt (repris de `code.gs`, contextes projets, un/plusieurs projets)
- [ ] `reportSchema.ts` : schémas Zod `long`/`court` (1 projet & multi-projets) + parser tolérant (strip ```json)

### Phase 2 — Provider IA (HTTP mocké)
- [ ] Interface `LlmProvider.generate(prompt): Promise<string>`
- [ ] `GeminiProvider` (défaut) — test avec fetch mocké, gestion d'erreur
- [ ] `GroqProvider` — test avec fetch mocké
- [ ] `generateReport(notes, settings)` : pipeline prompt → provider → parse/valide

### Phase 3 — GitHub
- [ ] `githubClient.fetchCommits(repo, since, until, author)` (fetch mocké : 200/401/404, pagination)
- [ ] `importCommits(week, repos)` : dédup par sha, mapping message/heure

### Phase 4 — Google (Drive/Docs + Gmail)
- [ ] `driveDoc.createLongReport(long, meta) → url` (API mockée)
- [ ] `gmailDraft.createReplyDraft(short, driveUrl, thread) → draftId` (In-Reply-To/References, mock)
- [ ] Gestion tokens OAuth (refresh) — test du refresh mocké

### Phase 5 — Orchestration & persistance
- [ ] Repositories Supabase (mock/integration) : settings, weeks, notes, commits, reports
- [ ] `runWeeklyReport(week)` : end-to-end mocké (notes → IA → Doc → draft → statut)
- [ ] `closeWeek(week)` : archivage + création semaine suivante

### Phase 6 — API & Cron
- [x] Route `/api/cron/commits` (auth cron, idempotent) + test
- [x] Route `/api/cron/report` + test
- [x] Routes actions UI : générer, importer commits, clôturer

> Garde commun `Authorization: Bearer CRON_SECRET` (`src/lib/api/auth.ts`), partagé par les routes
> cron et actions ; la Phase 8 remplacera le garde des actions par la session Supabase.
> Schedules dans `vercel.json` — **Vercel Cron est en UTC** : `0 13 * * *` et `30 13 * * 5`
> correspondent à 16h00 et vendredi 16h30 à Antananarivo (UTC+3), à l'identique de `code.gs`.
> Madagascar n'observe pas l'heure d'été : la correspondance est stable toute l'année.

### Phase 7 — UI
- [x] Éditeur de notes (autosave, sections) + tests composant
- [x] Écran Réglages (projets, repos, destinataires, provider)
- [x] Aperçu rapport (court + long) + bouton Générer
- [x] Historique des rapports

> Pages sous `src/app/(app)/` : `notes`, `rapport`, `reglages`, `historique`.
> **Lecture par Server Component, écriture par Server Action**, toutes deux avec le client
> service-role : la RLS vise `authenticated` et l'auth n'arrive qu'en Phase 8 — un client
> navigateur serait rejeté, et il ne peut pas détenir `CRON_SECRET`.
> ⚠️ Service-role + aucune auth = accès total pour qui atteint l'URL. **Ne pas déployer avant la
> Phase 8** (le déploiement est de toute façon en Phase 9).
> Composants présentationnels : ils reçoivent données et fonctions de sauvegarde **en props**, donc
> testables avec de simples espions — ni Supabase ni réseau en test.
> Le bouton « Générer » appelle `runReport` **en process** (`src/lib/api/operations.ts`), pas via
> HTTP sur notre propre route ; il échoue tant que `oauth_tokens` est vide (Phase 8) et l'affiche.

### Phase 8 — Auth & sécurité
- [ ] Google OAuth (Supabase) avec scopes Gmail/Drive/Docs
- [ ] Protection des routes, RLS, stockage chiffré des secrets

### Phase 9 — PWA & déploiement
- [ ] Manifest + service worker + icônes + offline
- [ ] Déploiement Vercel + Cron + variables d'env
- [ ] Playwright e2e du parcours complet (mocks externes)

## 8. Risques & points d'attention
- **Scopes Google sensibles** (gmail.compose, drive.file, documents) → écran de consentement, possible vérification Google. Rester en test users si mono-user.
- **Threading Gmail** : nécessite `Message-ID` du dernier message tiers (logique déjà présente dans `code.gs`, à porter).
- **Idempotence Cron** : anti-doublon commits + ne pas régénérer un rapport déjà créé.
- **Fuseau horaire** : les libellés de semaine et horaires Cron doivent utiliser le TZ configuré.
- **Quotas free tier** Gemini/Supabase/Vercel → suffisants pour un usage mono-utilisateur.

## 9. Références
- Ancien script : `code.gs` (source de vérité fonctionnelle, à ne pas supprimer avant parité)
- Prompt IA & format JSON : `code.gs` lignes ~298-421
- Threading Gmail : `code.gs` lignes ~476-561
