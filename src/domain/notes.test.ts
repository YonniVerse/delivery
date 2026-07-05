import { describe, it, expect } from "vitest";
import {
  SECTION_KEYS,
  SECTION_TITLES,
  notesToPromptText,
  type WeekNotes,
} from "./notes";

describe("modèle de sections", () => {
  it("expose les 7 sections attendues dans un ordre stable", () => {
    expect(SECTION_KEYS).toEqual([
      "pointsImportants",
      "tachesRealisees",
      "pointsBlocage",
      "objectifs",
      "tests",
      "livrables",
      "commits",
    ]);
  });

  it("associe un titre lisible à chaque section", () => {
    expect(SECTION_TITLES.pointsImportants).toBe(
      "Points importants à mettre en avant",
    );
    expect(SECTION_TITLES.commits).toBe("Commits GitHub");
  });
});

describe("notesToPromptText", () => {
  it("rend chaque section remplie avec son titre puis son contenu", () => {
    const notes: WeekNotes = {
      tachesRealisees: "Développement de la fonctionnalité X",
      tests: "Tests API réservation",
    };
    const texte = notesToPromptText(notes);
    expect(texte).toContain("## Tâches réalisées\nDéveloppement de la fonctionnalité X");
    expect(texte).toContain("## Tests effectués\nTests API réservation");
  });

  it("ignore les sections vides ou uniquement composées d'espaces", () => {
    const notes: WeekNotes = {
      tachesRealisees: "Truc fait",
      pointsBlocage: "   ",
      objectifs: "",
    };
    const texte = notesToPromptText(notes);
    expect(texte).toContain("## Tâches réalisées");
    expect(texte).not.toContain("Points de blocage");
    expect(texte).not.toContain("Objectifs semaine prochaine");
  });

  it("respecte l'ordre canonique des sections quel que soit l'ordre d'entrée", () => {
    const notes: WeekNotes = {
      commits: "abc123 fix",
      pointsImportants: "Le sitemap est un livrable clé",
    };
    const texte = notesToPromptText(notes);
    expect(texte.indexOf("Points importants")).toBeLessThan(
      texte.indexOf("Commits GitHub"),
    );
  });

  it("renvoie une chaîne vide quand aucune section n'est remplie", () => {
    expect(notesToPromptText({})).toBe("");
  });
});
