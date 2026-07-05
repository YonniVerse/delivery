import { describe, it, expect, vi, afterEach } from "vitest";
import { createGroqProvider } from "./groq";

afterEach(() => vi.restoreAllMocks());

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("GroqProvider", () => {
  it("renvoie le contenu du premier choix", async () => {
    mockFetch({ choices: [{ message: { content: "REPONSE" } }] });
    const provider = createGroqProvider({ apiKey: "k" });
    await expect(provider.generate("p")).resolves.toBe("REPONSE");
  });

  it("envoie le prompt et l'autorisation Bearer", async () => {
    const fn = mockFetch({ choices: [{ message: { content: "x" } }] });
    const provider = createGroqProvider({ apiKey: "secret" });
    await provider.generate("PROMPT_ICI");

    const [, init] = fn.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret");
    expect(String(init?.body)).toContain("PROMPT_ICI");
  });

  it("lève une erreur si la réponse HTTP est en échec", async () => {
    mockFetch({ error: { message: "invalid key" } }, false);
    const provider = createGroqProvider({ apiKey: "k" });
    await expect(provider.generate("p")).rejects.toThrow();
  });
});
