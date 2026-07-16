"use server";

/**
 * Écritures des réglages, projets et dépôts depuis l'UI.
 * Arguments validés par Zod : une Server Action est une frontière publique.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceSupabase } from "@/lib/supabase/client";
import { updateSettings } from "@/lib/repositories/settingsRepo";
import { createProject, deleteProject } from "@/lib/repositories/projectsRepo";
import { createRepo, updateRepo, deleteRepo } from "@/lib/repositories/reposRepo";

const settingsSchema = z.object({
  nom_prenom: z.string(),
  destinataires: z.string(),
  cc: z.string(),
  sujet_fil: z.string(),
  llm_provider: z.enum(["gemini", "groq"]),
});

const projectSchema = z.object({
  nom: z.string().min(1),
  role: z.string().min(1),
  description: z.string(),
});

/** `owner/repo` — même contrat que côté composant. */
const repoSchema = z.string().regex(/^[\w.-]+\/[\w.-]+$/);

export async function saveSettingsAction(patch: unknown): Promise<void> {
  await updateSettings(createServiceSupabase(), settingsSchema.parse(patch));
  revalidatePath("/reglages");
}

export async function createProjectAction(payload: unknown): Promise<void> {
  await createProject(createServiceSupabase(), projectSchema.parse(payload));
  revalidatePath("/reglages");
}

export async function deleteProjectAction(id: string): Promise<void> {
  await deleteProject(createServiceSupabase(), z.string().uuid().parse(id));
  revalidatePath("/reglages");
}

export async function createRepoAction(fullName: string): Promise<void> {
  await createRepo(createServiceSupabase(), repoSchema.parse(fullName));
  revalidatePath("/reglages");
}

export async function toggleRepoAction(id: string, active: boolean): Promise<void> {
  await updateRepo(createServiceSupabase(), z.string().uuid().parse(id), {
    active: z.boolean().parse(active),
  });
  revalidatePath("/reglages");
}

export async function deleteRepoAction(id: string): Promise<void> {
  await deleteRepo(createServiceSupabase(), z.string().uuid().parse(id));
  revalidatePath("/reglages");
}
