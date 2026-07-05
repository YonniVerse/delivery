/** Fabrique de provider IA à partir de la configuration. */
import type { LlmConfig, LlmProvider } from "./types";
import { createGeminiProvider } from "./gemini";
import { createGroqProvider } from "./groq";

export type { LlmProvider, LlmConfig, LlmProviderName } from "./types";

export function createLlmProvider(config: LlmConfig): LlmProvider {
  switch (config.provider) {
    case "gemini":
      return createGeminiProvider(config);
    case "groq":
      return createGroqProvider(config);
    default:
      throw new Error(`Provider IA inconnu : ${config.provider as string}`);
  }
}
