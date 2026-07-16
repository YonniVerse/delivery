/**
 * Opérations métier des routes serveur, indépendantes du transport HTTP.
 *
 * Elles renvoient un résultat discriminé plutôt qu'une `Response` : les Route
 * Handlers les traduisent en JSON, les Server Actions de l'UI les appellent
 * directement, en process — inutile de passer par HTTP pour s'appeler soi-même.
 *
 * Toutes les dépendances arrivent par le contexte : aucune lecture d'env, aucun
 * client construit ici. Le câblage réel vit dans `deps.ts`.
 */
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow, RepoRow } from "@/lib/supabase/types";
import type { LlmProvider } from "@/lib/llm";
import type {
  ImportDailyCommitsDeps,
  ImportDailyCommitsOpts,
  ImportDailyCommitsResult,
  RunWeeklyReportDeps,
  RunWeeklyReportResult,
  CloseWeekDeps,
  CloseWeekResult,
} from "@/lib/orchestration";

/** Champs communs à tous les contextes. */
export interface BaseCtx {
  client: DbClient;
  secret: string;
  getActiveWeek: (client: DbClient) => Promise<WeekRow | null>;
}

export interface ImportCommitsCtx extends BaseCtx {
  listActiveRepos: (client: DbClient) => Promise<RepoRow[]>;
  importDailyCommits: (
    client: DbClient,
    week: WeekRow,
    repos: RepoRow[],
    deps: ImportDailyCommitsDeps,
    opts: ImportDailyCommitsOpts,
  ) => Promise<ImportDailyCommitsResult>;
  deps: ImportDailyCommitsDeps;
  opts: ImportDailyCommitsOpts;
}

export interface ReportCtx extends BaseCtx {
  resolveAccessToken: (client: DbClient) => Promise<string>;
  runWeeklyReport: (
    client: DbClient,
    week: WeekRow,
    deps: RunWeeklyReportDeps,
    opts: { accessToken: string; llmProvider: LlmProvider },
  ) => Promise<RunWeeklyReportResult>;
  deps: RunWeeklyReportDeps;
  llmProvider: LlmProvider;
}

export interface CloseWeekCtx extends BaseCtx {
  closeWeek: (client: DbClient, week: WeekRow, deps: CloseWeekDeps) => Promise<CloseWeekResult>;
  deps: CloseWeekDeps;
}

export type OperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "no_week" | "error"; message: string };

export const AUCUNE_SEMAINE =
  "Aucune semaine active. Appliquez la migration Supabase et créez une semaine avant de continuer.";

/**
 * Enveloppe commune : semaine active → traitement.
 * Les erreurs sont loguées côté serveur mais jamais renvoyées telles quelles
 * (elles peuvent contenir des jetons ou des URL internes).
 */
async function withWeek<T>(
  ctx: BaseCtx,
  nom: string,
  traiter: (week: WeekRow) => Promise<T>,
): Promise<OperationResult<T>> {
  try {
    const week = await ctx.getActiveWeek(ctx.client);
    if (!week) return { ok: false, code: "no_week", message: AUCUNE_SEMAINE };

    return { ok: true, data: await traiter(week) };
  } catch (err) {
    console.error(`[${nom}]`, err);
    return {
      ok: false,
      code: "error",
      message: `Échec de l'opération « ${nom} ». Voir les logs serveur.`,
    };
  }
}

export function runImportCommits(
  ctx: ImportCommitsCtx,
): Promise<OperationResult<ImportDailyCommitsResult>> {
  return withWeek(ctx, "import des commits", async (week) => {
    const repos = await ctx.listActiveRepos(ctx.client);
    return ctx.importDailyCommits(ctx.client, week, repos, ctx.deps, ctx.opts);
  });
}

export function runReport(ctx: ReportCtx): Promise<OperationResult<RunWeeklyReportResult>> {
  return withWeek(ctx, "génération du rapport", async (week) => {
    const accessToken = await ctx.resolveAccessToken(ctx.client);
    return ctx.runWeeklyReport(ctx.client, week, ctx.deps, {
      accessToken,
      llmProvider: ctx.llmProvider,
    });
  });
}

export function runCloseWeek(ctx: CloseWeekCtx): Promise<OperationResult<CloseWeekResult>> {
  return withWeek(ctx, "clôture de la semaine", (week) =>
    ctx.closeWeek(ctx.client, week, ctx.deps),
  );
}
