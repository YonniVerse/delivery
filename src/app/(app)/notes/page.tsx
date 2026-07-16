/**
 * Écran de saisie des notes de la semaine active.
 *
 * Lecture côté serveur (client service-role, RLS contournée faute d'auth avant la
 * Phase 8), écriture par Server Action passée en prop à l'éditeur.
 */
import { createServiceSupabase } from "@/lib/supabase/client";
import { getActiveWeek } from "@/lib/repositories/weeksRepo";
import { listNotesForWeek, rowsToWeekNotes } from "@/lib/repositories/notesRepo";
import type { WeekNotes } from "@/domain/notes";
import type { WeekRow } from "@/lib/supabase/types";
import { EtatMessage } from "@/components/EtatMessage";
import { NotesEditor } from "./NotesEditor";
import { saveSectionAction } from "./actions";

export const dynamic = "force-dynamic";

type Chargement =
  | { etat: "ok"; semaine: WeekRow; notes: WeekNotes }
  | { etat: "aucune-semaine" }
  | { etat: "erreur" };

/** Le chargement est isolé du rendu : un try/catch autour du JSX n'attraperait
 *  pas les erreurs de rendu (React rend après le retour de la fonction). */
async function charger(): Promise<Chargement> {
  try {
    const client = createServiceSupabase();
    const semaine = await getActiveWeek(client);
    if (!semaine) return { etat: "aucune-semaine" };

    const notes = rowsToWeekNotes(await listNotesForWeek(client, semaine.id));
    return { etat: "ok", semaine, notes };
  } catch (err) {
    console.error("[notes]", err);
    return { etat: "erreur" };
  }
}

export default async function NotesPage() {
  const resultat = await charger();

  if (resultat.etat === "erreur") {
    return (
      <EtatMessage titre="Base de données injoignable" ton="erreur">
        Impossible de charger les notes. Vérifiez <code>NEXT_PUBLIC_SUPABASE_URL</code> et les clés
        dans <code>.env.local</code>, puis rechargez la page.
      </EtatMessage>
    );
  }

  if (resultat.etat === "aucune-semaine") {
    return (
      <EtatMessage titre="Aucune semaine active">
        Appliquez la migration Supabase et créez une semaine pour commencer à prendre des notes.
      </EtatMessage>
    );
  }

  const { semaine, notes } = resultat;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Semaine {semaine.label_fr}</p>
      <NotesEditor
        initialNotes={notes}
        saveSection={async (section, content) => {
          "use server";
          await saveSectionAction(semaine.id, section, content);
        }}
      />
    </div>
  );
}
