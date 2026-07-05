import { describe, it, expect, vi, afterEach } from "vitest";
import { createGeminiProvider } from "./gemini";

afterEach(() => vi.restoreAllMocks());

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("GeminiProvider", () => {
  it("renvoie le texte généré par l'API", async () => {
    mockFetch({ candidates: [{ content: { parts: [{ text: "RESULT" }] } }] });
    const provider = createGeminiProvider({ apiKey: "k" });
    await expect(provider.generate("mon prompt")).resolves.toBe("RESULT");
  });

  it("appelle le bon modèle et transmet le prompt", async () => {
    const fn = mockFetch({
      candidates: [{ content: { parts: [{ text: "x" }] } }],
    });
    const provider = createGeminiProvider({ apiKey: "secret", model: "gemini-2.5-flash" });
    await provider.generate("PROMPT_ICI");

    const [url, init] = fn.mock.calls[0];
    expect(String(url)).toContain("gemini-2.5-flash");
    expect(String(init?.body)).toContain("PROMPT_ICI");
  });

  it("lève une erreur si la réponse HTTP est en échec", async () => {
    mockFetch({ error: { message: "quota" } }, false);
    const provider = createGeminiProvider({ apiKey: "k" });
    await expect(provider.generate("p")).rejects.toThrow();
  });
});
