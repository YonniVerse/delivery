/**
 * Recoupement semaines × rapports pour l'écran Historique.
 *
 * La jointure se fait ici, en mémoire, plutôt que par un select imbriqué Supabase :
 * le type `Database` est maintenu à la main et type mal les relations.
 *
 * Les entrées sont décrites structurellement (pas d'import depuis `src/lib/`) pour
 * garder le domaine indépendant de la couche d'accès aux données : `WeekRow` et
 * `ReportRow` en sont des sur-ensembles et se passent tels quels.
 */
import type { ReportStatus } from "./reportSchema";

export interface HistoryWeekInput {
  id: string;
  label_fr: string;
  start_date: string;
}

export interface HistoryReportInput {
  week_id: string;
  status: ReportStatus;
  drive_url: string | null;
  generated_at: string | null;
  sent_at: string | null;
}

export interface HistoryEntry {
  weekId: string;
  labelFr: string;
  startDate: string;
  status: ReportStatus;
  driveUrl: string | null;
  generatedAt: string | null;
  sentAt: string | null;
}

/**
 * Une entrée par semaine, de la plus récente à la plus ancienne.
 * Une semaine sans rapport apparaît en `pending` ; un rapport dont la semaine
 * n'existe plus est ignoré (rien à afficher sans son libellé).
 */
export function joinReportsToWeeks(
  reports: readonly HistoryReportInput[],
  weeks: readonly HistoryWeekInput[],
): HistoryEntry[] {
  const parSemaine = new Map(reports.map((r) => [r.week_id, r]));

  return [...weeks]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((semaine) => {
      const rapport = parSemaine.get(semaine.id);
      return {
        weekId: semaine.id,
        labelFr: semaine.label_fr,
        startDate: semaine.start_date,
        status: rapport?.status ?? "pending",
        driveUrl: rapport?.drive_url ?? null,
        generatedAt: rapport?.generated_at ?? null,
        sentAt: rapport?.sent_at ?? null,
      };
    });
}
