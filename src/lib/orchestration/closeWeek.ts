/**
 * Orchestration — clôture de la semaine.
 * Marque la semaine courante comme "archived", et crée l'enregistrement de la semaine
 * suivante à l'état "active" avec les bonnes dates et le bon libellé.
 * Porté de `archiverNotes` dans code.gs.
 */
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow } from "@/lib/supabase/types";
import type { CreateWeekInput } from "@/lib/repositories/weeksRepo";
import { getLibelleSemaineProchaine } from "@/domain/dates";

export interface CloseWeekDeps {
  setWeekStatus: (client: DbClient, id: string, status: "active" | "archived") => Promise<void>;
  createWeek: (client: DbClient, input: CreateWeekInput) => Promise<WeekRow>;
}

export interface CloseWeekOpts {
  /** Date de référence (défaut : maintenant). */
  ref?: Date;
}

export interface CloseWeekResult {
  archivedWeekId: string;
  newWeek: WeekRow;
}

/** Ajoute `jours` à une Date. */
function ajouterJours(date: Date, jours: number): Date {
  const copie = new Date(date);
  copie.setDate(copie.getDate() + jours);
  return copie;
}

export async function closeWeek(
  client: DbClient,
  week: WeekRow,
  deps: CloseWeekDeps,
  opts?: CloseWeekOpts,
): Promise<CloseWeekResult> {
  const ref = opts?.ref ?? new Date();

  // 1. Archiver la semaine courante
  await deps.setWeekStatus(client, week.id, "archived");

  // 2. Calculer les dates de la semaine suivante
  const label_fr = getLibelleSemaineProchaine(ref);

  const decalageLundi = ref.getDay() === 0 ? 1 : 8 - ref.getDay();
  const lundi = ajouterJours(ref, decalageLundi);
  const dimanche = ajouterJours(lundi, 6);

  // formater au format YYYY-MM-DD
  const isoLundi = lundi.toISOString().split("T")[0];
  const isoDimanche = dimanche.toISOString().split("T")[0];

  // 3. Créer la semaine suivante
  const newWeek = await deps.createWeek(client, {
    label_fr,
    start_date: isoLundi,
    end_date: isoDimanche,
  });

  return { archivedWeekId: week.id, newWeek };
}
