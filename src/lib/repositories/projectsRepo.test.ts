import { describe, it, expect } from "vitest";
import {
  listActiveProjects,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "./projectsRepo";
import { createFakeSupabase, findCall } from "@/test/fakeSupabase";

const projet = {
  id: "p1",
  nom: "Delivery",
  role: "dev",
  description: "PWA rapports",
  active: true,
  created_at: "",
};

describe("listActiveProjects", () => {
  it("retourne les projets actifs", async () => {
    const projets = [
      projet,
      { id: "p2", nom: "Lexxy", role: "testeur", description: "App juridique", active: true, created_at: "" },
    ];
    const { client } = createFakeSupabase({ projects: { data: projets, error: null } });
    const result = await listActiveProjects(client);
    expect(result).toEqual(projets);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: { message: "fail" } } });
    await expect(listActiveProjects(client)).rejects.toThrow("fail");
  });
});

describe("listProjects", () => {
  it("retourne tous les projets, actifs ou non", async () => {
    const projets = [projet, { ...projet, id: "p2", nom: "Ancien", active: false }];
    const { client, calls } = createFakeSupabase({ projects: { data: projets, error: null } });

    const result = await listProjects(client);

    expect(result).toEqual(projets);
    // Contrairement à listActiveProjects, aucun filtre sur `active`.
    expect(findCall(calls, "eq")).toBeUndefined();
  });

  it("retourne une liste vide quand il n'y a aucun projet", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: null } });
    await expect(listProjects(client)).resolves.toEqual([]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: { message: "boum" } } });
    await expect(listProjects(client)).rejects.toThrow("listProjects: boum");
  });
});

describe("createProject", () => {
  it("insère le projet et renvoie la ligne créée", async () => {
    const { client, calls } = createFakeSupabase({ projects: { data: projet, error: null } });

    const result = await createProject(client, {
      nom: "Delivery",
      role: "dev",
      description: "PWA rapports",
    });

    expect(result).toEqual(projet);
    expect(findCall(calls, "insert")?.args[0]).toEqual({
      nom: "Delivery",
      role: "dev",
      description: "PWA rapports",
      active: true,
    });
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: { message: "boum" } } });
    await expect(
      createProject(client, { nom: "X", role: "dev", description: "" }),
    ).rejects.toThrow("createProject: boum");
  });
});

describe("updateProject", () => {
  it("applique le patch au projet ciblé et renvoie la ligne à jour", async () => {
    const modifie = { ...projet, role: "testeur" };
    const { client, calls } = createFakeSupabase({ projects: { data: modifie, error: null } });

    const result = await updateProject(client, "p1", { role: "testeur" });

    expect(result).toEqual(modifie);
    expect(findCall(calls, "update")?.args[0]).toEqual({ role: "testeur" });
    expect(findCall(calls, "eq")?.args).toEqual(["id", "p1"]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: { message: "boum" } } });
    await expect(updateProject(client, "p1", { nom: "X" })).rejects.toThrow("updateProject: boum");
  });
});

describe("deleteProject", () => {
  it("supprime le projet ciblé", async () => {
    const { client, calls } = createFakeSupabase({ projects: { data: null, error: null } });

    await deleteProject(client, "p1");

    expect(findCall(calls, "delete")).toBeDefined();
    expect(findCall(calls, "eq")?.args).toEqual(["id", "p1"]);
  });

  it("propage l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({ projects: { data: null, error: { message: "boum" } } });
    await expect(deleteProject(client, "p1")).rejects.toThrow("deleteProject: boum");
  });
});
