/** Accès à la table `projects` (liste des projets actifs). */
import type { DbClient } from "@/lib/supabase/client";
import type { ProjectRow } from "@/lib/supabase/types";

export async function listActiveProjects(client: DbClient): Promise<ProjectRow[]> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(`listActiveProjects: ${error.message}`);
  return (data as ProjectRow[]) ?? [];
}
