/** Accès à la table `repos` (dépôts GitHub suivis pour l'import des commits). */
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

/** Tous les dépôts, y compris inactifs : l'écran Réglages doit pouvoir les réactiver. */
export async function listRepos(client: DbClient): Promise<RepoRow[]> {
  const { data, error } = await client.from("repos").select("*");
  if (error) throw new Error(`listRepos: ${error.message}`);
  return (data as RepoRow[]) ?? [];
}

export async function createRepo(client: DbClient, fullName: string): Promise<RepoRow> {
  const { data, error } = await client
    .from("repos")
    .insert({ full_name: fullName, active: true })
    .select("*")
    .single();
  if (error) throw new Error(`createRepo: ${error.message}`);
  return data as RepoRow;
}

export async function updateRepo(
  client: DbClient,
  id: string,
  patch: Partial<Omit<RepoRow, "id" | "created_at">>,
): Promise<RepoRow> {
  const { data, error } = await client
    .from("repos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateRepo: ${error.message}`);
  return data as RepoRow;
}

export async function deleteRepo(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("repos").delete().eq("id", id);
  if (error) throw new Error(`deleteRepo: ${error.message}`);
}
