# NEXT_SESSION — Reprise du développement

> Lis ce fichier en premier au démarrage d'une session Claude. Il te donne l'état exact du projet
> et la prochaine action. Mets-le à jour en fin de session via la commande `/handoff`.

## 🎯 Projet en une phrase
**Delivery** : PWA mono-utilisateur (Next.js + Supabase) qui centralise notes d'activité, génération
IA de rapports de stage hebdo, et envoi (brouillon Gmail + Google Doc Drive). Migration de `code.gs`.

## 📍 État actuel
- **Phase** : 0 terminée ✅ · Phase 1 (Domaine) **en cours**
- **Fait** : Analyse `code.gs` ✅ · Archi verrouillée ✅ · Docs ✅ · Scaffolding Next.js 16 + Vitest ✅ ·
  skill `find-skills` installé ✅ · `src/domain/dates.ts` (TDD, 6 tests verts) ✅ · typecheck OK ✅
- **Toolchain vérifié** : `npm run test:run` et `npm run typecheck` passent.

## 🧭 Décisions verrouillées (ne pas re-débattre)
- Next.js 15 (App Router, TS strict) · PWA · Tailwind + shadcn/ui
- Notes en base **Supabase Postgres** (plus de Google Doc pour les notes)
- IA **pluggable** : défaut **Gemini 2.5 Flash** (gratuit), alt **Groq**
- Rapport long = **Google Doc dans Drive** (lien dans l'email)
- Email = **brouillon Gmail** dans le fil, aperçu in-app, **envoi manuel par l'utilisateur**
- Auth **Google OAuth** (scopes Gmail + Drive/Docs), **mono-utilisateur**
- Hébergement **Vercel** + Cron ; commits GitHub auto quotidien + repos configurables
- **TDD strict** (Red → Green → Refactor) — voir `docs/TDD_WORKFLOW.md`

## ▶️ Prochaine action (Phase 1 — suite)
TDD `src/domain/notes.ts` :
1. **Red** — écrire `notes.test.ts` : modèle de sections (Points importants, Tâches réalisées,
   Points de blocage, Objectifs semaine prochaine, Tests effectués, Livrables produits, Commits GitHub)
   + fonction d'agrégation `notesToPromptText(sections)` → texte brut prêt pour le prompt IA
   (ignore les sections vides, ordre stable). Vérifier qu'il échoue.
2. **Green** — implémenter le minimum.
3. **Refactor** + `npm run typecheck`.

> Ensuite dans l'ordre Phase 1 : `prompt.ts` (repris de code.gs) puis `reportSchema.ts` (Zod).
> Restent aussi de Phase 0 (à faire quand utile) : `src/lib/env.ts` (env typé Zod), Supabase, Playwright.

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
