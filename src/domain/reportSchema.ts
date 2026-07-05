/**
 * Schémas Zod de la réponse IA (deux versions long/court) et parser tolérant.
 * Structures reprises du format JSON imposé dans code.gs.
 */
import { z } from "zod";

const activiteGroupe = z.object({
  categorie: z.string(),
  items: z.array(z.string()),
});

const pointCle = z.object({
  categorie: z.string(),
  description: z.string(),
});

const longSchema = z.object({
  objet: z.string(),
  activites_realisees: z.array(activiteGroupe),
  livrables: z.array(z.string()),
  tests_effectues: z.array(z.string()),
  difficultes: z.array(z.string()),
  planification: z.array(z.string()),
  conclusion: z.string(),
});

const projetCourt = z.object({
  nom: z.string(),
  points_cles: z.array(pointCle),
  livrables: z.array(z.string()),
  difficultes: z.array(z.string()),
});

// court accepte les deux formes de code.gs :
//  - multi/mono-projet via `projets`
//  - mono-projet « à plat » (points_cles/livrables/difficultes au niveau racine)
const courtSchema = z.object({
  intro: z.string(),
  projets: z.array(projetCourt).optional(),
  points_cles: z.array(pointCle).optional(),
  livrables: z.array(z.string()).optional(),
  difficultes: z.array(z.string()).optional(),
  objectifs: z.array(z.string()),
});

export const reportSchema = z.object({
  long: longSchema,
  court: courtSchema,
});

export type Report = z.infer<typeof reportSchema>;

/** Retire d'éventuels délimiteurs markdown ```json … ``` autour du JSON. */
function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Parse et valide la réponse brute de l'IA.
 * Lève une erreur explicite si le JSON est malformé ou hors schéma.
 */
export function parseReportResponse(raw: string): Report {
  const nettoye = stripFences(raw);
  let data: unknown;
  try {
    data = JSON.parse(nettoye);
  } catch {
    throw new Error(
      `JSON invalide reçu de l'IA : ${nettoye.substring(0, 300)}`,
    );
  }
  return reportSchema.parse(data);
}
