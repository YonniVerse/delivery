import { describe, it, expect } from "vitest";
import { joinReportsToWeeks } from "./history";
import type { ReportRow, WeekRow } from "@/lib/supabase/types";

function week(overrides: Partial<WeekRow> = {}): WeekRow {
  return {
    id: "w1",
    label_fr: "30 juin au 4 juillet 2026",
    start_date: "2026-06-30",
    end_date: "2026-07-04",
    status: "archived",
    created_at: "2026-06-30T00:00:00Z",
    ...overrides,
  };
}

function report(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: "r1",
    week_id: "w1",
    long_json: null,
    short_json: null,
    drive_url: null,
    gmail_draft_id: null,
    status: "generated",
    generated_at: "2026-07-04T13:30:00Z",
    sent_at: null,
    ...overrides,
  };
}

describe("joinReportsToWeeks", () => {
  it("associe chaque rapport à sa semaine", () => {
    const entrees = joinReportsToWeeks([report()], [week()]);

    expect(entrees).toHaveLength(1);
    expect(entrees[0]).toMatchObject({
      weekId: "w1",
      labelFr: "30 juin au 4 juillet 2026",
      status: "generated",
    });
  });

  it("trie de la semaine la plus récente à la plus ancienne", () => {
    const semaines = [
      week({ id: "w1", start_date: "2026-06-30", label_fr: "ancienne" }),
      week({ id: "w2", start_date: "2026-07-07", label_fr: "récente" }),
    ];
    const rapports = [report({ id: "r1", week_id: "w1" }), report({ id: "r2", week_id: "w2" })];

    const entrees = joinReportsToWeeks(rapports, semaines);

    expect(entrees.map((e) => e.labelFr)).toEqual(["récente", "ancienne"]);
  });

  it("inclut les semaines sans rapport, en attente", () => {
    const entrees = joinReportsToWeeks([], [week()]);

    expect(entrees).toHaveLength(1);
    expect(entrees[0]).toMatchObject({ weekId: "w1", status: "pending", generatedAt: null });
  });

  it("ignore un rapport orphelin dont la semaine n'existe plus", () => {
    const entrees = joinReportsToWeeks([report({ week_id: "disparue" })], [week()]);

    // La semaine w1 reste listée (sans rapport) ; l'orphelin n'apparaît pas.
    expect(entrees).toHaveLength(1);
    expect(entrees[0]).toMatchObject({ weekId: "w1", status: "pending" });
  });

  it("renvoie une liste vide quand il n'y a ni semaine ni rapport", () => {
    expect(joinReportsToWeeks([], [])).toEqual([]);
  });

  it("expose le lien Drive et la date d'envoi du rapport", () => {
    const entrees = joinReportsToWeeks(
      [report({ drive_url: "https://docs.google.com/d/abc", sent_at: "2026-07-04T14:00:00Z", status: "sent" })],
      [week()],
    );

    expect(entrees[0]).toMatchObject({
      driveUrl: "https://docs.google.com/d/abc",
      sentAt: "2026-07-04T14:00:00Z",
      status: "sent",
    });
  });
});
