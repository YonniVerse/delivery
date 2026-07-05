import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { getSettings, updateSettings } from "./settingsRepo";
import type { SettingsRow } from "@/lib/supabase/types";

function row(overrides: Partial<SettingsRow> = {}): SettingsRow {
  return {
    id: true,
    nom_prenom: "Yonni",
    destinataires: "dest@x.com",
    cc: "",
    sujet_fil: "Rapport de stage",
    timezone: "Indian/Antananarivo",
    llm_provider: "gemini",
    drive_folder_id: null,
    gmail_thread_id: null,
    updated_at: "2026-07-06T00:00:00Z",
    ...overrides,
  };
}

describe("settingsRepo", () => {
  it("getSettings lit le singleton", async () => {
    const { client, calls } = createFakeSupabase({
      settings: { data: row(), error: null },
    });
    const s = await getSettings(client);
    expect(s.nom_prenom).toBe("Yonni");
    expect(calls.some((c) => c.table === "settings" && c.method === "select")).toBe(true);
    expect(calls.some((c) => c.method === "single" || c.method === "maybeSingle")).toBe(true);
  });

  it("getSettings lève si erreur Postgres", async () => {
    const { client } = createFakeSupabase({
      settings: { data: null, error: { message: "boom" } },
    });
    await expect(getSettings(client)).rejects.toThrow(/boom/);
  });

  it("updateSettings applique un patch et renvoie la ligne", async () => {
    const { client, calls } = createFakeSupabase({
      settings: { data: row({ nom_prenom: "Zed" }), error: null },
    });
    const s = await updateSettings(client, { nom_prenom: "Zed" });
    expect(s.nom_prenom).toBe("Zed");
    const upd = calls.find((c) => c.method === "update");
    expect(upd?.args[0]).toMatchObject({ nom_prenom: "Zed" });
  });
});
