# NEXT_SESSION — Reprise du développement

> Lis ce fichier en premier au démarrage d'une session Claude. Il te donne l'état exact du projet
> et la prochaine action. Mets-le à jour en fin de session via la commande `/handoff`.

## 🎯 Projet en une phrase
**Delivery** : PWA mono-utilisateur (Next.js + Supabase) qui centralise notes d'activité, génération
IA de rapports de stage hebdo, et envoi (brouillon Gmail + Google Doc Drive). Migration de `code.gs`.

## 📍 État actuel
- **Phases 0-4 + setup des comptes terminés ✅** · Prochaine : **wiring Supabase** (schéma SQL)
- **Fait (code)** : Scaffolding Next.js 16 + Vitest · skills `find-skills` + `frontend-design` ·
  **Domaine** (`dates`, `notes`, `prompt`, `reportSchema`) · **Providers IA** (`gemini`, `groq`) +
  `generateReport` · **GitHub** (`fetchCommits`, `dedupeCommits`, `formatCommitsForNotes`) ·
  **Rapport** (`buildEmailHtml`, `buildLongReportBlocks`, helpers `gmailThread`).
- **Fait (setup)** : `.env.local` rempli et **hors git**. Connectivité vérifiée : **GitHub ✅**,
  **Groq ✅** (200). Gemini/Supabase/Google : clés en place, à valider au runtime.
- **Santé** : `npm run test:run` → **57 tests verts** · `typecheck` OK · `lint` OK.
- Guide de setup : `docs/SETUP.md`.

## ⚠️ Pièges rencontrés (à retenir)
- **`.env.local`** : ne pas mettre de quotes ni d'espaces autour des valeurs (a cassé le token
  GitHub, puis Groq). Un `awk` de normalisation existe dans l'historique de la conversation si besoin.
- **googleapis injoignable depuis le shell sandbox** (DNS IPv6 only, pas de route) : impossible de
  tester Gemini/Gmail/Drive/Docs en local ici → **valider sur Vercel** ou navigateur. GitHub/Groq/Supabase, eux, sont joignables.
- Ne pas confondre **Groq** (`gsk_`, api.groq.com, notre provider) et **Grok/xAI** (`xai-`).

## 🧭 Décisions verrouillées (ne pas re-débattre)
- Next.js 15 (App Router, TS strict) · PWA · Tailwind + shadcn/ui
- Notes en base **Supabase Postgres** (plus de Google Doc pour les notes)
- IA **pluggable** : défaut **Gemini 2.5 Flash** (gratuit), alt **Groq**
- Rapport long = **Google Doc dans Drive** (lien dans l'email)
- Email = **brouillon Gmail** dans le fil, aperçu in-app, **envoi manuel par l'utilisateur**
- Auth **Google OAuth** (scopes Gmail + Drive/Docs), **mono-utilisateur**
- Hébergement **Vercel** + Cron ; commits GitHub auto quotidien + repos configurables
- **TDD strict** (Red → Green → Refactor) — voir `docs/TDD_WORKFLOW.md`

## ▶️ Prochaine action — Wiring Supabase (schéma SQL)
Secrets prêts. Démarrer la persistance :
1. Écrire la **migration SQL** (`supabase/migrations/0001_init.sql`) avec les tables de `PLAN.md` §4
   (`settings`, `projects`, `repos`, `weeks`, `notes`, `commits`, `reports`, `oauth_tokens`) + **RLS**.
2. Installer `@supabase/supabase-js` ; **client typé** (`src/lib/supabase/client.ts`).
3. **Repositories** en TDD (mock du client Supabase) : commencer par `settingsRepo` puis `notesRepo`
   (le cœur — synchro des notes). Écrire le test d'abord.
4. Appliquer la migration sur le projet Supabase (SQL Editor ou CLI) et valider une lecture réelle.

> Ensuite : clients Google en TDD mockés (`google/docs.ts` → Doc long depuis les blocs,
> `google/gmail.ts` → brouillon threadé via helpers `gmailThread`), auth Google, routes `api/cron/*`.
> Rappel : tester Google **sur Vercel** (googleapis injoignable depuis le shell local).

## 🗂️ Fichiers de cadrage
- `docs/PLAN.md` — besoins, features, modèle de données, roadmap TDD complète
- `docs/ARCHITECTURE.md` — schéma, flux, structure de dossiers
- `docs/TDD_WORKFLOW.md` — la boucle TDD imposée
- `CHANGELOG.md` — journal des changements (format Keep a Changelog)
- `CLAUDE.md` — conventions projet pour Claude
- `code.gs` — script d'origine, **référence fonctionnelle** (parité à atteindre avant suppression)

## 🔑 Ce qu'il faudra comme secrets (plus tard, `.env.local`)
Supabase URL/keys · Google OAuth client id/secret · GitHub token · clé Gemini (ou Groq) · secret Cron.
Voir `.env.example`. **Ne jamais committer les vraies valeurs.**

## ⚠️ Pièges connus (repris de `code.gs`)
- Threading Gmail : répondre au dernier message **qui n'est pas de nous** (`Message-ID` → In-Reply-To/References).
- Anti-doublon commits (marqueur par date/sha) et rapports (ne pas régénérer).
- Libellés de semaine FR + fuseau horaire.
- Respect **strict des rôles par projet** dans le prompt (dev vs testeur vs designer).

## ✅ Commandes utiles (une fois scaffoldé)
```
npm run test         # Vitest (watch pour TDD)
npm run test:run     # une passe CI
npm run typecheck    # tsc --noEmit
npm run lint
npm run dev          # Next.js
```
