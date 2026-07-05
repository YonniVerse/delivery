/**
 * Lecteur d'environnement typé et validé (Zod). Server-only.
 * Unique point d'accès aux variables d'env : le reste du code lit `getEnv()`
 * plutôt que `process.env`. Champs alignés sur `.env.example`.
 */
import { z } from "zod";

const requis = z.string().min(1);

const schema = z
  .object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requis,
    SUPABASE_SERVICE_ROLE_KEY: requis,

    // Google OAuth
    GOOGLE_CLIENT_ID: requis,
    GOOGLE_CLIENT_SECRET: requis,
    DRIVE_FOLDER_ID: requis,

    // Cible / config rapport
    REPORT_EMAIL_TO: requis,
    REPORT_EMAIL_CC: z.string().optional(),
    REPORT_THREAD_SUBJECT: requis,

    // GitHub
    GITHUB_TOKEN: requis,
    GITHUB_USERNAME: requis,

    // IA
    LLM_PROVIDER: z.enum(["gemini", "groq"]).default("gemini"),
    GEMINI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),

    // Cron + divers
    CRON_SECRET: requis,
    APP_TIMEZONE: z.string().default("Indian/Antananarivo"),
  })
  .superRefine((val, ctx) => {
    // La clé du provider sélectionné doit être présente.
    if (val.LLM_PROVIDER === "gemini" && !val.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY requis quand LLM_PROVIDER=gemini",
      });
    }
    if (val.LLM_PROVIDER === "groq" && !val.GROQ_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GROQ_API_KEY"],
        message: "GROQ_API_KEY requis quand LLM_PROVIDER=groq",
      });
    }
  });

export type Env = z.infer<typeof schema>;

/**
 * Valide une source d'environnement et renvoie la config typée.
 * Lève une erreur listant les variables fautives (nom + raison).
 */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const res = schema.safeParse(source);
  if (!res.success) {
    const details = res.error.issues
      .map((i) => `${i.path.join(".") || "(racine)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Configuration d'environnement invalide :\n${details}`);
  }
  return res.data;
}

let cache: Env | undefined;

/** Config d'env mémoïsée (validée au premier accès). */
export function getEnv(): Env {
  if (!cache) cache = loadEnv(process.env);
  return cache;
}
