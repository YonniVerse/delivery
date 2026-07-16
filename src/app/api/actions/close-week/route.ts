/** Action UI : clôture de la semaine courante et ouverture de la suivante. */
import { buildCloseWeekCtx } from "@/lib/api/deps";
import { handleCloseWeek } from "@/lib/api/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return handleCloseWeek(req, buildCloseWeekCtx());
}
