/**
 * Transforme la version longue du rapport en une liste ordonnée de blocs de document,
 * prête à être rendue via l'API Google Docs. Fonction pure.
 * Structure et libellés portés de code.gs (creerDocRapportLong).
 */
import { formaterDateFR } from "@/domain/dates";
import type { Report } from "@/domain/reportSchema";

export type Block =
  | { type: "heading1"; text: string }
  | { type: "heading2"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "category"; text: string }
  | { type: "bullet"; text: string };

export interface LongReportMeta {
  semaine: string;
  nomPrenom: string;
  nomProjet: string;
  dateRedaction: Date;
}

/** Ajoute une section liste à puces, ou un paragraphe de repli si la liste est vide. */
function sectionListe(items: string[], repli: string): Block[] {
  if (items.length === 0) return [{ type: "paragraph", text: repli }];
  return items.map((text) => ({ type: "bullet", text }));
}

export function buildLongReportBlocks(
  long: Report["long"],
  meta: LongReportMeta,
): Block[] {
  const blocks: Block[] = [
    { type: "heading1", text: `Rapport — Semaine du ${meta.semaine}` },
    {
      type: "paragraph",
      text: `Stagiaire : ${meta.nomPrenom}    Projet : ${meta.nomProjet}`,
    },

    { type: "heading2", text: "1. Objet" },
    { type: "paragraph", text: long.objet },

    { type: "heading2", text: "2. Activités réalisées (synthèse)" },
  ];

  for (const groupe of long.activites_realisees) {
    blocks.push({ type: "category", text: groupe.categorie });
    for (const item of groupe.items) {
      blocks.push({ type: "bullet", text: item });
    }
  }

  blocks.push({ type: "heading2", text: "3. Livrables produits cette semaine" });
  blocks.push(...sectionListe(long.livrables, "Aucun livrable produit cette semaine."));

  blocks.push({ type: "heading2", text: "4. Tests effectués" });
  blocks.push(...sectionListe(long.tests_effectues, "Aucun test spécifique réalisé cette semaine."));

  blocks.push({ type: "heading2", text: "5. Difficultés rencontrées / points d'attention" });
  blocks.push(...sectionListe(long.difficultes, "Aucun blocage majeur rencontré cette semaine."));

  blocks.push({ type: "heading2", text: "6. Planification de la semaine prochaine" });
  blocks.push(...sectionListe(long.planification, "Objectifs à définir pour la semaine prochaine."));

  blocks.push({ type: "heading2", text: "7. Conclusion" });
  blocks.push({ type: "paragraph", text: long.conclusion });

  blocks.push({
    type: "paragraph",
    text: `Rédigé le : ${formaterDateFR(meta.dateRedaction)}    Par : ${meta.nomPrenom}`,
  });

  return blocks;
}
