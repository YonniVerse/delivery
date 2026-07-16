import { describe, it, expect } from "vitest";
import { listActiveRepos, listRepos, createRepo, updateRepo, deleteRepo } from "./reposRepo";
import { createFakeSupabase, findCall } from "@/test/fakeSupabase";

const depot = { id: "r1", full_name: "yonni-coder/delivery", active: true, created_at: "" };

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

describe("listRepos", () => {
  it("retourne tous les dépôts, actifs ou non", async () => {
    const depots = [depot, { ...depot, id: "r2", full_name: "org/vieux", active: false }];
    const { client, calls } = createFakeSupabase({ repos: { data: depots, error: null } });

    const result = await listRepos(client);

    expect(result).toEqual(depots);
    // Contrairement à listActiveRepos, aucun filtre sur `active`.
    expect(findCall(calls, "eq")).toBeUndefined();
  });

  it("retourne une liste vide quand il n'y a aucun dépôt", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: null } });
    await expect(listRepos(client)).resolves.toEqual([]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: { message: "boum" } } });
    await expect(listRepos(client)).rejects.toThrow("listRepos: boum");
  });
});

describe("createRepo", () => {
  it("insère le dépôt actif et renvoie la ligne créée", async () => {
    const { client, calls } = createFakeSupabase({ repos: { data: depot, error: null } });

    const result = await createRepo(client, "yonni-coder/delivery");

    expect(result).toEqual(depot);
    expect(findCall(calls, "insert")?.args[0]).toEqual({
      full_name: "yonni-coder/delivery",
      active: true,
    });
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: { message: "boum" } } });
    await expect(createRepo(client, "a/b")).rejects.toThrow("createRepo: boum");
  });
});

describe("updateRepo", () => {
  it("applique le patch au dépôt ciblé", async () => {
    const modifie = { ...depot, active: false };
    const { client, calls } = createFakeSupabase({ repos: { data: modifie, error: null } });

    const result = await updateRepo(client, "r1", { active: false });

    expect(result).toEqual(modifie);
    expect(findCall(calls, "update")?.args[0]).toEqual({ active: false });
    expect(findCall(calls, "eq")?.args).toEqual(["id", "r1"]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: { message: "boum" } } });
    await expect(updateRepo(client, "r1", { active: false })).rejects.toThrow("updateRepo: boum");
  });
});

describe("deleteRepo", () => {
  it("supprime le dépôt ciblé", async () => {
    const { client, calls } = createFakeSupabase({ repos: { data: null, error: null } });

    await deleteRepo(client, "r1");

    expect(findCall(calls, "delete")).toBeDefined();
    expect(findCall(calls, "eq")?.args).toEqual(["id", "r1"]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ repos: { data: null, error: { message: "boum" } } });
    await expect(deleteRepo(client, "r1")).rejects.toThrow("deleteRepo: boum");
  });
});
