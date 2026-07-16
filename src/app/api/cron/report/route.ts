/** Cron hebdomadaire : génération du rapport + Google Doc + brouillon Gmail. */
import { buildReportCtx } from "@/lib/api/deps";
import { handleReport } from "@/lib/api/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request): Promise<Response> {
  return handleReport(req, buildReportCtx());
}
