# Delivery

PWA mono-utilisateur qui centralise mes **notes d'activité**, génère mes **rapports de stage
hebdomadaires** avec l'IA, et prépare leur envoi (**brouillon Gmail** dans le fil + **Google Doc**
dans Drive). Successeur de l'ancien script Google Apps Script (`code.gs`).

## Ce que fait l'app
- ✍️ Éditeur de notes hebdo synchronisé sur tous mes appareils (base cloud)
- 🔧 Import automatique quotidien de mes commits GitHub (repos configurables)
- 🤖 Génération IA de deux versions du rapport (long + court) à partir des notes
- 📄 Rapport long créé comme **Google Doc** dans mon Drive (lien mis dans l'email)
- 📧 Brouillon Gmail préparé dans le fil « Rapport de stage » — **je relis et j'envoie moi-même**

## Stack
Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + Auth) ·
Google APIs (Gmail/Drive/Docs) · GitHub API · IA pluggable (Gemini par défaut / Groq) ·
Vitest + Playwright · déploiement Vercel.

## Démarrer (dev, une fois scaffoldé)
```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run test                 # TDD (watch)
npm run dev
```

## Développement
- **Méthode : TDD strict** → `docs/TDD_WORKFLOW.md`
- **Plan & roadmap** → `docs/PLAN.md`
- **Architecture** → `docs/ARCHITECTURE.md`
- **Reprendre le dev** → lire `NEXT_SESSION.md` puis suivre la prochaine action
- **Conventions Claude** → `CLAUDE.md`
- **Fin de session** → commande `/handoff`

> `code.gs` est conservé comme **référence fonctionnelle** jusqu'à parité complète.
