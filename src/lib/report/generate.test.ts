import { describe, it, expect } from "vitest";
import { generateReport } from "./generate";
import type { LlmProvider } from "@/lib/llm";

const reportValide = {
  long: {
    objet: "Intro",
    activites_realisees: [{ categorie: "Backend", items: ["A1"] }],
    livrables: ["L1"],
    tests_effectues: [],
    difficultes: ["surveiller X"],
    planification: ["Obj1"],
    conclusion: "Fin",
  },
  court: {
    intro: "Voici un résumé...",
    projets: [
      { nom: "Salon Atlas", points_cles: [{ categorie: "R", description: "d" }], livrables: ["L1"], difficultes: ["D1"] },
    ],
    objectifs: ["O1"],
  },
};

/** Provider stub qui capture le prompt reçu et renvoie une réponse fixée. */
function stubProvider(reponse: string): { provider: LlmProvider; prompts: string[] } {
  const prompts: string[] = [];
  return {
    prompts,
    provider: {
      generate: async (prompt: string) => {
        prompts.push(prompt);
        return reponse;
      },
    },
  };
}

const baseInput = {
  notes: { tachesRealisees: "Dév du module réservation" },
  projets: [{ nom: "Salon Atlas", role: "Dév backend", description: "Gestion salon" }],
  nomPrenom: "TINOGNY Yonni",
  ref: new Date(2026, 6, 8), // mercredi
};

describe("generateReport", () => {
  it("construit le prompt à partir des notes puis renvoie le rapport validé", async () => {
    const { provider, prompts } = stubProvider(JSON.stringify(reportValide));
    const report = await generateReport({ ...baseInput, provider });

    expect(report.court.projets?.[0].nom).toBe("Salon Atlas");
    expect(prompts[0]).toContain("TINOGNY Yonni");
    expect(prompts[0]).toContain("Dév du module réservation");
    expect(prompts[0]).toContain("6 juillet 2026 au 10 juillet 2026");
  });

  it("propage l'erreur si la réponse IA est invalide", async () => {
    const { provider } = stubProvider("pas du json");
    await expect(generateReport({ ...baseInput, provider })).rejects.toThrow();
  });
});
