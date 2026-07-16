/**
 * Historique des rapports : semaines et rapports recoupés côté domaine.
 */
import { createServiceSupabase } from "@/lib/supabase/client";
import { listWeeks } from "@/lib/repositories/weeksRepo";
import { listReports } from "@/lib/repositories/reportsRepo";
import { joinReportsToWeeks, type HistoryEntry } from "@/domain/history";
import { EtatMessage } from "@/components/EtatMessage";
import { HistoryList } from "./HistoryList";

export const dynamic = "force-dynamic";

type Chargement = { etat: "ok"; entrees: HistoryEntry[] } | { etat: "erreur" };

async function charger(): Promise<Chargement> {
  try {
    const client = createServiceSupabase();
    const [rapports, semaines] = await Promise.all([listReports(client), listWeeks(client)]);
    return { etat: "ok", entrees: joinReportsToWeeks(rapports, semaines) };
  } catch (err) {
    console.error("[historique]", err);
    return { etat: "erreur" };
  }
}

export default async function HistoriquePage() {
  const resultat = await charger();

  if (resultat.etat === "erreur") {
    return (
      <EtatMessage titre="Base de données injoignable" ton="erreur">
        Impossible de charger l&apos;historique. Vérifiez <code>NEXT_PUBLIC_SUPABASE_URL</code> et
        les clés dans <code>.env.local</code>, puis rechargez la page.
      </EtatMessage>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Historique des rapports</h1>
      </header>
      <HistoryList entrees={resultat.entrees} />
    </div>
  );
}
