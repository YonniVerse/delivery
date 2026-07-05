/** Provider Google Gemini (API Generative Language). Défaut du projet (free tier). */
import type { LlmProvider, ProviderOptions } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function createGeminiProvider(opts: ProviderOptions): LlmProvider {
  const model = opts.model ?? DEFAULT_MODEL;

  return {
    async generate(prompt: string): Promise<string> {
      const url = `${BASE_URL}/${model}:generateContent?key=${opts.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Erreur Gemini (${res.status}) : ${await res.text()}`);
      }

      const data = (await res.json()) as GeminiResponse;
      const texte = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof texte !== "string") {
        throw new Error("Réponse Gemini inattendue (texte manquant).");
      }
      return texte.trim();
    },
  };
}
