import { describe, it, expect } from "vitest";
import { parseReportResponse } from "./reportSchema";

const multiProjets = {
  long: {
    objet: "Introduction",
    activites_realisees: [{ categorie: "Backend", items: ["Action 1"] }],
    livrables: ["Livrable X"],
    tests_effectues: [],
    difficultes: ["Point à surveiller"],
    planification: ["Objectif 1"],
    conclusion: "Conclusion",
  },
  court: {
    intro: "Voici un résumé...",
    projets: [
      {
        nom: "Salon Atlas",
        points_cles: [{ categorie: "Réservation", description: "desc" }],
        livrables: ["L1"],
        difficultes: ["D1"],
      },
    ],
    objectifs: ["Objectif global"],
  },
};

const monoProjetTopLevel = {
  long: multiProjets.long,
  court: {
    intro: "Voici un résumé...",
    points_cles: [{ categorie: "Réservation", description: "desc" }],
    livrables: ["L1"],
    difficultes: ["D1"],
    objectifs: ["Objectif"],
  },
};

describe("parseReportResponse", () => {
  it("valide une réponse multi-projets", () => {
    const r = parseReportResponse(JSON.stringify(multiProjets));
    expect(r.court.projets?.[0].nom).toBe("Salon Atlas");
    expect(r.long.activites_realisees[0].items).toEqual(["Action 1"]);
  });

  it("valide la variante mono-projet (points_cles au niveau racine de court)", () => {
    const r = parseReportResponse(JSON.stringify(monoProjetTopLevel));
    expect(r.court.points_cles?.[0].categorie).toBe("Réservation");
    expect(r.court.projets).toBeUndefined();
  });

  it("retire les délimiteurs ```json avant de parser", () => {
    const raw = "```json\n" + JSON.stringify(multiProjets) + "\n```";
    expect(() => parseReportResponse(raw)).not.toThrow();
  });

  it("lève une erreur sur un JSON malformé", () => {
    expect(() => parseReportResponse("{ pas du json")).toThrow();
  });

  it("lève une erreur si un champ obligatoire manque (conclusion)", () => {
    const invalide = structuredClone(multiProjets) as Record<string, unknown>;
    delete (invalide.long as Record<string, unknown>).conclusion;
    expect(() => parseReportResponse(JSON.stringify(invalide))).toThrow();
  });
});
