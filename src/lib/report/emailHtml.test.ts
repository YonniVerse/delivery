import { describe, it, expect } from "vitest";
import { buildEmailHtml } from "./emailHtml";
import type { Report } from "@/domain/reportSchema";

type Court = Report["court"];

const driveUrl = "https://docs.google.com/document/d/abc";
const nomPrenom = "TINOGNY Yonni";

const multi: Court = {
  intro: "Voici un résumé...",
  projets: [
    {
      nom: "Salon Atlas",
      points_cles: [{ categorie: "Réservation", description: "module livré" }],
      livrables: ["Sitemap"],
      difficultes: ["Attente API"],
    },
    {
      nom: "Lexxy",
      points_cles: [{ categorie: "QA", description: "tests glossaire" }],
      livrables: [],
      difficultes: [],
    },
  ],
  objectifs: ["Finir le module A"],
};

const mono: Court = {
  intro: "Voici un résumé...",
  points_cles: [{ categorie: "Réservation", description: "module livré" }],
  livrables: ["Sitemap"],
  difficultes: [],
  objectifs: ["Finir le module A"],
};

describe("buildEmailHtml", () => {
  it("inclut l'intro, le lien Drive et la signature", () => {
    const html = buildEmailHtml({ court: mono, driveUrl, nomPrenom });
    expect(html).toContain("Voici un résumé...");
    expect(html).toContain(`href="${driveUrl}"`);
    expect(html).toContain(nomPrenom);
  });

  it("rend chaque projet en mode multi-projets", () => {
    const html = buildEmailHtml({ court: multi, driveUrl, nomPrenom });
    expect(html).toContain("Salon Atlas");
    expect(html).toContain("Lexxy");
    expect(html).toContain("Réservation");
    expect(html).toContain("Finir le module A");
  });

  it("affiche un repli quand un projet n'a aucune difficulté (multi)", () => {
    const html = buildEmailHtml({ court: multi, driveUrl, nomPrenom });
    expect(html).toContain("Aucun blocage majeur.");
  });

  it("gère le format mono-projet à plat (points_cles au niveau racine)", () => {
    const html = buildEmailHtml({ court: mono, driveUrl, nomPrenom });
    expect(html).toContain("Réservation");
    expect(html).toContain("Sitemap");
    expect(html).toContain("Aucun blocage majeur cette semaine.");
  });
});
