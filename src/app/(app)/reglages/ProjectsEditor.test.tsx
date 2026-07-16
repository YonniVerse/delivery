import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectsEditor } from "./ProjectsEditor";
import type { ProjectRow } from "@/lib/supabase/types";

const projets: ProjectRow[] = [
  {
    id: "p1",
    nom: "Delivery",
    role: "développeur",
    description: "PWA de rapports",
    active: true,
    created_at: "",
  },
  {
    id: "p2",
    nom: "Lexxy",
    role: "testeur",
    description: "App juridique",
    active: true,
    created_at: "",
  },
];

function proprietes(overrides = {}) {
  return {
    initial: projets,
    onCreate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("ProjectsEditor", () => {
  it("liste les projets avec le rôle tenu sur chacun", () => {
    render(<ProjectsEditor {...proprietes()} />);

    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("développeur")).toBeInTheDocument();
    expect(screen.getByText("Lexxy")).toBeInTheDocument();
    expect(screen.getByText("testeur")).toBeInTheDocument();
  });

  it("invite à ajouter un projet quand la liste est vide", () => {
    render(<ProjectsEditor {...proprietes({ initial: [] })} />);

    expect(screen.getByText(/aucun projet/i)).toBeInTheDocument();
  });

  it("ajoute un projet avec son nom, son rôle et sa description", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProjectsEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/^nom/i), "Salon Atlas");
    await user.type(screen.getByLabelText(/^rôle/i), "designer");
    await user.type(screen.getByLabelText(/^description/i), "Site vitrine");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        nom: "Salon Atlas",
        role: "designer",
        description: "Site vitrine",
      }),
    );
  });

  it("refuse d'ajouter un projet sans rôle", async () => {
    // Le rôle par projet conditionne le contenu du rapport : il est obligatoire.
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ProjectsEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/^nom/i), "Sans rôle");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/rôle/i);
  });

  it("refuse d'ajouter un projet sans nom", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ProjectsEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/^rôle/i), "dev");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("supprime un projet", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProjectsEditor {...proprietes({ onDelete })} />);

    const ligne = screen.getByTestId("projet-p1");
    await user.click(within(ligne).getByRole("button", { name: /supprimer/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("p1"));
  });

  it("affiche une erreur quand l'ajout échoue", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("réseau"));
    const user = userEvent.setup();
    render(<ProjectsEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/^nom/i), "X");
    await user.type(screen.getByLabelText(/^rôle/i), "dev");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/échec/i);
  });
});
