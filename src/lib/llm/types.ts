/** Abstraction d'un fournisseur d'IA générative. */
export interface LlmProvider {
  /** Envoie un prompt et renvoie le texte brut de la réponse. */
  generate(prompt: string): Promise<string>;
}

export type LlmProviderName = "gemini" | "groq";

export interface LlmConfig {
  provider: LlmProviderName;
  apiKey: string;
  /** Modèle spécifique ; défaut propre à chaque provider. */
  model?: string;
}

export interface ProviderOptions {
  apiKey: string;
  model?: string;
}
