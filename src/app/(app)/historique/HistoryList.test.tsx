import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HistoryList } from "./HistoryList";
import type { HistoryEntry } from "@/domain/history";

const entrees: HistoryEntry[] = [
  {
    weekId: "w2",
    labelFr: "6 au 10 juillet 2026",
    startDate: "2026-07-06",
    status: "sent",
    driveUrl: "https://docs.google.com/d/abc",
    generatedAt: "2026-07-10T13:30:00Z",
    sentAt: "2026-07-10T14:00:00Z",
  },
  {
    weekId: "w1",
    labelFr: "29 juin au 3 juillet 2026",
    startDate: "2026-06-29",
    status: "pending",
    driveUrl: null,
    generatedAt: null,
    sentAt: null,
  },
];

describe("HistoryList", () => {
  it("liste les semaines avec leur libellé", () => {
    render(<HistoryList entrees={entrees} />);

    expect(screen.getByText("6 au 10 juillet 2026")).toBeInTheDocument();
    expect(screen.getByText("29 juin au 3 juillet 2026")).toBeInTheDocument();
  });

  it("affiche le statut de chaque rapport en français", () => {
    render(<HistoryList entrees={entrees} />);

    expect(within(screen.getByTestId("semaine-w2")).getByText("Envoyé")).toBeInTheDocument();
    expect(within(screen.getByTestId("semaine-w1")).getByText("À générer")).toBeInTheDocument();
  });

  it("lie vers le Google Doc quand il existe", () => {
    render(<HistoryList entrees={entrees} />);

    const ligne = screen.getByTestId("semaine-w2");
    expect(within(ligne).getByRole("link")).toHaveAttribute(
      "href",
      "https://docs.google.com/d/abc",
    );
  });

  it("n'affiche aucun lien pour une semaine sans rapport", () => {
    render(<HistoryList entrees={entrees} />);

    const ligne = screen.getByTestId("semaine-w1");
    expect(within(ligne).queryByRole("link")).not.toBeInTheDocument();
  });

  it("affiche un état vide quand aucune semaine n'existe", () => {
    render(<HistoryList entrees={[]} />);

    expect(screen.getByText(/aucun rapport/i)).toBeInTheDocument();
  });
});
