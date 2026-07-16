import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { handleImportCommits, handleReport, handleCloseWeek } from "./handlers";
import type { ImportCommitsCtx, ReportCtx, CloseWeekCtx } from "./handlers";
import type { WeekRow, RepoRow } from "@/lib/supabase/types";

const SECRET = "s3cr3t";

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

function req(auth: string | null = `Bearer ${SECRET}`): Request {
  return new Request("https://exemple.test/api/cron/commits", {
    method: "GET",
    headers: auth ? { Authorization: auth } : {},
  });
}

const { client } = createFakeSupabase();

/** Silence le console.error des chemins 500 tout en permettant de l'assertion. */
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// handleImportCommits
// ---------------------------------------------------------------------------
function importCtx(overrides: Partial<ImportCommitsCtx> = {}): ImportCommitsCtx {
  return {
    client,
    secret: SECRET,
    getActiveWeek: vi.fn(async () => semaine),
    listActiveRepos: vi.fn(async () => repos),
    importDailyCommits: vi.fn(async () => ({ inserted: 3, sectionUpdated: true })),
    deps: {} as ImportCommitsCtx["deps"],
    opts: { githubToken: "gh", githubAuthor: "yonni" },
    ...overrides,
  };
}

describe("handleImportCommits", () => {
  it("401 sans en-tête d'autorisation", async () => {
    const ctx = importCtx();
    const res = await handleImportCommits(req(null), ctx);

    expect(res.status).toBe(401);
    expect(ctx.getActiveWeek).not.toHaveBeenCalled();
  });

  it("409 quand aucune semaine active", async () => {
    const ctx = importCtx({ getActiveWeek: vi.fn(async () => null) });
    const res = await handleImportCommits(req(), ctx);

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
    expect(ctx.importDailyCommits).not.toHaveBeenCalled();
  });

  it("200 et transmet semaine + repos à l'orchestration", async () => {
    const ctx = importCtx();
    const res = await handleImportCommits(req(), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, inserted: 3, sectionUpdated: true });
    expect(ctx.importDailyCommits).toHaveBeenCalledWith(client, semaine, repos, ctx.deps, ctx.opts);
  });

  it("500 et masque le détail de l'erreur", async () => {
    const ctx = importCtx({
      importDailyCommits: vi.fn(async () => {
        throw new Error("GitHub 503 token=abcd");
      }),
    });
    const res = await handleImportCommits(req(), ctx);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).not.toContain("abcd");
    expect(console.error).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleReport
// ---------------------------------------------------------------------------
function reportCtx(overrides: Partial<ReportCtx> = {}): ReportCtx {
  return {
    client,
    secret: SECRET,
    getActiveWeek: vi.fn(async () => semaine),
    resolveAccessToken: vi.fn(async () => "at-valide"),
    runWeeklyReport: vi.fn(async () => ({ status: "draft_created" as const, skipped: false })),
    deps: {} as ReportCtx["deps"],
    llmProvider: { generate: vi.fn(async () => "{}") },
    ...overrides,
  };
}

describe("handleReport", () => {
  it("401 avec un mauvais secret", async () => {
    const ctx = reportCtx();
    const res = await handleReport(req("Bearer mauvais"), ctx);

    expect(res.status).toBe(401);
    expect(ctx.resolveAccessToken).not.toHaveBeenCalled();
  });

  it("409 quand aucune semaine active", async () => {
    const ctx = reportCtx({ getActiveWeek: vi.fn(async () => null) });
    const res = await handleReport(req(), ctx);

    expect(res.status).toBe(409);
    expect(ctx.runWeeklyReport).not.toHaveBeenCalled();
  });

  it("200 et passe l'access token résolu + le provider IA", async () => {
    const ctx = reportCtx();
    const res = await handleReport(req(), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, status: "draft_created", skipped: false });
    expect(ctx.runWeeklyReport).toHaveBeenCalledWith(client, semaine, ctx.deps, {
      accessToken: "at-valide",
      llmProvider: ctx.llmProvider,
    });
  });

  it("200 et signale skipped quand le brouillon existe déjà (idempotence)", async () => {
    const ctx = reportCtx({
      runWeeklyReport: vi.fn(async () => ({ status: "draft_created" as const, skipped: true })),
    });
    const res = await handleReport(req(), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ skipped: true });
  });

  it("500 quand le jeton Google est absent", async () => {
    const ctx = reportCtx({
      resolveAccessToken: vi.fn(async () => {
        throw new Error("Aucun jeton Google en base");
      }),
    });
    const res = await handleReport(req(), ctx);

    expect(res.status).toBe(500);
    expect(ctx.runWeeklyReport).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleCloseWeek
// ---------------------------------------------------------------------------
function closeCtx(overrides: Partial<CloseWeekCtx> = {}): CloseWeekCtx {
  const nouvelle: WeekRow = { ...semaine, id: "w2", label_fr: "20 au 26 juillet 2026" };
  return {
    client,
    secret: SECRET,
    getActiveWeek: vi.fn(async () => semaine),
    closeWeek: vi.fn(async () => ({ archivedWeekId: "w1", newWeek: nouvelle })),
    deps: {} as CloseWeekCtx["deps"],
    ...overrides,
  };
}

describe("handleCloseWeek", () => {
  it("401 sans autorisation", async () => {
    const res = await handleCloseWeek(req(null), closeCtx());
    expect(res.status).toBe(401);
  });

  it("409 quand aucune semaine active", async () => {
    const ctx = closeCtx({ getActiveWeek: vi.fn(async () => null) });
    const res = await handleCloseWeek(req(), ctx);

    expect(res.status).toBe(409);
    expect(ctx.closeWeek).not.toHaveBeenCalled();
  });

  it("200 et renvoie la semaine archivée + la nouvelle", async () => {
    const ctx = closeCtx();
    const res = await handleCloseWeek(req(), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      archivedWeekId: "w1",
      newWeek: { id: "w2" },
    });
    expect(ctx.closeWeek).toHaveBeenCalledWith(client, semaine, ctx.deps);
  });

  it("500 sur échec de l'orchestration", async () => {
    const ctx = closeCtx({
      closeWeek: vi.fn(async () => {
        throw new Error("insert failed");
      }),
    });
    const res = await handleCloseWeek(req(), ctx);
    expect(res.status).toBe(500);
  });
});
