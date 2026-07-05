/**
 * Types des tables Postgres — miroir de supabase/migrations/0001_init.sql.
 * Maintenu à la main (le projet n'utilise pas la génération de types Supabase CLI ici).
 */
import type { SectionKey } from "@/domain/notes";

export type WeekStatus = "active" | "archived";
export type ReportStatus = "pending" | "generated" | "draft_created" | "sent";
export type LlmProviderName = "gemini" | "groq";

export type SettingsRow = {
  id: boolean;
  nom_prenom: string;
  destinataires: string;
  cc: string;
  sujet_fil: string;
  timezone: string;
  llm_provider: LlmProviderName;
  drive_folder_id: string | null;
  gmail_thread_id: string | null;
  updated_at: string;
}

export type ProjectRow = {
  id: string;
  nom: string;
  role: string;
  description: string;
  active: boolean;
  created_at: string;
}

export type RepoRow = {
  id: string;
  full_name: string;
  active: boolean;
  created_at: string;
}

export type WeekRow = {
  id: string;
  label_fr: string;
  start_date: string;
  end_date: string;
  status: WeekStatus;
  created_at: string;
}

export type NoteRow = {
  id: string;
  week_id: string;
  section: SectionKey;
  content: string;
  updated_at: string;
}

export type CommitRow = {
  id: string;
  week_id: string;
  repo: string;
  sha: string;
  message: string;
  committed_at: string | null;
  created_at: string;
}

export type ReportRow = {
  id: string;
  week_id: string;
  long_json: unknown | null;
  short_json: unknown | null;
  drive_url: string | null;
  gmail_draft_id: string | null;
  status: ReportStatus;
  generated_at: string | null;
  sent_at: string | null;
}

export type OAuthTokenRow = {
  provider: string;
  access_token: string;
  refresh_token: string | null;
  expiry: string | null;
  scopes: string | null;
  updated_at: string;
}

/** Aide générique pour décrire une table à supabase-js (Row/Insert/Update). */
interface TableDef<Row> {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      settings: TableDef<SettingsRow>;
      projects: TableDef<ProjectRow>;
      repos: TableDef<RepoRow>;
      weeks: TableDef<WeekRow>;
      notes: TableDef<NoteRow>;
      commits: TableDef<CommitRow>;
      reports: TableDef<ReportRow>;
      oauth_tokens: TableDef<OAuthTokenRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
