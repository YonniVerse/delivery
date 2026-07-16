/**
 * Aperçu du rapport de la semaine active et génération manuelle.
 */
import { createServiceSupabase } from "@/lib/supabase/client";
import { getActiveWeek } from "@/lib/repositories/weeksRepo";
import { getReportForWeek } from "@/lib/repositories/reportsRepo";
import { parseStoredReport, type ReportStatus } from "@/domain/reportSchema";
import type { WeekRow } from "@/lib/supabase/types";
import { EtatMessage } from "@/components/EtatMessage";
import { ReportPreview, type ApercuRapport } from "./ReportPreview";
import { generateReportAction } from "./actions";

export const dynamic = "force-dynamic";

type Chargement =
  | { etat: "ok"; semaine: WeekRow; apercu: ApercuRapport; statut: ReportStatus; driveUrl: string | null }
  | { etat: "aucune-semaine" }
  | { etat: "erreur" };

async function charger(): Promise<Chargement> {
  try {
    const client = createServiceSupabase();
    const semaine = await getActiveWeek(client);
    if (!semaine) return { etat: "aucune-semaine" };

    const rapport = await getReportForWeek(client, semaine.id);
    if (!rapport) {
      return {
        etat: "ok",
        semaine,
        apercu: { etat: "absent" },
        statut: "pending",
        driveUrl: null,
      };
    }

    // `long_json` / `short_json` sont typés `unknown` : à valider avant rendu.
    const valide = parseStoredReport(rapport.long_json, rapport.short_json);
    const apercu: ApercuRapport = valide
      ? { etat: "pret", rapport: valide }
      : rapport.long_json === null && rapport.short_json === null
        ? { etat: "absent" }
        : { etat: "invalide" };

    return {
      etat: "ok",
      semaine,
      apercu,
      statut: rapport.status,
      driveUrl: rapport.drive_url,
    };
  } catch (err) {
    console.error("[rapport]", err);
    return { etat: "erreur" };
  }
}

export default async function RapportPage() {
  const resultat = await charger();

  if (resultat.etat === "erreur") {
    return (
      <EtatMessage titre="Base de données injoignable" ton="erreur">
        Impossible de charger le rapport. Vérifiez <code>NEXT_PUBLIC_SUPABASE_URL</code> et les clés
        dans <code>.env.local</code>, puis rechargez la page.
      </EtatMessage>
    );
  }

  if (resultat.etat === "aucune-semaine") {
    return (
      <EtatMessage titre="Aucune semaine active">
        Créez une semaine avant de générer un rapport.
      </EtatMessage>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Semaine {resultat.semaine.label_fr}</p>
      <ReportPreview
        apercu={resultat.apercu}
        statut={resultat.statut}
        driveUrl={resultat.driveUrl}
        onGenerate={generateReportAction}
      />
    </div>
  );
}
