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
- **Phase 1 — Domaine** : `src/domain/dates.ts` (`formaterDateFR`, `getLibelleSemaine`,
  `getLibelleSemaineProchaine`) portées de `code.gs` avec date de référence injectable — 6 tests verts (TDD).

### À venir
- Phase 1 (suite) : `src/domain/notes.ts` (modèle de sections + agrégation → texte prompt).

---

<!--
Modèle d'entrée à copier lors d'une release :

## [x.y.z] - AAAA-MM-JJ
### Ajouté
### Modifié
### Corrigé
### Supprimé
-->
