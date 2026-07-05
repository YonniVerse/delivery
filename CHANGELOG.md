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
- Suite : **57 tests verts**, `typecheck` et `lint` OK.

### Configuré
- **Setup des comptes terminé** : `.env.local` rempli (hors git) — Supabase, Google OAuth + Drive,
  Gemini, Groq, GitHub, `CRON_SECRET` généré. Connectivité vérifiée : **GitHub** et **Groq** OK (200) ;
  Gemini/Google/Supabase à valider au runtime (googleapis injoignable depuis le shell de dev).

### À venir
- Wiring **Supabase** (schéma SQL + RLS + repositories en TDD), puis clients Google (Docs/Gmail) + Cron.

---

<!--
Modèle d'entrée à copier lors d'une release :

## [x.y.z] - AAAA-MM-JJ
### Ajouté
### Modifié
### Corrigé
### Supprimé
-->
