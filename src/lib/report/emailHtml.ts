/**
 * Construction du corps HTML de l'email (version courte).
 * Logique portée de code.gs (creerBrouillonReponse) — fonction pure.
 */
import type { Report } from "@/domain/reportSchema";

type Court = Report["court"];
type PointCle = { categorie: string; description: string };

export interface EmailHtmlInput {
  court: Court;
  driveUrl: string;
  nomPrenom: string;
}

const li = (contenu: string) => `<li>${contenu}</li>`;
const ul = (items: string[]) => `<ul>${items.join("")}</ul>`;

const pointsClesHtml = (points: PointCle[]) =>
  ul(points.map((p) => li(`<strong>${p.categorie} :</strong> ${p.description}`)));

const livrablesHtml = (livrables: string[]) => ul(livrables.map(li));

const difficultesHtml = (difficultes: string[] | undefined, repli: string) =>
  ul(
    difficultes && difficultes.length > 0
      ? difficultes.map(li)
      : [li(repli)],
  );

export function buildEmailHtml(input: EmailHtmlInput): string {
  const { court, driveUrl, nomPrenom } = input;

  const introHtml =
    "<p>Bonjour,</p>" +
    `<p>${court.intro}</p>` +
    `<p>Lien drive pour la version détaillée : ` +
    `<a href="${driveUrl}" style="color:#1a73e8;">${driveUrl}</a></p>`;

  let contenuProjets = "";

  if (court.projets && court.projets.length > 1) {
    for (const projet of court.projets) {
      contenuProjets +=
        `<p style="margin-top:20px; margin-bottom:4px;"><strong style="font-size:12pt; color:#1a1a2e;">${projet.nom}</strong></p>` +
        "<p><strong>Points clés :</strong></p>" +
        pointsClesHtml(projet.points_cles) +
        "<p><strong>Livrables :</strong></p>" +
        livrablesHtml(projet.livrables) +
        "<p><strong>Difficultés / points en attente :</strong></p>" +
        difficultesHtml(projet.difficultes, "Aucun blocage majeur.");
    }
    contenuProjets +=
      "<p><strong>Objectifs — semaine suivante :</strong></p>" +
      ul(court.objectifs.map(li));
  } else {
    const projet = court.projets?.length === 1 ? court.projets[0] : null;
    const points = projet ? projet.points_cles : court.points_cles ?? [];
    const livrables = projet ? projet.livrables : court.livrables ?? [];
    const difficultes = projet ? projet.difficultes : court.difficultes;

    contenuProjets =
      "<p><strong>Points clés :</strong></p>" +
      pointsClesHtml(points) +
      "<p><strong>Livrables :</strong></p>" +
      livrablesHtml(livrables) +
      "<p><strong>Difficultés / points en attente :</strong></p>" +
      difficultesHtml(difficultes, "Aucun blocage majeur cette semaine.") +
      "<p><strong>Objectifs — semaine suivante :</strong></p>" +
      ul(court.objectifs.map(li));
  }

  const signature = `<p style="margin-top:24px;">Cordialement,<br><strong>${nomPrenom}</strong></p>`;

  return (
    '<div style="font-family: Aptos, Arial, sans-serif; font-size: 10pt; color: #333333; max-width: 650px; line-height: 1.7;">' +
    introHtml +
    contenuProjets +
    signature +
    "</div>"
  );
}
