/**
 * Couche HTTP des routes serveur : garde d'auth, puis traduction du résultat
 * d'opération en réponse JSON.
 *
 * La logique métier vit dans `operations.ts` — elle est partagée avec les Server
 * Actions de l'UI, qui l'appellent en process sans passer par HTTP.
 */
import { isAuthorized, unauthorized } from "./auth";
import { runImportCommits, runReport, runCloseWeek } from "./operations";
import type { ImportCommitsCtx, ReportCtx, CloseWeekCtx, OperationResult } from "./operations";

export type { ImportCommitsCtx, ReportCtx, CloseWeekCtx };

/** `no_week` → 409 (état attendu, corrigible côté données) ; `error` → 500. */
function toResponse<T>(resultat: OperationResult<T>): Response {
  if (resultat.ok) return Response.json({ ok: true, ...resultat.data });

  return Response.json(
    { ok: false, error: resultat.message },
    { status: resultat.code === "no_week" ? 409 : 500 },
  );
}

export async function handleImportCommits(
  req: Request,
  ctx: ImportCommitsCtx,
): Promise<Response> {
  if (!isAuthorized(req, ctx.secret)) return unauthorized();
  return toResponse(await runImportCommits(ctx));
}

export async function handleReport(req: Request, ctx: ReportCtx): Promise<Response> {
  if (!isAuthorized(req, ctx.secret)) return unauthorized();
  return toResponse(await runReport(ctx));
}

export async function handleCloseWeek(req: Request, ctx: CloseWeekCtx): Promise<Response> {
  if (!isAuthorized(req, ctx.secret)) return unauthorized();
  return toResponse(await runCloseWeek(ctx));
}
