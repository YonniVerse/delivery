/** Cron quotidien : import des commits GitHub du jour. Déclenché par Vercel Cron. */
import { buildImportCommitsCtx } from "@/lib/api/deps";
import { handleImportCommits } from "@/lib/api/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request): Promise<Response> {
  return handleImportCommits(req, buildImportCommitsCtx());
}
