import { describe, it, expect } from "vitest";
import { listActiveProjects } from "./projectsRepo";
import { createFakeSupabase } from "@/test/fakeSupabase";

describe("listActiveProjects", () => {
  it("retourne les projets actifs", async () => {
    const projets = [
      { id: "p1", nom: "Delivery", role: "dev", description: "PWA rapports", active: true, created_at: "" },
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
