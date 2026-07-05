import { describe, it, expect, vi } from "vitest";
import { refreshAccessToken, getValidAccessToken } from "./oauth";

function okFetch(body: unknown) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
}

describe("refreshAccessToken", () => {
  it("échange le refresh token contre un access token + expiry", async () => {
    const fetchImpl = okFetch({ access_token: "at-new", expires_in: 3600 });
    const before = Date.now();
    const res = await refreshAccessToken({
      refreshToken: "rt",
      clientId: "cid",
      clientSecret: "sec",
      fetchImpl,
    });
    expect(res.accessToken).toBe("at-new");
    expect(new Date(res.expiry).getTime()).toBeGreaterThan(before);
    // corps x-www-form-urlencoded avec grant_type=refresh_token
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("oauth2.googleapis.com/token");
    expect(String(init?.body)).toContain("grant_type=refresh_token");
  });

  it("lève une erreur explicite sur invalid_grant", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
    );
    await expect(
      refreshAccessToken({ refreshToken: "bad", clientId: "c", clientSecret: "s", fetchImpl }),
    ).rejects.toThrow(/invalid_grant|400/);
  });
});

describe("getValidAccessToken", () => {
  it("réutilise le token si non expiré (pas d'appel réseau)", async () => {
    const fetchImpl = vi.fn();
    const future = new Date(Date.now() + 10 * 60_000).toISOString();
    const res = await getValidAccessToken(
      { access_token: "at", refresh_token: "rt", expiry: future },
      { clientId: "c", clientSecret: "s", fetchImpl },
    );
    expect(res.accessToken).toBe("at");
    expect(res.refreshed).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rafraîchit si expiré", async () => {
    const fetchImpl = okFetch({ access_token: "at2", expires_in: 3600 });
    const past = new Date(Date.now() - 60_000).toISOString();
    const res = await getValidAccessToken(
      { access_token: "old", refresh_token: "rt", expiry: past },
      { clientId: "c", clientSecret: "s", fetchImpl },
    );
    expect(res.accessToken).toBe("at2");
    expect(res.refreshed).toBe(true);
  });
});
