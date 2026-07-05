import { describe, it, expect } from "vitest";
import { createLlmProvider } from "./index";

describe("createLlmProvider", () => {
  it("crée un provider Gemini", () => {
    const p = createLlmProvider({ provider: "gemini", apiKey: "k" });
    expect(typeof p.generate).toBe("function");
  });

  it("crée un provider Groq", () => {
    const p = createLlmProvider({ provider: "groq", apiKey: "k" });
    expect(typeof p.generate).toBe("function");
  });

  it("rejette un provider inconnu", () => {
    // @ts-expect-error provider invalide volontaire
    expect(() => createLlmProvider({ provider: "openai", apiKey: "k" })).toThrow();
  });
});
