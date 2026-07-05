import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { insertCommits, listCommitsForWeek } from "./commitsRepo";
import type { CommitRow } from "@/lib/supabase/types";

function commitRow(sha: string): CommitRow {
  return {
    id: `c-${sha}`,
    week_id: "w1",
    repo: "owner/repo",
    sha,
    message: "msg",
    committed_at: "2026-07-06T10:00:00Z",
    created_at: "2026-07-06T10:00:00Z",
  };
}

describe("commitsRepo", () => {
  it("insertCommits fait un upsert idempotent (ignoreDuplicates, onConflict week_id,repo,sha)", async () => {
    const { client, calls } = createFakeSupabase({
      commits: { data: [commitRow("aaa")], error: null },
    });
    const res = await insertCommits(client, [
      { week_id: "w1", repo: "owner/repo", sha: "aaa", message: "msg", committed_at: "2026-07-06T10:00:00Z" },
    ]);
    expect(res).toHaveLength(1);
    const up = calls.find((c) => c.method === "upsert");
    expect(up?.args[1]).toMatchObject({ onConflict: "week_id,repo,sha", ignoreDuplicates: true });
  });

  it("insertCommits ne fait rien si liste vide (pas d'appel réseau)", async () => {
    const { client, calls } = createFakeSupabase({});
    const res = await insertCommits(client, []);
    expect(res).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("listCommitsForWeek renvoie les commits de la semaine", async () => {
    const { client, calls } = createFakeSupabase({
      commits: { data: [commitRow("aaa"), commitRow("bbb")], error: null },
    });
    const res = await listCommitsForWeek(client, "w1");
    expect(res).toHaveLength(2);
    expect(calls.some((c) => c.method === "eq" && c.args[0] === "week_id")).toBe(true);
  });
});
