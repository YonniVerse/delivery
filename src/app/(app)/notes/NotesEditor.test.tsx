import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, act } from "@testing-library/react";
import { NotesEditor, DEBOUNCE_MS } from "./NotesEditor";
import { SECTION_TITLES } from "@/domain/notes";

/**
 * On pilote la saisie par `fireEvent.change` plutôt que par user-event : celui-ci
 * attend entre les touches des timers que les faux timers ne font pas avancer, et
 * `type()` se bloque. Pour un textarea contrôlé dont on teste le debounce, un
 * `change` synchrone est équivalent — et parfaitement déterministe.
 */
function saisir(section: keyof typeof SECTION_TITLES, valeur: string) {
  fireEvent.change(champ(section), { target: { value: valeur } });
}

/** Le textarea d'une section, retrouvé par son intitulé visible. */
function champ(section: keyof typeof SECTION_TITLES): HTMLTextAreaElement {
  return screen.getByLabelText(SECTION_TITLES[section]) as HTMLTextAreaElement;
}

/** Laisse filer le debounce et vide les promesses d'enregistrement. */
async function laisserPasser(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function etat(section: keyof typeof SECTION_TITLES): HTMLElement {
  return screen.getByTestId(`etat-${section}`);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NotesEditor", () => {
  it("rend les 7 sections de la semaine", () => {
    render(<NotesEditor initialNotes={{}} saveSection={vi.fn()} />);

    for (const titre of Object.values(SECTION_TITLES)) {
      expect(screen.getByLabelText(titre)).toBeInTheDocument();
    }
  });

  it("affiche le contenu initial de chaque section", () => {
    render(
      <NotesEditor
        initialNotes={{ tachesRealisees: "Écrit les tests", tests: "Vitest" }}
        saveSection={vi.fn()}
      />,
    );

    expect(champ("tachesRealisees")).toHaveValue("Écrit les tests");
    expect(champ("tests")).toHaveValue("Vitest");
  });

  it("rend sans planter quand aucune note n'existe encore", () => {
    // WeekNotes est un Partial : toute section peut être absente.
    render(<NotesEditor initialNotes={{}} saveSection={vi.fn()} />);

    expect(champ("objectifs")).toHaveValue("");
  });

  it("n'enregistre pas tant que le debounce n'est pas écoulé", async () => {
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "Finir la Phase 7");
    await laisserPasser(DEBOUNCE_MS - 1);

    expect(saveSection).not.toHaveBeenCalled();
  });

  it("enregistre la section saisie une fois le debounce écoulé", async () => {
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "Finir la Phase 7");
    await laisserPasser(DEBOUNCE_MS);

    expect(saveSection).toHaveBeenCalledExactlyOnceWith("objectifs", "Finir la Phase 7");
  });

  it("ne déclenche qu'un seul enregistrement pour une salve de frappes", async () => {
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("livrables", "Doc");
    saisir("livrables", "Doc A");
    saisir("livrables", "Doc API");
    await laisserPasser(DEBOUNCE_MS);

    expect(saveSection).toHaveBeenCalledExactlyOnceWith("livrables", "Doc API");
  });

  it("enregistre chaque section indépendamment", async () => {
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("pointsBlocage", "DNS Supabase");
    saisir("tests", "178 verts");
    await laisserPasser(DEBOUNCE_MS);

    expect(saveSection).toHaveBeenCalledTimes(2);
    expect(saveSection).toHaveBeenCalledWith("pointsBlocage", "DNS Supabase");
    expect(saveSection).toHaveBeenCalledWith("tests", "178 verts");
  });

  it("laisse la section commits en lecture seule et ne l'enregistre jamais", async () => {
    // Le cron GitHub quotidien réécrit cette section : une saisie serait écrasée.
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{ commits: "📁 delivery" }} saveSection={saveSection} />);

    expect(champ("commits")).toHaveAttribute("readonly");

    saisir("commits", "tentative");
    await laisserPasser(DEBOUNCE_MS);

    expect(saveSection).not.toHaveBeenCalled();
    expect(champ("commits")).toHaveValue("📁 delivery");
  });

  it("signale l'enregistrement réussi", async () => {
    const saveSection = vi.fn().mockResolvedValue(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "x");
    await laisserPasser(DEBOUNCE_MS);

    expect(within(etat("objectifs")).getByText("Enregistré")).toBeInTheDocument();
  });

  it("signale l'enregistrement en cours tant qu'il n'est pas résolu", async () => {
    const saveSection = vi.fn().mockReturnValue(new Promise<void>(() => {}));
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "x");
    await laisserPasser(DEBOUNCE_MS);

    expect(within(etat("objectifs")).getByText("Enregistrement…")).toBeInTheDocument();
  });

  it("affiche une erreur sans perdre la saisie quand l'enregistrement échoue", async () => {
    const saveSection = vi.fn().mockRejectedValue(new Error("réseau"));
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "Ne pas perdre ça");
    await laisserPasser(DEBOUNCE_MS);

    expect(within(etat("objectifs")).getByText(/échec/i)).toBeInTheDocument();
    // La saisie reste à l'écran : l'utilisateur ne doit rien retaper.
    expect(champ("objectifs")).toHaveValue("Ne pas perdre ça");
  });

  it("ignore le résultat d'un enregistrement obsolète", async () => {
    // Un premier save lent qui échoue ne doit pas écraser l'état d'un save plus récent réussi.
    let rejeterLePremier: (e: Error) => void = () => {};
    const saveSection = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((_, reject) => (rejeterLePremier = reject)),
      )
      .mockResolvedValueOnce(undefined);
    render(<NotesEditor initialNotes={{}} saveSection={saveSection} />);

    saisir("objectifs", "v1");
    await laisserPasser(DEBOUNCE_MS);

    saisir("objectifs", "v2");
    await laisserPasser(DEBOUNCE_MS);

    await act(async () => {
      rejeterLePremier(new Error("lent et périmé"));
    });

    expect(saveSection).toHaveBeenCalledTimes(2);
    expect(within(etat("objectifs")).getByText("Enregistré")).toBeInTheDocument();
  });
});
