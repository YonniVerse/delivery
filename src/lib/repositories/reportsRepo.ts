/** Accès à la table `reports` (un rapport par semaine). */
import type { DbClient } from "@/lib/supabase/client";
import type { ReportRow } from "@/lib/supabase/types";

export async function getReportForWeek(
  client: DbClient,
  weekId: string,
): Promise<ReportRow | null> {
  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("week_id", weekId)
    .maybeSingle();
  if (error) throw new Error(`getReportForWeek: ${error.message}`);
  return (data as ReportRow) ?? null;
}

export async function upsertReport(
  client: DbClient,
  weekId: string,
  patch: Partial<Omit<ReportRow, "id" | "week_id">>,
): Promise<ReportRow> {
  const { data, error } = await client
    .from("reports")
    .upsert({ week_id: weekId, ...patch }, { onConflict: "week_id" })
    .select("*")
    .single();
  if (error) throw new Error(`upsertReport: ${error.message}`);
  return data as ReportRow;
}
