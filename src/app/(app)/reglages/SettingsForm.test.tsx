import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm } from "./SettingsForm";
import type { SettingsRow } from "@/lib/supabase/types";

const reglages: SettingsRow = {
  id: true,
  nom_prenom: "Yonni R.",
  destinataires: "tuteur@exemple.fr",
  cc: "",
  sujet_fil: "Rapport de stage",
  timezone: "Indian/Antananarivo",
  llm_provider: "gemini",
  drive_folder_id: null,
  gmail_thread_id: null,
  updated_at: "2026-07-17T00:00:00Z",
};

describe("SettingsForm", () => {
  it("affiche les réglages existants", () => {
    render(<SettingsForm initial={reglages} save={vi.fn()} />);

    expect(screen.getByLabelText(/nom et prénom/i)).toHaveValue("Yonni R.");
    expect(screen.getByLabelText(/destinataires/i)).toHaveValue("tuteur@exemple.fr");
    expect(screen.getByLabelText(/sujet du fil/i)).toHaveValue("Rapport de stage");
  });

  it("enregistre les champs modifiés", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SettingsForm initial={reglages} save={save} />);

    await user.clear(screen.getByLabelText(/nom et prénom/i));
    await user.type(screen.getByLabelText(/nom et prénom/i), "Yonni Rakoto");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ nom_prenom: "Yonni Rakoto" })),
    );
  });

  it("permet de changer le provider IA", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SettingsForm initial={reglages} save={save} />);

    await user.selectOptions(screen.getByLabelText(/provider/i), "groq");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(expect.objectContaining({ llm_provider: "groq" })),
    );
  });

  it("confirme l'enregistrement", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SettingsForm initial={reglages} save={save} />);

    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    expect(await screen.findByText(/enregistré/i)).toBeInTheDocument();
  });

  it("affiche une erreur quand l'enregistrement échoue", async () => {
    const save = vi.fn().mockRejectedValue(new Error("réseau"));
    const user = userEvent.setup();
    render(<SettingsForm initial={reglages} save={save} />);

    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/échec/i);
  });
});
