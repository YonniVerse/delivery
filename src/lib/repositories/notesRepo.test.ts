import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { listNotesForWeek, upsertSection, rowsToWeekNotes } from "./notesRepo";
import type { NoteRow } from "@/lib/supabase/types";

function note(section: NoteRow["section"], content: string): NoteRow {
  return {
    id: `n-${section}`,
    week_id: "w1",
    section,
    content,
    updated_at: "2026-07-06T00:00:00Z",
  };
}

describe("notesRepo", () => {
  it("listNotesForWeek renvoie les lignes de la semaine", async () => {
    const rows = [note("tachesRealisees", "fait X"), note("commits", "abc")];
    const { client, calls } = createFakeSupabase({ notes: { data: rows, error: null } });
    const res = await listNotesForWeek(client, "w1");
    expect(res).toHaveLength(2);
    expect(calls.some((c) => c.method === "eq" && c.args[0] === "week_id" && c.args[1] === "w1")).toBe(
      true,
    );
  });

  it("rowsToWeekNotes convertit en WeekNotes (map section→content)", () => {
    const notes = rowsToWeekNotes([note("tachesRealisees", "fait X"), note("commits", "abc")]);
    expect(notes.tachesRealisees).toBe("fait X");
    expect(notes.commits).toBe("abc");
    expect(notes.tests).toBeUndefined();
  });

  it("upsertSection écrit une section avec onConflict week_id,section", async () => {
    const { client, calls } = createFakeSupabase({
      notes: { data: note("commits", "abc"), error: null },
    });
    const saved = await upsertSection(client, "w1", "commits", "abc");
    expect(saved.content).toBe("abc");
    const up = calls.find((c) => c.method === "upsert");
    expect(up?.args[0]).toMatchObject({ week_id: "w1", section: "commits", content: "abc" });
    expect(up?.args[1]).toMatchObject({ onConflict: "week_id,section" });
  });

  it("upsertSection lève sur erreur", async () => {
    const { client } = createFakeSupabase({
      notes: { data: null, error: { message: "conflict" } },
    });
    await expect(upsertSection(client, "w1", "tests", "x")).rejects.toThrow(/conflict/);
  });
});
