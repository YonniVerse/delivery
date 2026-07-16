import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { runImportCommits, runReport, runCloseWeek } from "./operations";
import type { ImportCommitsCtx, ReportCtx, CloseWeekCtx } from "./operations";
import type { WeekRow, RepoRow } from "@/lib/supabase/types";

const semaine: WeekRow = {
  id: "w1",
  label_fr: "13 au 19 juillet 2026",
  start_date: "2026-07-13",
  end_date: "2026-07-19",
  status: "active",
  created_at: "2026-07-13T00:00:00.000Z",
};

const repos: RepoRow[] = [
  { id: "r1", full_name: "yonni/delivery", active: true, created_at: "2026-01-01T00:00:00.000Z" },
];

const { client } = createFakeSupabase();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function importCtx(overrides: Partial<ImportCommitsCtx> = {}): ImportCommitsCtx {
  return {
    client,
    secret: "s3cr3t",
    getActiveWeek: vi.fn(async () => semaine),
    listActiveRepos: vi.fn(async () => repos),
    importDailyCommits: vi.fn(async () => ({ inserted: 3, sectionUpdated: true })),
    deps: {} as ImportCommitsCtx["deps"],
    opts: { githubToken: "gh", githubAuthor: "yonni" },
    ...overrides,
  };
}

function reportCtx(overrides: Partial<ReportCtx> = {}): ReportCtx {
  return {
    client,
    secret: "s3cr3t",
    getActiveWeek: vi.fn(async () => semaine),
    resolveAccessToken: vi.fn(async () => "jeton"),
    runWeeklyReport: vi.fn(async () => ({
      status: "draft_created" as const,
      skipped: false,
    })),
    deps: {} as ReportCtx["deps"],
    llmProvider: {} as ReportCtx["llmProvider"],
    ...overrides,
  };
}

function closeCtx(overrides: Partial<CloseWeekCtx> = {}): CloseWeekCtx {
  return {
    client,
    secret: "s3cr3t",
    getActiveWeek: vi.fn(async () => semaine),
    closeWeek: vi.fn(async () => ({
      archivedWeekId: "w1",
      newWeek: { ...semaine, id: "w2", label_fr: "20 au 26 juillet 2026" },
    })),
    deps: {} as CloseWeekCtx["deps"],
    ...overrides,
  };
}

describe("runImportCommits", () => {
  it("renvoie ok avec le résultat de l'orchestration", async () => {
    const res = await runImportCommits(importCtx());

    expect(res).toEqual({ ok: true, data: { inserted: 3, sectionUpdated: true } });
  });

  it("passe la semaine active et les dépôts actifs à l'orchestration", async () => {
    const ctx = importCtx();
    await runImportCommits(ctx);

    expect(ctx.importDailyCommits).toHaveBeenCalledWith(
      ctx.client,
      semaine,
      repos,
      ctx.deps,
      ctx.opts,
    );
  });

  it("renvoie le code no_week quand aucune semaine n'est active", async () => {
    const ctx = importCtx({ getActiveWeek: vi.fn(async () => null) });
    const res = await runImportCommits(ctx);

    expect(res).toMatchObject({ ok: false, code: "no_week" });
    expect(ctx.importDailyCommits).not.toHaveBeenCalled();
  });

  it("renvoie le code error et log côté serveur quand l'orchestration échoue", async () => {
    const ctx = importCtx({
      importDailyCommits: vi.fn(async () => {
        throw new Error("jeton github expiré");
      }),
    });
    const res = await runImportCommits(ctx);

    expect(res).toMatchObject({ ok: false, code: "error" });
    // Le détail ne doit jamais remonter : il peut contenir un jeton.
    if (!res.ok) expect(res.message).not.toContain("jeton github");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("runReport", () => {
  it("résout le jeton Google puis renvoie ok", async () => {
    const ctx = reportCtx();
    const res = await runReport(ctx);

    expect(ctx.resolveAccessToken).toHaveBeenCalledWith(ctx.client);
    expect(res).toEqual({ ok: true, data: { status: "draft_created", skipped: false } });
  });

  it("renvoie le code error quand aucun jeton Google n'est disponible", async () => {
    // Cas réel tant que la Phase 8 (OAuth) n'est pas faite : `oauth_tokens` est vide.
    const ctx = reportCtx({
      resolveAccessToken: vi.fn(async () => {
        throw new Error("aucun jeton");
      }),
    });
    const res = await runReport(ctx);

    expect(res).toMatchObject({ ok: false, code: "error" });
    expect(ctx.runWeeklyReport).not.toHaveBeenCalled();
  });

  it("renvoie le code no_week quand aucune semaine n'est active", async () => {
    const ctx = reportCtx({ getActiveWeek: vi.fn(async () => null) });
    await expect(runReport(ctx)).resolves.toMatchObject({ ok: false, code: "no_week" });
  });
});

describe("runCloseWeek", () => {
  it("renvoie ok avec le résultat de la clôture", async () => {
    const res = await runCloseWeek(closeCtx());

    expect(res).toMatchObject({ ok: true, data: { archivedWeekId: "w1" } });
  });

  it("renvoie le code no_week quand aucune semaine n'est active", async () => {
    const ctx = closeCtx({ getActiveWeek: vi.fn(async () => null) });
    await expect(runCloseWeek(ctx)).resolves.toMatchObject({ ok: false, code: "no_week" });
  });
});
