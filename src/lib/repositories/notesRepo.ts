/** Accès à la table `notes` (une ligne par section/semaine). Cœur de la synchro. */
import type { DbClient } from "@/lib/supabase/client";
import type { NoteRow } from "@/lib/supabase/types";
import type { SectionKey, WeekNotes } from "@/domain/notes";

export async function listNotesForWeek(client: DbClient, weekId: string): Promise<NoteRow[]> {
  const { data, error } = await client.from("notes").select("*").eq("week_id", weekId);
  if (error) throw new Error(`listNotesForWeek: ${error.message}`);
  return (data as NoteRow[]) ?? [];
}

/** Transforme les lignes en modèle métier `WeekNotes` (section → contenu). */
export function rowsToWeekNotes(rows: NoteRow[]): WeekNotes {
  const notes: WeekNotes = {};
  for (const r of rows) notes[r.section] = r.content;
  return notes;
}

export async function upsertSection(
  client: DbClient,
  weekId: string,
  section: SectionKey,
  content: string,
): Promise<NoteRow> {
  const { data, error } = await client
    .from("notes")
    .upsert(
      { week_id: weekId, section, content, updated_at: new Date().toISOString() },
      { onConflict: "week_id,section" },
    )
    .select("*")
    .single();
  if (error) throw new Error(`upsertSection: ${error.message}`);
  return data as NoteRow;
}
