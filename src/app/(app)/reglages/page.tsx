/**
 * Réglages : identité et e-mail, projets et rôles, dépôts GitHub suivis.
 */
import { createServiceSupabase } from "@/lib/supabase/client";
import { getSettings } from "@/lib/repositories/settingsRepo";
import { listProjects } from "@/lib/repositories/projectsRepo";
import { listRepos } from "@/lib/repositories/reposRepo";
import type { SettingsRow, ProjectRow, RepoRow } from "@/lib/supabase/types";
import { EtatMessage } from "@/components/EtatMessage";
import { SettingsForm } from "./SettingsForm";
import { ProjectsEditor } from "./ProjectsEditor";
import { ReposEditor } from "./ReposEditor";
import {
  saveSettingsAction,
  createProjectAction,
  deleteProjectAction,
  createRepoAction,
  toggleRepoAction,
  deleteRepoAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Chargement =
  | { etat: "ok"; reglages: SettingsRow; projets: ProjectRow[]; depots: RepoRow[] }
  | { etat: "erreur" };

async function charger(): Promise<Chargement> {
  try {
    const client = createServiceSupabase();
    const [reglages, projets, depots] = await Promise.all([
      getSettings(client),
      listProjects(client),
      listRepos(client),
    ]);
    return { etat: "ok", reglages, projets, depots };
  } catch (err) {
    console.error("[reglages]", err);
    return { etat: "erreur" };
  }
}

export default async function ReglagesPage() {
  const resultat = await charger();

  if (resultat.etat === "erreur") {
    return (
      <EtatMessage titre="Base de données injoignable" ton="erreur">
        Impossible de charger les réglages. Vérifiez <code>NEXT_PUBLIC_SUPABASE_URL</code> et les
        clés dans <code>.env.local</code>, puis rechargez la page.
      </EtatMessage>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">Réglages</h1>
      </header>

      <SettingsForm initial={resultat.reglages} save={saveSettingsAction} />
      <ProjectsEditor
        initial={resultat.projets}
        onCreate={createProjectAction}
        onDelete={deleteProjectAction}
      />
      <ReposEditor
        initial={resultat.depots}
        onCreate={createRepoAction}
        onToggle={toggleRepoAction}
        onDelete={deleteRepoAction}
      />
    </div>
  );
}
