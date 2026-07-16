"use client";

/**
 * Aperçu du rapport de la semaine (version courte pour l'e-mail, version longue
 * pour le Google Doc) et déclenchement manuel de la génération.
 *
 * `onGenerate` arrive par les props : le composant ignore tout du réseau.
 */
import { useState } from "react";
import type { Report } from "@/domain/reportSchema";
import type { ReportStatus } from "@/domain/reportSchema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EtatMessage } from "@/components/EtatMessage";

export type ApercuRapport =
  | { etat: "pret"; rapport: Report }
  | { etat: "absent" }
  | { etat: "invalide" };

const LIBELLE_STATUT: Record<ReportStatus, string> = {
  pending: "À générer",
  generated: "Généré",
  draft_created: "Brouillon Gmail créé",
  sent: "Envoyé",
};

export interface ReportPreviewProps {
  apercu: ApercuRapport;
  statut: ReportStatus;
  driveUrl: string | null;
  onGenerate: () => Promise<{ ok: boolean; error?: string }>;
}

/** Liste à puces, ou rien du tout si la section est vide. */
function Liste({ titre, items }: { titre: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-1">
      <h3 className="text-sm font-medium">{titre}</h3>
      <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function VersionLongue({ long }: { long: Report["long"] }) {
  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <h3 className="text-sm font-medium">Objet</h3>
        <p className="text-sm text-muted-foreground">{long.objet}</p>
      </section>

      {long.activites_realisees.length > 0 && (
        <section className="space-y-1">
          <h3 className="text-sm font-medium">Activités réalisées</h3>
          {long.activites_realisees.map((groupe, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{groupe.categorie}</span>
              <ul className="list-disc space-y-0.5 pl-5">
                {groupe.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <Liste titre="Livrables produits" items={long.livrables} />
      <Liste titre="Tests effectués" items={long.tests_effectues} />
      <Liste titre="Difficultés rencontrées" items={long.difficultes} />
      <Liste titre="Planification de la semaine prochaine" items={long.planification} />

      <section className="space-y-1">
        <h3 className="text-sm font-medium">Conclusion</h3>
        <p className="text-sm text-muted-foreground">{long.conclusion}</p>
      </section>
    </div>
  );
}

function VersionCourte({ court }: { court: Report["court"] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm">{court.intro}</p>

      {court.projets?.map((projet, i) => (
        <section key={i} className="space-y-1 rounded-md border p-3">
          <h3 className="text-sm font-medium">{projet.nom}</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {projet.points_cles.map((point, j) => (
              <li key={j}>
                <span className="font-medium text-foreground">{point.categorie}</span> —{" "}
                {point.description}
              </li>
            ))}
          </ul>
          <Liste titre="Livrables" items={projet.livrables} />
          <Liste titre="Difficultés" items={projet.difficultes} />
        </section>
      ))}

      {/* Variante mono-projet « à plat » de code.gs. */}
      {court.points_cles && court.points_cles.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
          {court.points_cles.map((point, j) => (
            <li key={j}>
              <span className="font-medium text-foreground">{point.categorie}</span> —{" "}
              {point.description}
            </li>
          ))}
        </ul>
      )}
      <Liste titre="Livrables" items={court.livrables ?? []} />
      <Liste titre="Difficultés" items={court.difficultes ?? []} />
      <Liste titre="Objectifs semaine prochaine" items={court.objectifs} />
    </div>
  );
}

export function ReportPreview({ apercu, statut, driveUrl, onGenerate }: ReportPreviewProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function generer() {
    setEnCours(true);
    setErreur(null);
    try {
      const resultat = await onGenerate();
      if (!resultat.ok) setErreur(resultat.error ?? "La génération a échoué.");
    } catch {
      setErreur("La génération a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Rapport de la semaine</h1>
          <Badge variant="secondary">{LIBELLE_STATUT[statut]}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {driveUrl && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              Ouvrir le Google Doc
            </a>
          )}
          <Button onClick={generer} disabled={enCours}>
            {enCours ? "Génération…" : "Générer"}
          </Button>
        </div>
      </header>

      {erreur && (
        <p role="alert" className="text-sm text-destructive">
          {erreur}
        </p>
      )}

      {apercu.etat === "absent" && (
        <EtatMessage titre="Aucun aperçu">
          Le rapport de cette semaine n&apos;a pas encore été généré.
        </EtatMessage>
      )}

      {apercu.etat === "invalide" && (
        <EtatMessage titre="Rapport illisible" ton="erreur">
          Le rapport enregistré ne correspond pas au format attendu. Relancez une génération.
        </EtatMessage>
      )}

      {apercu.etat === "pret" && (
        <Tabs defaultValue="court">
          <TabsList>
            <TabsTrigger value="court">Version courte</TabsTrigger>
            <TabsTrigger value="long">Version longue</TabsTrigger>
          </TabsList>
          <TabsContent value="court" className="pt-4">
            <VersionCourte court={apercu.rapport.court} />
          </TabsContent>
          <TabsContent value="long" className="pt-4">
            <VersionLongue long={apercu.rapport.long} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
