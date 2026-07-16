import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportPreview } from "./ReportPreview";
import type { Report } from "@/domain/reportSchema";

const rapport: Report = {
  long: {
    objet: "Avancement du stage sur la semaine 29",
    activites_realisees: [{ categorie: "Backend", items: ["Repositories CRUD"] }],
    livrables: ["Éditeur de notes"],
    tests_effectues: ["178 tests verts"],
    difficultes: ["DNS Supabase injoignable"],
    planification: ["Auth Google"],
    conclusion: "Semaine productive.",
  },
  court: {
    intro: "Voici le résumé de la semaine.",
    projets: [
      {
        nom: "Delivery",
        points_cles: [{ categorie: "UI", description: "Phase 7 livrée" }],
        livrables: ["Écrans"],
        difficultes: ["Base injoignable"],
      },
    ],
    objectifs: ["Terminer l'auth"],
  },
};

function proprietes(overrides = {}) {
  return {
    apercu: { etat: "pret" as const, rapport },
    statut: "generated" as const,
    driveUrl: null,
    onGenerate: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe("ReportPreview", () => {
  it("affiche la version courte par défaut", () => {
    render(<ReportPreview {...proprietes()} />);

    expect(screen.getByText("Voici le résumé de la semaine.")).toBeInTheDocument();
  });

  it("bascule sur la version longue et en affiche les sections", async () => {
    const user = userEvent.setup();
    render(<ReportPreview {...proprietes()} />);

    await user.click(screen.getByRole("tab", { name: /long/i }));

    expect(screen.getByText("Avancement du stage sur la semaine 29")).toBeInTheDocument();
    expect(screen.getByText("Semaine productive.")).toBeInTheDocument();
    expect(screen.getByText("178 tests verts")).toBeInTheDocument();
  });

  it("invite à générer quand aucun rapport n'existe", () => {
    render(<ReportPreview {...proprietes({ apercu: { etat: "absent" }, statut: "pending" })} />);

    expect(screen.getByText(/pas encore été généré/i)).toBeInTheDocument();
  });

  it("signale un rapport illisible sans planter", () => {
    // long_json/short_json sont typés `unknown` : une donnée hors schéma est possible.
    render(<ReportPreview {...proprietes({ apercu: { etat: "invalide" } })} />);

    expect(screen.getByText(/illisible/i)).toBeInTheDocument();
  });

  it("affiche le lien vers le Google Doc quand il existe", () => {
    render(<ReportPreview {...proprietes({ driveUrl: "https://docs.google.com/d/abc" })} />);

    expect(screen.getByRole("link", { name: /google doc/i })).toHaveAttribute(
      "href",
      "https://docs.google.com/d/abc",
    );
  });

  it("déclenche la génération au clic sur Générer", async () => {
    const onGenerate = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ReportPreview {...proprietes({ onGenerate })} />);

    await user.click(screen.getByRole("button", { name: /générer/i }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("affiche l'erreur remontée par la génération", async () => {
    // Cas réel tant que la Phase 8 (OAuth Google) n'est pas faite.
    const onGenerate = vi.fn().mockResolvedValue({ ok: false, error: "Aucun jeton Google." });
    const user = userEvent.setup();
    render(<ReportPreview {...proprietes({ onGenerate })} />);

    await user.click(screen.getByRole("button", { name: /générer/i }));

    expect(await screen.findByText("Aucun jeton Google.")).toBeInTheDocument();
  });

  it("désactive le bouton pendant la génération", async () => {
    let terminer: (r: { ok: boolean }) => void = () => {};
    const onGenerate = vi.fn().mockReturnValue(new Promise((resolve) => (terminer = resolve)));
    const user = userEvent.setup();
    render(<ReportPreview {...proprietes({ onGenerate })} />);

    const bouton = screen.getByRole("button", { name: /générer/i });
    await user.click(bouton);

    expect(bouton).toBeDisabled();

    terminer({ ok: true });
    await waitFor(() => expect(bouton).toBeEnabled());
  });
});
