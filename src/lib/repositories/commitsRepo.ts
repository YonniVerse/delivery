/** Accès à la table `commits` (upsert idempotent par week_id,repo,sha). */
import type { DbClient } from "@/lib/supabase/client";
import type { CommitRow } from "@/lib/supabase/types";

export interface CommitInsert {
  week_id: string;
  repo: string;
  sha: string;
  message: string;
  committed_at?: string | null;
}

export async function insertCommits(
  client: DbClient,
  rows: CommitInsert[],
): Promise<CommitRow[]> {
  if (rows.length === 0) return [];
  const { data, error } = await client
    .from("commits")
    .upsert(rows, { onConflict: "week_id,repo,sha", ignoreDuplicates: true })
    .select("*");
  if (error) throw new Error(`insertCommits: ${error.message}`);
  return (data as CommitRow[]) ?? [];
}

export async function listCommitsForWeek(client: DbClient, weekId: string): Promise<CommitRow[]> {
  const { data, error } = await client
    .from("commits")
    .select("*")
    .eq("week_id", weekId)
    .order("committed_at", { ascending: true });
  if (error) throw new Error(`listCommitsForWeek: ${error.message}`);
  return (data as CommitRow[]) ?? [];
}
