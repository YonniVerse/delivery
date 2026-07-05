/** Accès à la table `weeks`. */
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow, WeekStatus } from "@/lib/supabase/types";

export interface CreateWeekInput {
  label_fr: string;
  start_date: string;
  end_date: string;
}

export async function getActiveWeek(client: DbClient): Promise<WeekRow | null> {
  const { data, error } = await client
    .from("weeks")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getActiveWeek: ${error.message}`);
  return (data as WeekRow) ?? null;
}

export async function createWeek(client: DbClient, input: CreateWeekInput): Promise<WeekRow> {
  const { data, error } = await client
    .from("weeks")
    .insert({ ...input, status: "active" })
    .select("*")
    .single();
  if (error) throw new Error(`createWeek: ${error.message}`);
  return data as WeekRow;
}

export async function setWeekStatus(
  client: DbClient,
  id: string,
  status: WeekStatus,
): Promise<void> {
  const { error } = await client.from("weeks").update({ status }).eq("id", id);
  if (error) throw new Error(`setWeekStatus: ${error.message}`);
}
