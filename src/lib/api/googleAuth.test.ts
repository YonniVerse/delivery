import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { resolveAccessToken } from "./googleAuth";
import type { OAuthTokenRow } from "@/lib/supabase/types";

const MAINTENANT = new Date("2026-07-17T10:00:00.000Z").getTime();

// `refreshAccessToken` calcule l'expiry depuis `Date.now()` (non injectable) :
// on fige l'horloge pour que l'expiry persistée soit vérifiable.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MAINTENANT);
});
afterEach(() => {
  vi.useRealTimers();
});

function token(overrides: Partial<OAuthTokenRow> = {}): OAuthTokenRow {
  return {
    provider: "google",
    access_token: "at-courant",
    refresh_token: "rt-456",
    expiry: new Date(MAINTENANT + 30 * 60_000).toISOString(), // encore valide 30 min
    scopes: null,
    updated_at: "2026-07-17T09:00:00.000Z",
    ...overrides,
  };
}

const opts = {
  clientId: "cid",
  clientSecret: "csecret",
  now: MAINTENANT,
};

/** fetch mocké renvoyant une réponse de rafraîchissement OAuth Google. */
function fetchRefresh() {
  return vi.fn(async () => Response.json({ access_token: "at-rafraichi", expires_in: 3600 }));
}

describe("resolveAccessToken", () => {
  it("réutilise le jeton stocké quand il est encore valide, sans écriture", async () => {
    const { client, calls } = createFakeSupabase({
      oauth_tokens: { data: token(), error: null },
    });
    const fetchImpl = fetchRefresh();

    const at = await resolveAccessToken(client, { ...opts, fetchImpl });

    expect(at).toBe("at-courant");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(calls.some((c) => c.method === "upsert")).toBe(false);
  });

  it("rafraîchit le jeton expiré et persiste le nouveau", async () => {
    const { client, calls } = createFakeSupabase({
      oauth_tokens: [
        { data: token({ expiry: new Date(MAINTENANT - 60_000).toISOString() }), error: null },
        { data: token({ access_token: "at-rafraichi" }), error: null },
      ],
    });
    const fetchImpl = fetchRefresh();

    const at = await resolveAccessToken(client, { ...opts, fetchImpl });

    expect(at).toBe("at-rafraichi");
    expect(fetchImpl).toHaveBeenCalledOnce();

    const up = calls.find((c) => c.method === "upsert");
    expect(up?.args[0]).toMatchObject({ provider: "google", access_token: "at-rafraichi" });
    // l'expiry persistée doit être celle calculée au rafraîchissement, pas l'ancienne
    expect((up?.args[0] as OAuthTokenRow).expiry).toBe(new Date(MAINTENANT + 3600_000).toISOString());
  });

  it("échoue avec un message actionnable quand aucun jeton n'est stocké", async () => {
    const { client } = createFakeSupabase({ oauth_tokens: { data: null, error: null } });

    await expect(resolveAccessToken(client, opts)).rejects.toThrow(/connect/i);
  });

  it("propage l'échec du rafraîchissement OAuth", async () => {
    const { client } = createFakeSupabase({
      oauth_tokens: { data: token({ expiry: new Date(MAINTENANT - 60_000).toISOString() }), error: null },
    });
    const fetchImpl = vi.fn(async () => new Response("invalid_grant", { status: 400 }));

    await expect(resolveAccessToken(client, { ...opts, fetchImpl })).rejects.toThrow(/OAuth/i);
  });
});
