/**
 * Modèle des notes hebdomadaires (sections reprises de code.gs) et
 * agrégation en texte brut destiné au prompt IA.
 */

export const SECTION_KEYS = [
  "pointsImportants",
  "tachesRealisees",
  "pointsBlocage",
  "objectifs",
  "tests",
  "livrables",
  "commits",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_TITLES: Record<SectionKey, string> = {
  pointsImportants: "Points importants à mettre en avant",
  tachesRealisees: "Tâches réalisées",
  pointsBlocage: "Points de blocage",
  objectifs: "Objectifs semaine prochaine",
  tests: "Tests effectués",
  livrables: "Livrables produits",
  commits: "Commits GitHub",
};

/** Contenu des notes d'une semaine : une section peut être absente ou vide. */
export type WeekNotes = Partial<Record<SectionKey, string>>;

/**
 * Agrège les notes en texte brut (« ## Titre\ncontenu »), dans l'ordre
 * canonique de SECTION_KEYS, en ignorant les sections vides.
 */
export function notesToPromptText(notes: WeekNotes): string {
  return SECTION_KEYS.filter((key) => (notes[key] ?? "").trim() !== "")
    .map((key) => `## ${SECTION_TITLES[key]}\n${notes[key]!.trim()}`)
    .join("\n\n");
}
