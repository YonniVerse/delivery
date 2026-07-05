# Setup des comptes & secrets — Delivery

Objectif : obtenir toutes les valeurs de `.env.example` et les mettre dans `.env.local`
(jamais committé). À faire une seule fois. Coche au fur et à mesure.

> Ordre conseillé : **1) Gemini** et **2) GitHub** (rapides, débloquent la génération) →
> **3) Supabase** (base + auth) → **4) Google Cloud OAuth** (Gmail/Drive/Docs) → **5) Vercel** (déploiement).

---

## 1. Gemini (IA, gratuit) — `GEMINI_API_KEY`
1. Aller sur https://aistudio.google.com/apikey (connecté avec ton Google).
2. « Create API key » → copier la clé.
3. `.env.local` : `GEMINI_API_KEY=...` · `LLM_PROVIDER=gemini`

## 2. GitHub — `GITHUB_TOKEN`, `GITHUB_USERNAME`
1. https://github.com/settings/personal-access-tokens → « Fine-grained token ».
2. Accès **Read-only** sur les dépôts à suivre (ou tous), permission **Contents: Read**.
3. Copier le token. `.env.local` : `GITHUB_TOKEN=...` · `GITHUB_USERNAME=<ton_login_github>`

## 3. Supabase (base de données + auth) — 3 clés
1. https://supabase.com → « New project » (région proche, ex. Europe). Noter le mot de passe DB.
2. Project Settings → **API** :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ secret serveur uniquement)
3. Le schéma SQL (tables de `docs/PLAN.md` §4) sera fourni en migration et appliqué via
   SQL Editor / CLI lors du wiring.

## 4. Google Cloud — OAuth Gmail/Drive/Docs
> Donne les jetons pour créer le Doc long (Drive/Docs) et le brouillon (Gmail).
1. https://console.cloud.google.com → créer un **projet** (ex. « delivery »).
2. **APIs & Services → Enable APIs** : activer **Gmail API**, **Google Drive API**, **Google Docs API**.
3. **OAuth consent screen** : type **External**, statut **Testing**, ajouter ton email en
   *test user*. Scopes à déclarer :
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/documents`
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized redirect URIs (dev) : `http://localhost:3000/api/auth/callback/google`
     (et l'URL Supabase Auth callback si on passe par Supabase Auth — à confirmer au wiring).
5. `.env.local` : `GOOGLE_CLIENT_ID=...` · `GOOGLE_CLIENT_SECRET=...`
6. Récupérer l'**ID du dossier Drive** des rapports (ouvrir le dossier, l'ID est dans l'URL) →
   `DRIVE_FOLDER_ID=...`

## 5. Vercel (déploiement + Cron) — au moment du déploiement
1. https://vercel.com → importer le repo `YonniVerse/delivery`.
2. Reporter toutes les variables de `.env.local` dans **Project → Settings → Environment Variables**.
3. Générer un secret aléatoire pour `CRON_SECRET` (ex. `openssl rand -hex 32`).
4. Les Cron seront déclarés dans `vercel.json` (commits quotidien + rapport hebdo).

---

## Valeurs déjà connues (config utilisateur)
```
REPORT_EMAIL_TO=assist-direction@mada-digital.net
REPORT_EMAIL_CC=direction@mada-digital.net
REPORT_THREAD_SUBJECT=Rapport de stage
APP_TIMEZONE=Indian/Antananarivo
```

## Rappels sécurité
- `.env.local` reste **hors git** (déjà dans `.gitignore`).
- La `service_role` Supabase et les secrets Google ne doivent **jamais** aller côté client.
- Tant qu'on est en *Testing* sur l'écran de consentement Google, seul ton compte (test user) peut
  autoriser l'app — parfait pour un usage mono-utilisateur.
