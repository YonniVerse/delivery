/**
 * Historique des rapports, une ligne par semaine.
 * Composant serveur : purement présentationnel, aucune interaction.
 */
import type { HistoryEntry } from "@/domain/history";
import type { ReportStatus } from "@/domain/reportSchema";
import { Badge } from "@/components/ui/badge";
import { EtatMessage } from "@/components/EtatMessage";

const LIBELLE_STATUT: Record<ReportStatus, string> = {
  pending: "À générer",
  generated: "Généré",
  draft_created: "Brouillon Gmail créé",
  sent: "Envoyé",
};

export interface HistoryListProps {
  entrees: HistoryEntry[];
}

export function HistoryList({ entrees }: HistoryListProps) {
  if (entrees.length === 0) {
    return (
      <EtatMessage titre="Historique vide">
        Aucun rapport pour l&apos;instant. Il apparaîtra ici après la première génération.
      </EtatMessage>
    );
  }

  return (
    <ul className="space-y-2">
      {entrees.map((entree) => (
        <li
          key={entree.weekId}
          data-testid={`semaine-${entree.weekId}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
        >
          <div className="space-y-1">
            <p className="font-medium">{entree.labelFr}</p>
            <Badge variant={entree.status === "pending" ? "outline" : "secondary"}>
              {LIBELLE_STATUT[entree.status]}
            </Badge>
          </div>
          {entree.driveUrl && (
            <a
              href={entree.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Ouvrir le Google Doc
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
