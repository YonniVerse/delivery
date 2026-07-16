/** Action UI : import manuel des commits (même traitement que le cron). */
import { buildImportCommitsCtx } from "@/lib/api/deps";
import { handleImportCommits } from "@/lib/api/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return handleImportCommits(req, buildImportCommitsCtx());
}
