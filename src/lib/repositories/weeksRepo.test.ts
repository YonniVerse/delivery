import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { getActiveWeek, createWeek, setWeekStatus, listWeeks } from "./weeksRepo";
import type { WeekRow } from "@/lib/supabase/types";

function week(overrides: Partial<WeekRow> = {}): WeekRow {
  return {
    id: "w1",
    label_fr: "30 juin au 4 juillet 2026",
    start_date: "2026-06-30",
    end_date: "2026-07-04",
    status: "active",
    created_at: "2026-06-30T00:00:00Z",
    ...overrides,
  };
}

describe("weeksRepo", () => {
  it("getActiveWeek renvoie la semaine active ou null", async () => {
    const { client, calls } = createFakeSupabase({
      weeks: { data: week(), error: null },
    });
    const w = await getActiveWeek(client);
    expect(w?.id).toBe("w1");
    expect(calls.some((c) => c.method === "eq" && c.args[0] === "status")).toBe(true);
  });

  it("getActiveWeek renvoie null quand aucune", async () => {
    const { client } = createFakeSupabase({ weeks: { data: null, error: null } });
    expect(await getActiveWeek(client)).toBeNull();
  });

  it("createWeek insère et renvoie la ligne", async () => {
    const { client, calls } = createFakeSupabase({
      weeks: { data: week(), error: null },
    });
    const w = await createWeek(client, {
      label_fr: "30 juin au 4 juillet 2026",
      start_date: "2026-06-30",
      end_date: "2026-07-04",
    });
    expect(w.id).toBe("w1");
    expect(calls.find((c) => c.method === "insert")?.args[0]).toMatchObject({
      label_fr: "30 juin au 4 juillet 2026",
      status: "active",
    });
  });

  it("setWeekStatus met à jour le statut", async () => {
    const { client, calls } = createFakeSupabase({
      weeks: { data: null, error: null },
    });
    await setWeekStatus(client, "w1", "archived");
    expect(calls.find((c) => c.method === "update")?.args[0]).toMatchObject({
      status: "archived",
    });
    expect(calls.some((c) => c.method === "eq" && c.args[1] === "w1")).toBe(true);
  });
});

describe("listWeeks", () => {
  it("retourne toutes les semaines, de la plus récente à la plus ancienne", async () => {
    const semaines = [week(), week({ id: "w2", status: "archived" })];
    const { client, calls } = createFakeSupabase({ weeks: { data: semaines, error: null } });

    await expect(listWeeks(client)).resolves.toEqual(semaines);
    expect(calls.find((c) => c.method === "order")?.args).toEqual([
      "start_date",
      { ascending: false },
    ]);
  });

  it("retourne une liste vide quand il n'y a aucune semaine", async () => {
    const { client } = createFakeSupabase({ weeks: { data: null, error: null } });
    await expect(listWeeks(client)).resolves.toEqual([]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ weeks: { data: null, error: { message: "boum" } } });
    await expect(listWeeks(client)).rejects.toThrow("listWeeks: boum");
  });
});
