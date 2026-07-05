import { describe, it, expect } from "vitest";
import { buildLongReportBlocks } from "./longReport";
import type { Report } from "@/domain/reportSchema";

const long: Report["long"] = {
  objet: "Paragraphe d'introduction",
  activites_realisees: [
    { categorie: "Backend", items: ["Endpoint réservation", "Auth multi-rôles"] },
  ],
  livrables: ["Sitemap déployé"],
  tests_effectues: [],
  difficultes: ["Attente API partenaire"],
  planification: ["Finaliser le module A"],
  conclusion: "Paragraphe de conclusion",
};

const meta = {
  semaine: "6 juillet 2026 au 10 juillet 2026",
  nomPrenom: "TINOGNY Yonni",
  nomProjet: "Salon Atlas",
  dateRedaction: new Date(2026, 6, 10),
};

describe("buildLongReportBlocks", () => {
  const blocks = buildLongReportBlocks(long, meta);
  const texts = blocks.map((b) => b.text);

  it("commence par un titre H1 contenant la semaine", () => {
    expect(blocks[0].type).toBe("heading1");
    expect(blocks[0].text).toContain("6 juillet 2026 au 10 juillet 2026");
  });

  it("contient les 7 sections numérotées dans l'ordre", () => {
    const headings = blocks.filter((b) => b.type === "heading2").map((b) => b.text);
    expect(headings).toEqual([
      "1. Objet",
      "2. Activités réalisées (synthèse)",
      "3. Livrables produits cette semaine",
      "4. Tests effectués",
      "5. Difficultés rencontrées / points d'attention",
      "6. Planification de la semaine prochaine",
      "7. Conclusion",
    ]);
  });

  it("rend les activités par catégorie puis items en puces", () => {
    expect(blocks.some((b) => b.type === "category" && b.text === "Backend")).toBe(true);
    expect(blocks.some((b) => b.type === "bullet" && b.text === "Endpoint réservation")).toBe(true);
  });

  it("affiche un repli quand une section liste est vide (tests)", () => {
    expect(texts).toContain("Aucun test spécifique réalisé cette semaine.");
  });

  it("rend l'objet et la conclusion en paragraphes", () => {
    expect(blocks.some((b) => b.type === "paragraph" && b.text === "Paragraphe d'introduction")).toBe(true);
    expect(blocks.some((b) => b.type === "paragraph" && b.text === "Paragraphe de conclusion")).toBe(true);
  });

  it("termine par un pied de page daté avec le nom", () => {
    const dernier = blocks[blocks.length - 1];
    expect(dernier.text).toContain("TINOGNY Yonni");
    expect(dernier.text).toContain("10 juillet 2026");
  });
});
