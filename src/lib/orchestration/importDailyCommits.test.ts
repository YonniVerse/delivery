import { describe, it, expect, vi } from "vitest";
import { importDailyCommits } from "./importDailyCommits";
import type { WeekRow, CommitRow } from "@/lib/supabase/types";
import type { Commit } from "@/lib/github/client";
import type { DbClient } from "@/lib/supabase/client";

const week: WeekRow = {
  id: "w1",
  label_fr: "7 juillet 2026 au 11 juillet 2026",
  start_date: "2026-07-07",
  end_date: "2026-07-13",
  status: "active",
  created_at: "",
};

const c = (sha: string, msg: string): Commit => ({
  sha,
  message: msg,
  date: new Date("2026-07-09T14:30:00Z"),
});

const repos = [
  { id: "r1", full_name: "org/repoA", active: true, created_at: "" },
  { id: "r2", full_name: "org/repoB", active: true, created_at: "" },
];

function makeDeps(overrides: Partial<Parameters<typeof importDailyCommits>[3]> = {}) {
  return {
    fetchCommits: vi.fn(async () => [] as Commit[]),
    insertCommits: vi.fn(async () => [] as CommitRow[]),
    listCommitsForWeek: vi.fn(async () => [] as CommitRow[]),
    upsertSection: vi.fn(async () => ({}) as never),
    ...overrides,
  };
}

const opts = { githubToken: "ghp_test", githubAuthor: "yonni", date: new Date("2026-07-09T16:00:00Z") };

describe("importDailyCommits", () => {
  it("import 2 repos × N commits → insert + section notes recomposée", async () => {
    const deps = makeDeps({
      fetchCommits: vi.fn()
        .mockResolvedValueOnce([c("aaa1111", "feat: A")])
        .mockResolvedValueOnce([c("bbb2222", "fix: B"), c("ccc3333", "chore: C")]),
      insertCommits: vi.fn(async () => [] as CommitRow[]),
      listCommitsForWeek: vi.fn(async () =>
        [
          { id: "1", week_id: "w1", repo: "org/repoA", sha: "aaa1111", message: "feat: A", committed_at: "2026-07-09T14:30:00Z", created_at: "" },
          { id: "2", week_id: "w1", repo: "org/repoB", sha: "bbb2222", message: "fix: B", committed_at: "2026-07-09T14:30:00Z", created_at: "" },
          { id: "3", week_id: "w1", repo: "org/repoB", sha: "ccc3333", message: "chore: C", committed_at: "2026-07-09T14:30:00Z", created_at: "" },
        ] as CommitRow[],
      ),
    });

    const result = await importDailyCommits({} as DbClient, week, repos, deps, opts);

    // fetchCommits appelé une fois par repo
    expect(deps.fetchCommits).toHaveBeenCalledTimes(2);
    // insertCommits appelé avec 3 lignes
    expect(deps.insertCommits).toHaveBeenCalledTimes(1);
    const insertedRows = vi.mocked(deps.insertCommits).mock.calls[0][1];
    expect(insertedRows).toHaveLength(3);
    // section notes mise à jour
    expect(deps.upsertSection).toHaveBeenCalledTimes(1);
    const [, , section, content] = vi.mocked(deps.upsertSection).mock.calls[0];
    expect(section).toBe("commits");
    expect(content).toContain("org/repoA");
    expect(content).toContain("org/repoB");
    expect(content).toContain("[aaa1111]");
    // retour
    expect(result.inserted).toBe(3);
    expect(result.sectionUpdated).toBe(true);
  });

  it("aucun commit → aucune insertion, section non touchée", async () => {
    const deps = makeDeps();
    const result = await importDailyCommits({} as DbClient, week, repos, deps, opts);

    expect(deps.insertCommits).not.toHaveBeenCalled();
    expect(deps.upsertSection).not.toHaveBeenCalled();
    expect(result.inserted).toBe(0);
    expect(result.sectionUpdated).toBe(false);
  });

  it("rejouer le même jour → upsert idempotent, section recomposée", async () => {
    const deps = makeDeps({
      fetchCommits: vi.fn().mockResolvedValue([c("aaa1111", "feat: A")]),
      // insertCommits retourne vide (doublons ignorés)
      insertCommits: vi.fn(async () => [] as CommitRow[]),
      // Mais listCommitsForWeek retourne les commits existants
      listCommitsForWeek: vi.fn(async () =>
        [{ id: "1", week_id: "w1", repo: "org/repoA", sha: "aaa1111", message: "feat: A", committed_at: "2026-07-09T14:30:00Z", created_at: "" }] as CommitRow[],
      ),
    });

    const result = await importDailyCommits({} as DbClient, week, repos, deps, opts);
    // insertCommits est quand même appelé (upsert), section recomposée
    expect(deps.insertCommits).toHaveBeenCalled();
    expect(deps.upsertSection).toHaveBeenCalled();
    expect(result.sectionUpdated).toBe(true);
  });

  it("propage l'erreur si fetchCommits échoue", async () => {
    const deps = makeDeps({
      fetchCommits: vi.fn().mockRejectedValue(new Error("Token GitHub invalide ou expiré.")),
    });

    await expect(importDailyCommits({} as DbClient, week, repos, deps, opts)).rejects.toThrow(
      "Token GitHub invalide",
    );
  });
});
