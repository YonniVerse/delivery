/** Provider Groq (API compatible OpenAI). Alternative gratuite. */
import type { LlmProvider, ProviderOptions } from "./types";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices?: { message?: { content?: string } }[];
}

export function createGroqProvider(opts: ProviderOptions): LlmProvider {
  const model = opts.model ?? DEFAULT_MODEL;

  return {
    async generate(prompt: string): Promise<string> {
      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erreur Groq (${res.status}) : ${await res.text()}`);
      }

      const data = (await res.json()) as GroqResponse;
      const texte = data.choices?.[0]?.message?.content;
      if (typeof texte !== "string") {
        throw new Error("Réponse Groq inattendue (contenu manquant).");
      }
      return texte.trim();
    },
  };
}
