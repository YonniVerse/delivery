import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { getOAuthToken, saveOAuthToken } from "./oauthTokensRepo";
import type { OAuthTokenRow } from "@/lib/supabase/types";

function token(overrides: Partial<OAuthTokenRow> = {}): OAuthTokenRow {
  return {
    provider: "google",
    access_token: "at-123",
    refresh_token: "rt-456",
    expiry: "2026-07-17T10:00:00.000Z",
    scopes: "gmail.compose drive.file",
    updated_at: "2026-07-17T09:00:00.000Z",
    ...overrides,
  };
}

describe("oauthTokensRepo", () => {
  it("getOAuthToken renvoie le jeton du provider demandé", async () => {
    const { client, calls } = createFakeSupabase({
      oauth_tokens: { data: token(), error: null },
    });
    const t = await getOAuthToken(client);
    expect(t?.access_token).toBe("at-123");
    expect(calls.find((c) => c.method === "eq")?.args).toEqual(["provider", "google"]);
  });

  it("getOAuthToken renvoie null quand aucun jeton n'est stocké", async () => {
    const { client } = createFakeSupabase({ oauth_tokens: { data: null, error: null } });
    expect(await getOAuthToken(client)).toBeNull();
  });

  it("getOAuthToken remonte l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({
      oauth_tokens: { data: null, error: { message: "boom" } },
    });
    await expect(getOAuthToken(client)).rejects.toThrow(/getOAuthToken: boom/);
  });

  it("saveOAuthToken upsert sur conflit provider et horodate", async () => {
    const { client, calls } = createFakeSupabase({
      oauth_tokens: { data: token({ access_token: "at-neuf" }), error: null },
    });
    const t = await saveOAuthToken(client, "google", {
      access_token: "at-neuf",
      expiry: "2026-07-17T11:00:00.000Z",
    });
    expect(t.access_token).toBe("at-neuf");

    const up = calls.find((c) => c.method === "upsert");
    expect(up?.args[0]).toMatchObject({ provider: "google", access_token: "at-neuf" });
    expect(up?.args[1]).toMatchObject({ onConflict: "provider" });
    // updated_at est posé par le repo, pas par l'appelant
    expect((up?.args[0] as OAuthTokenRow).updated_at).toEqual(expect.any(String));
  });

  it("saveOAuthToken remonte l'erreur Supabase", async () => {
    const { client } = createFakeSupabase({
      oauth_tokens: { data: null, error: { message: "refus" } },
    });
    await expect(saveOAuthToken(client, "google", { access_token: "x" })).rejects.toThrow(
      /saveOAuthToken: refus/,
    );
  });
});
