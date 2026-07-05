# NEXT_SESSION — Reprise du développement

> Lis ce fichier en premier au démarrage d'une session Claude. Il te donne l'état exact du projet
> et la prochaine action. Mets-le à jour en fin de session via la commande `/handoff`.

## 🎯 Projet en une phrase
**Delivery** : PWA mono-utilisateur (Next.js + Supabase) qui centralise notes d'activité, génération
IA de rapports de stage hebdo, et envoi (brouillon Gmail + Google Doc Drive). Migration de `code.gs`.

## 📍 État actuel
- **Phases 0-4 terminées ✅** (tout l'automatisable/pur) · Prochaine : **setup des comptes** puis wiring
- **Fait** : Scaffolding Next.js 16 + Vitest · skills `find-skills` + `frontend-design` ·
  **Domaine** (`dates`, `notes`, `prompt`, `reportSchema`) · **Providers IA** (`gemini`, `groq`) +
  `generateReport` · **GitHub** (`fetchCommits`, `dedupeCommits`, `formatCommitsForNotes`) ·
  **Rapport** (`buildEmailHtml`, `buildLongReportBlocks`, helpers `gmailThread`).
- **Santé** : `npm run test:run` → **57 tests verts** · `typecheck` OK · `lint` OK.
- Guide de setup : voir **`docs/SETUP.md`**.

## 🧭 Décisions verrouillées (ne pas re-débattre)
- Next.js 15 (App Router, TS strict) · PWA · Tailwind + shadcn/ui
- Notes en base **Supabase Postgres** (plus de Google Doc pour les notes)
- IA **pluggable** : défaut **Gemini 2.5 Flash** (gratuit), alt **Groq**
- Rapport long = **Google Doc dans Drive** (lien dans l'email)
- Email = **brouillon Gmail** dans le fil, aperçu in-app, **envoi manuel par l'utilisateur**
- Auth **Google OAuth** (scopes Gmail + Drive/Docs), **mono-utilisateur**
- Hébergement **Vercel** + Cron ; commits GitHub auto quotidien + repos configurables
- **TDD strict** (Red → Green → Refactor) — voir `docs/TDD_WORKFLOW.md`

## ▶️ Prochaine action — Setup des comptes (avec l'utilisateur)
Suivre **`docs/SETUP.md`** pour obtenir les secrets, puis les mettre dans `.env.local` :
1. **Supabase** — créer le projet → URL + anon key + service role key ; appliquer le schéma SQL.
2. **Google Cloud** — projet + écran de consentement OAuth (test users) + identifiants OAuth
   (scopes `gmail.compose`, `drive.file`, `documents`, `openid email profile`).
3. **Gemini** — clé API (aistudio.google.com/apikey, gratuit).
4. **GitHub** — token (fine-grained, lecture des repos) + username.
5. **Vercel** — projet + `CRON_SECRET` (au moment du déploiement).

> Une fois les clés en place → wiring en TDD (mocks pour les tests) des clients :
> `google/docs.ts` (créer le Doc long dans Drive à partir des blocs), `google/gmail.ts`
> (créer le brouillon threadé), Supabase repositories, puis routes `api/cron/*`.

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
