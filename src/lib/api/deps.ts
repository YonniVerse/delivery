/**
 * Composition root des routes serveur : assemble les vraies implémentations en
 * contextes de handler. C'est le SEUL endroit qui lit l'environnement et crée
 * les clients — tout le reste reçoit ses dépendances par injection.
 *
 * Le client Supabase utilisé est celui à clé service-role : le Cron n'a pas de
 * session utilisateur et doit contourner la RLS.
 *
 * Server-only : ne jamais importer ce module depuis un composant client — il
 * expose la clé service-role et les secrets d'env.
 */
import { getEnv } from "@/lib/env";
import { createServiceSupabase } from "@/lib/supabase/client";
import { createLlmProvider } from "@/lib/llm";
import { fetchCommits } from "@/lib/github/client";
import { createLongReport } from "@/lib/google/docs";
import { createReplyDraft, getGmailThread } from "@/lib/google/gmail";
import { generateReport } from "@/lib/report/generate";
import { insertCommits, listCommitsForWeek } from "@/lib/repositories/commitsRepo";
import { listNotesForWeek, upsertSection } from "@/lib/repositories/notesRepo";
import { listActiveProjects } from "@/lib/repositories/projectsRepo";
import { getReportForWeek, upsertReport } from "@/lib/repositories/reportsRepo";
import { listActiveRepos } from "@/lib/repositories/reposRepo";
import { getSettings } from "@/lib/repositories/settingsRepo";
import { getActiveWeek, createWeek, setWeekStatus } from "@/lib/repositories/weeksRepo";
import { importDailyCommits, runWeeklyReport, closeWeek } from "@/lib/orchestration";
import { resolveAccessToken } from "./googleAuth";
import type { ImportCommitsCtx, ReportCtx, CloseWeekCtx } from "./handlers";

export function buildImportCommitsCtx(): ImportCommitsCtx {
  const env = getEnv();
  return {
    client: createServiceSupabase(),
    secret: env.CRON_SECRET,
    getActiveWeek,
    listActiveRepos,
    importDailyCommits,
    deps: { fetchCommits, insertCommits, listCommitsForWeek, upsertSection },
    opts: { githubToken: env.GITHUB_TOKEN, githubAuthor: env.GITHUB_USERNAME },
  };
}

export function buildReportCtx(): ReportCtx {
  const env = getEnv();
  const apiKey = env.LLM_PROVIDER === "gemini" ? env.GEMINI_API_KEY : env.GROQ_API_KEY;
  // `loadEnv` garantit déjà la présence de la clé du provider sélectionné.
  if (!apiKey) throw new Error(`Clé API manquante pour le provider ${env.LLM_PROVIDER}.`);

  return {
    client: createServiceSupabase(),
    secret: env.CRON_SECRET,
    getActiveWeek,
    resolveAccessToken: (client) =>
      resolveAccessToken(client, {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    runWeeklyReport,
    deps: {
      listNotesForWeek,
      getSettings,
      listActiveProjects,
      generateReport,
      upsertReport,
      getReportForWeek,
      createLongReport,
      createReplyDraft,
      getGmailThread: (accessToken, threadId) => getGmailThread(accessToken, threadId),
    },
    llmProvider: createLlmProvider({ provider: env.LLM_PROVIDER, apiKey }),
  };
}

export function buildCloseWeekCtx(): CloseWeekCtx {
  const env = getEnv();
  return {
    client: createServiceSupabase(),
    secret: env.CRON_SECRET,
    getActiveWeek,
    closeWeek,
    deps: { setWeekStatus, createWeek },
  };
}
