/** Accès à la table `projects` (projets et rôles tenus sur chacun). */
import type { DbClient } from "@/lib/supabase/client";
import type { ProjectRow } from "@/lib/supabase/types";

export interface CreateProjectInput {
  nom: string;
  role: string;
  description: string;
}

export async function listActiveProjects(client: DbClient): Promise<ProjectRow[]> {
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(`listActiveProjects: ${error.message}`);
  return (data as ProjectRow[]) ?? [];
}

/** Tous les projets, y compris inactifs : l'écran Réglages doit pouvoir les réactiver. */
export async function listProjects(client: DbClient): Promise<ProjectRow[]> {
  const { data, error } = await client.from("projects").select("*");
  if (error) throw new Error(`listProjects: ${error.message}`);
  return (data as ProjectRow[]) ?? [];
}

export async function createProject(
  client: DbClient,
  input: CreateProjectInput,
): Promise<ProjectRow> {
  const { data, error } = await client
    .from("projects")
    .insert({ ...input, active: true })
    .select("*")
    .single();
  if (error) throw new Error(`createProject: ${error.message}`);
  return data as ProjectRow;
}

export async function updateProject(
  client: DbClient,
  id: string,
  patch: Partial<Omit<ProjectRow, "id" | "created_at">>,
): Promise<ProjectRow> {
  const { data, error } = await client
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`updateProject: ${error.message}`);
  return data as ProjectRow;
}

export async function deleteProject(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("projects").delete().eq("id", id);
  if (error) throw new Error(`deleteProject: ${error.message}`);
}
