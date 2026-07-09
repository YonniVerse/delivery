import { describe, it, expect } from "vitest";
import { listActiveRepos } from "./reposRepo";
import { createFakeSupabase } from "@/test/fakeSupabase";

describe("listActiveRepos", () => {
  it("retourne les repos actifs", async () => {
    const repos = [
      { id: "r1", full_name: "org/repoA", active: true, created_at: "" },
      { id: "r2", full_name: "org/repoB", active: true, created_at: "" },
    ];
    const { client } = createFakeSupabase({ repos: { data: repos, error: null } });
    const result = await listActiveRepos(client);
    expect(result).toEqual(repos);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: { message: "boom" } } });
    await expect(listActiveRepos(client)).rejects.toThrow("boom");
  });
});
