/** Accès à la table `settings` (singleton de configuration). */
import type { DbClient } from "@/lib/supabase/client";
import type { SettingsRow } from "@/lib/supabase/types";

export async function getSettings(client: DbClient): Promise<SettingsRow> {
  const { data, error } = await client.from("settings").select("*").eq("id", true).single();
  if (error) throw new Error(`getSettings: ${error.message}`);
  return data as SettingsRow;
}

export async function updateSettings(
  client: DbClient,
  patch: Partial<Omit<SettingsRow, "id">>,
): Promise<SettingsRow> {
  const { data, error } = await client
    .from("settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("*")
    .single();
  if (error) throw new Error(`updateSettings: ${error.message}`);
  return data as SettingsRow;
}
