/** Accès à la table `repos` (liste des dépôts GitHub actifs). */
import type { DbClient } from "@/lib/supabase/client";
import type { RepoRow } from "@/lib/supabase/types";

export async function listActiveRepos(client: DbClient): Promise<RepoRow[]> {
  const { data, error } = await client
    .from("repos")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(`listActiveRepos: ${error.message}`);
  return (data as RepoRow[]) ?? [];
}
