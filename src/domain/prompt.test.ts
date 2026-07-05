import { describe, it, expect } from "vitest";
import { buildReportPrompt, type PromptInput } from "./prompt";

const base: PromptInput = {
  nomPrenom: "TINOGNY Yonni",
  semaine: "6 juillet 2026 au 10 juillet 2026",
  projets: [
    {
      nom: "Salon Atlas",
      role: "Développeur principal (backend)",
      description: "Application de gestion de salon de coiffure",
    },
    {
      nom: "Lexxy",
      role: "Testeur / correcteur",
      description: "Tests fonctionnels uniquement",
    },
  ],
  notesText: "## Tâches réalisées\nDéveloppement du module de réservation",
};

describe("buildReportPrompt", () => {
  it("injecte le stagiaire et la semaine", () => {
    const p = buildReportPrompt(base);
    expect(p).toContain("TINOGNY Yonni");
    expect(p).toContain("6 juillet 2026 au 10 juillet 2026");
  });

  it("liste chaque projet avec son rôle et sa description", () => {
    const p = buildReportPrompt(base);
    expect(p).toContain(
      "- Salon Atlas : Développeur principal (backend) — Application de gestion de salon de coiffure",
    );
    expect(p).toContain("- Lexxy : Testeur / correcteur — Tests fonctionnels uniquement");
  });

  it("inclut les notes brutes fournies", () => {
    const p = buildReportPrompt(base);
    expect(p).toContain("Développement du module de réservation");
  });

  it("exige une réponse strictement JSON et décrit les deux versions", () => {
    const p = buildReportPrompt(base);
    expect(p).toMatch(/UNIQUEMENT avec .*JSON/i);
    expect(p).toContain('"long"');
    expect(p).toContain('"court"');
  });

  it("tronque les notes à 10000 caractères", () => {
    const p = buildReportPrompt({ ...base, notesText: "x".repeat(15000) });
    expect(p).toContain("x".repeat(10000));
    expect(p).not.toContain("x".repeat(10001));
  });
});
