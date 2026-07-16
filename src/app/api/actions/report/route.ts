/** Action UI : génération manuelle du rapport (même traitement que le cron). */
import { buildReportCtx } from "@/lib/api/deps";
import { handleReport } from "@/lib/api/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return handleReport(req, buildReportCtx());
}
