import { describe, it, expect, vi } from "vitest";
import { closeWeek } from "./closeWeek";
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow } from "@/lib/supabase/types";
import type { CreateWeekInput } from "@/lib/repositories/weeksRepo";

const week: WeekRow = {
  id: "w1",
  label_fr: "7 juillet 2026 au 11 juillet 2026",
  start_date: "2026-07-07",
  end_date: "2026-07-13",
  status: "active",
  created_at: "",
};

function makeDeps(overrides: Partial<Parameters<typeof closeWeek>[2]> = {}) {
  return {
    setWeekStatus: vi.fn(async () => {}),
    createWeek: vi.fn(async (client: DbClient, input: CreateWeekInput) => ({
      id: "w2",
      label_fr: input.label_fr,
      start_date: input.start_date,
      end_date: input.end_date,
      status: "active",
      created_at: new Date().toISOString(),
    }) as WeekRow),
    ...overrides,
  };
}

// Un mardi par défaut
const refDate = new Date("2026-07-07T10:00:00Z");

describe("closeWeek", () => {
  it("archive la semaine courante et crée la semaine suivante avec le bon libellé", async () => {
    const deps = makeDeps();
    const result = await closeWeek({} as DbClient, week, deps, { ref: refDate });

    // 1. Archivage de la semaine courante
    expect(deps.setWeekStatus).toHaveBeenCalledTimes(1);
    expect(deps.setWeekStatus).toHaveBeenCalledWith(expect.anything(), "w1", "archived");

    // 2. Création de la semaine suivante (lundi 13 au vendredi 17, end_date stocké comme un dimanche pour la semaine calendaire : lundi 13 au lundi 20 ? ou dimanche 19 ?)
    // formaterDateFR() formatte le jour et le mois et l'année (ex: 13 juillet 2026 au 17 juillet 2026)
    // closeWeek calcule le next monday.
    expect(deps.createWeek).toHaveBeenCalledTimes(1);
    const createInput = vi.mocked(deps.createWeek).mock.calls[0][1];
    expect(createInput.label_fr).toBe("13 juillet 2026 au 17 juillet 2026");
    expect(createInput.start_date).toBe("2026-07-13");
    // fin de la semaine = dimanche
    expect(createInput.end_date).toBe("2026-07-19");

    expect(result.archivedWeekId).toBe("w1");
    expect(result.newWeek.id).toBe("w2");
    expect(result.newWeek.label_fr).toBe("13 juillet 2026 au 17 juillet 2026");
  });

  it("gère un jour du week-end (samedi) correctement pour passer à la semaine suivante", async () => {
    const deps = makeDeps();
    const refSamedi = new Date("2026-07-11T10:00:00Z");
    const result = await closeWeek({} as DbClient, week, deps, { ref: refSamedi });

    const createInput = vi.mocked(deps.createWeek).mock.calls[0][1];
    expect(createInput.label_fr).toBe("13 juillet 2026 au 17 juillet 2026");
    expect(createInput.start_date).toBe("2026-07-13");
    expect(createInput.end_date).toBe("2026-07-19");
    expect(result.newWeek.label_fr).toBe("13 juillet 2026 au 17 juillet 2026");
  });
});
