import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReposEditor } from "./ReposEditor";
import type { RepoRow } from "@/lib/supabase/types";

const depots: RepoRow[] = [
  { id: "r1", full_name: "yonni-coder/delivery", active: true, created_at: "" },
  { id: "r2", full_name: "org/lexxy", active: false, created_at: "" },
];

function proprietes(overrides = {}) {
  return {
    initial: depots,
    onCreate: vi.fn().mockResolvedValue(undefined),
    onToggle: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("ReposEditor", () => {
  it("liste les dépôts suivis", () => {
    render(<ReposEditor {...proprietes()} />);

    expect(screen.getByText("yonni-coder/delivery")).toBeInTheDocument();
    expect(screen.getByText("org/lexxy")).toBeInTheDocument();
  });

  it("invite à ajouter un dépôt quand la liste est vide", () => {
    render(<ReposEditor {...proprietes({ initial: [] })} />);

    expect(screen.getByText(/aucun dépôt/i)).toBeInTheDocument();
  });

  it("ajoute un dépôt au format owner/repo", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReposEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/dépôt/i), "yonni-coder/nouveau");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("yonni-coder/nouveau"));
  });

  it("refuse un dépôt qui n'est pas au format owner/repo", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ReposEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/dépôt/i), "juste-un-nom");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/owner\/repo/i);
  });

  it("refuse une URL GitHub complète", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<ReposEditor {...proprietes({ onCreate })} />);

    await user.type(screen.getByLabelText(/dépôt/i), "https://github.com/org/repo");
    await user.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("active ou désactive le suivi d'un dépôt", async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReposEditor {...proprietes({ onToggle })} />);

    const ligne = screen.getByTestId("depot-r2");
    await user.click(within(ligne).getByRole("button", { name: /activer/i }));

    await waitFor(() => expect(onToggle).toHaveBeenCalledWith("r2", true));
  });

  it("supprime un dépôt", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ReposEditor {...proprietes({ onDelete })} />);

    const ligne = screen.getByTestId("depot-r1");
    await user.click(within(ligne).getByRole("button", { name: /supprimer/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("r1"));
  });
});
