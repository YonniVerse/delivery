import { describe, it, expect } from "vitest";
import { loadEnv } from "./env";

/** Jeu d'environnement minimal valide (provider gemini par défaut). */
function baseSource(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
    GOOGLE_CLIENT_ID: "gid",
    GOOGLE_CLIENT_SECRET: "gsecret",
    DRIVE_FOLDER_ID: "folder123",
    REPORT_EMAIL_TO: "dest@example.com",
    REPORT_EMAIL_CC: "cc@example.com",
    REPORT_THREAD_SUBJECT: "Rapport de stage",
    GITHUB_TOKEN: "ghp_x",
    GITHUB_USERNAME: "yonni",
    LLM_PROVIDER: "gemini",
    GEMINI_API_KEY: "gemini-key",
    CRON_SECRET: "cron-secret",
    APP_TIMEZONE: "Indian/Antananarivo",
  };
}

describe("loadEnv", () => {
  it("parse une configuration valide et renvoie un objet typé", () => {
    const env = loadEnv(baseSource());
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
    expect(env.LLM_PROVIDER).toBe("gemini");
    expect(env.GEMINI_API_KEY).toBe("gemini-key");
    expect(env.APP_TIMEZONE).toBe("Indian/Antananarivo");
  });

  it("applique les valeurs par défaut (LLM_PROVIDER, APP_TIMEZONE, CC optionnel)", () => {
    const src = baseSource();
    delete src.LLM_PROVIDER;
    delete src.APP_TIMEZONE;
    delete src.REPORT_EMAIL_CC;
    const env = loadEnv(src);
    expect(env.LLM_PROVIDER).toBe("gemini");
    expect(env.APP_TIMEZONE).toBe("Indian/Antananarivo");
    expect(env.REPORT_EMAIL_CC).toBeUndefined();
  });

  it("échoue avec un message clair si un secret requis manque", () => {
    const src = baseSource();
    delete src.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => loadEnv(src)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejette une URL Supabase invalide", () => {
    const src = baseSource();
    src.NEXT_PUBLIC_SUPABASE_URL = "pas-une-url";
    expect(() => loadEnv(src)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("exige la clé du provider sélectionné (groq → GROQ_API_KEY)", () => {
    const src = baseSource();
    src.LLM_PROVIDER = "groq";
    delete src.GEMINI_API_KEY;
    expect(() => loadEnv(src)).toThrow(/GROQ_API_KEY/);
  });

  it("accepte groq lorsque GROQ_API_KEY est présent", () => {
    const src = baseSource();
    src.LLM_PROVIDER = "groq";
    delete src.GEMINI_API_KEY;
    src.GROQ_API_KEY = "gsk_x";
    const env = loadEnv(src);
    expect(env.LLM_PROVIDER).toBe("groq");
    expect(env.GROQ_API_KEY).toBe("gsk_x");
  });

  it("rejette un LLM_PROVIDER inconnu", () => {
    const src = baseSource();
    src.LLM_PROVIDER = "openai";
    expect(() => loadEnv(src)).toThrow(/LLM_PROVIDER/);
  });
});
