"use server";

/**
 * Écritures des notes depuis l'UI.
 *
 * Une Server Action est une frontière publique : les arguments sont validés par
 * Zod avant d'atteindre la base, même s'ils viennent de notre propre composant.
 *
 * Le client service-role contourne la RLS — c'est nécessaire tant que la Phase 8
 * (auth) n'existe pas, et c'est pourquoi ce module doit rester serveur.
 */
import { z } from "zod";
import { SECTION_KEYS } from "@/domain/notes";
import { createServiceSupabase } from "@/lib/supabase/client";
import { upsertSection } from "@/lib/repositories/notesRepo";

const saveSchema = z.object({
  weekId: z.string().uuid(),
  section: z.enum(SECTION_KEYS),
  content: z.string(),
});

export async function saveSectionAction(
  weekId: string,
  section: string,
  content: string,
): Promise<void> {
  const valide = saveSchema.parse({ weekId, section, content });

  // La section `commits` est réécrite par le cron GitHub : la refuser ici évite
  // qu'un appel direct ne vienne écraser un import.
  if (valide.section === "commits") {
    throw new Error("La section « Commits GitHub » est alimentée automatiquement.");
  }

  await upsertSection(createServiceSupabase(), valide.weekId, valide.section, valide.content);
}
