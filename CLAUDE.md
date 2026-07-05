# CLAUDE.md — Conventions du projet Delivery

Ce fichier cadre le développement assisté par IA. **Lis `NEXT_SESSION.md` en premier** à chaque
reprise pour l'état courant et la prochaine action.

## Le projet
PWA mono-utilisateur (Next.js + Supabase) qui centralise notes d'activité → génération IA de
rapports de stage hebdo → envoi (brouillon Gmail + Google Doc Drive). Migration de `code.gs`.
Détails : `docs/PLAN.md` · Architecture : `docs/ARCHITECTURE.md`.

## Règle n°1 : TDD strict
Aucun code de production sans test qui échoue d'abord. Boucle **Red → Green → Refactor**
(détaillée dans `docs/TDD_WORKFLOW.md`). On commence par la **logique pure** (`src/domain/`)
avant les intégrations. Les I/O externes (GitHub, Google, IA) sont **mockées** en test.

## Conventions
- **TypeScript strict** partout, pas de `any` implicite. Valider les I/O et réponses IA avec **Zod**.
- **Structure** : `src/domain/` (logique pure, sans I/O) · `src/lib/` (intégrations, clients) ·
  `src/app/` (UI + Route Handlers) · tests à côté du code (`*.test.ts`).
- **Secrets** : jamais en dur ni committés. Tout passe par l'env (voir `.env.example`), lu via un
  module typé. `.env*` reste dans `.gitignore`.
- **Ne pas supprimer `code.gs`** : c'est la référence fonctionnelle jusqu'à parité complète.
- Réutiliser le **prompt IA** et la logique de **threading Gmail** de `code.gs` (ne pas réinventer).
- Respect **strict des rôles par projet** dans les rapports (dev ≠ testeur ≠ designer).

## Commandes (après Phase 0)
```
npm run test        # Vitest en watch (mode TDD par défaut)
npm run test:run    # une passe (CI)
npm run typecheck   # tsc --noEmit
npm run lint
npm run dev
```

## Fin de session
Lance `/handoff` : met à jour `CHANGELOG.md` (section Non publié) et `NEXT_SESSION.md`
(état + prochaine action), vérifie tests/typecheck, puis propose un commit.

## Git
Branche par fonctionnalité. Commits clairs et atomiques. Ne committer que sur demande de l'utilisateur.
