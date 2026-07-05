import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCommits } from "./client";

afterEach(() => vi.restoreAllMocks());

function mockFetch(payload: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const params = {
  repo: "Clarco-Mada-digital/Projet_Salon",
  since: new Date("2026-07-06T00:00:00.000Z"),
  until: new Date("2026-07-06T23:59:59.000Z"),
  author: "yonni-coder",
  token: "gh_token",
};

const apiCommit = (sha: string, message: string, date: string) => ({
  sha,
  commit: { message, author: { date } },
});

describe("fetchCommits", () => {
  it("mappe les commits (sha court, message trimé, date)", async () => {
    mockFetch([
      apiCommit("abcdef1234567890", "  Ajoute réservation\n\ndétail  ", "2026-07-06T14:30:00Z"),
    ]);
    const commits = await fetchCommits(params);
    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe("abcdef1");
    expect(commits[0].message).toBe("Ajoute réservation\n\ndétail");
    expect(commits[0].date).toBeInstanceOf(Date);
  });

  it("appelle l'API GitHub avec le bon repo, auteur, plage et autorisation", async () => {
    const fn = mockFetch([]);
    await fetchCommits(params);
    const [url, init] = fn.mock.calls[0];
    const u = String(url);
    expect(u).toContain("api.github.com/repos/Clarco-Mada-digital/Projet_Salon/commits");
    expect(u).toContain("author=yonni-coder");
    expect(u).toContain("since=2026-07-06T00%3A00%3A00.000Z");
    expect(u).toContain("until=2026-07-06T23%3A59%3A59.000Z");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer gh_token");
  });

  it("lève une erreur sur 401 (token invalide)", async () => {
    mockFetch({ message: "Bad credentials" }, 401);
    await expect(fetchCommits(params)).rejects.toThrow();
  });

  it("renvoie [] sur 404 (dépôt introuvable)", async () => {
    mockFetch({ message: "Not Found" }, 404);
    await expect(fetchCommits(params)).resolves.toEqual([]);
  });

  it("renvoie [] sur une autre erreur (500)", async () => {
    mockFetch({}, 500);
    await expect(fetchCommits(params)).resolves.toEqual([]);
  });
});
