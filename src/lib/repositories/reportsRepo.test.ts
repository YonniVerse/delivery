import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { getReportForWeek, upsertReport, listReports } from "./reportsRepo";
import type { ReportRow } from "@/lib/supabase/types";

function report(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    id: "r1",
    week_id: "w1",
    long_json: null,
    short_json: null,
    drive_url: null,
    gmail_draft_id: null,
    status: "pending",
    generated_at: null,
    sent_at: null,
    ...overrides,
  };
}

describe("reportsRepo", () => {
  it("getReportForWeek renvoie le rapport ou null", async () => {
    const { client } = createFakeSupabase({
      reports: { data: report({ status: "draft_created" }), error: null },
    });
    const r = await getReportForWeek(client, "w1");
    expect(r?.status).toBe("draft_created");
  });

  it("getReportForWeek renvoie null quand absent", async () => {
    const { client } = createFakeSupabase({ reports: { data: null, error: null } });
    expect(await getReportForWeek(client, "w1")).toBeNull();
  });

  it("upsertReport écrit sur conflit week_id et renvoie la ligne", async () => {
    const { client, calls } = createFakeSupabase({
      reports: { data: report({ status: "generated" }), error: null },
    });
    const r = await upsertReport(client, "w1", { status: "generated", long_json: { objet: "x" } });
    expect(r.status).toBe("generated");
    const up = calls.find((c) => c.method === "upsert");
    expect(up?.args[0]).toMatchObject({ week_id: "w1", status: "generated" });
    expect(up?.args[1]).toMatchObject({ onConflict: "week_id" });
  });
});

describe("listReports", () => {
  it("retourne tous les rapports", async () => {
    const rapports = [report(), report({ id: "r2", week_id: "w2" })];
    const { client } = createFakeSupabase({ reports: { data: rapports, error: null } });
    await expect(listReports(client)).resolves.toEqual(rapports);
  });

  it("retourne une liste vide quand il n'y a aucun rapport", async () => {
    const { client } = createFakeSupabase({ reports: { data: null, error: null } });
    await expect(listReports(client)).resolves.toEqual([]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ reports: { data: null, error: { message: "boum" } } });
    await expect(listReports(client)).rejects.toThrow("listReports: boum");
  });
});
