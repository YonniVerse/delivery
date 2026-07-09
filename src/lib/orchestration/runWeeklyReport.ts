/**
 * Orchestration — génération du rapport hebdomadaire.
 * Pipeline : notes → IA → Google Doc (Drive) → brouillon Gmail (threadé) → statut draft_created.
 * Porté de `genererRapportsHebdomadaires` dans code.gs.
 * Toutes les dépendances I/O sont injectées pour testabilité.
 */
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow, NoteRow, SettingsRow, ProjectRow, ReportRow, ReportStatus } from "@/lib/supabase/types";
import type { LlmProvider } from "@/lib/llm";
import type { Report } from "@/domain/reportSchema";
import type { WeekNotes } from "@/domain/notes";
import type { ProjetContexte } from "@/domain/prompt";
import type { Block } from "@/lib/report/longReport";
import type { CreateLongReportOptions, CreateLongReportResult } from "@/lib/google/docs";
import type { GmailThread, CreateReplyDraftOptions, CreateReplyDraftResult } from "@/lib/google/gmail";
import type { GenerateReportInput } from "@/lib/report/generate";
import { rowsToWeekNotes } from "@/lib/repositories/notesRepo";
import { notesToPromptText } from "@/domain/notes";
import { buildLongReportBlocks, type LongReportMeta } from "@/lib/report/longReport";

const MIN_NOTES_LENGTH = 30;

export interface RunWeeklyReportDeps {
  listNotesForWeek: (client: DbClient, weekId: string) => Promise<NoteRow[]>;
  getSettings: (client: DbClient) => Promise<SettingsRow>;
  listActiveProjects: (client: DbClient) => Promise<ProjectRow[]>;
  generateReport: (input: GenerateReportInput) => Promise<Report>;
  upsertReport: (client: DbClient, weekId: string, patch: Partial<Omit<ReportRow, "id" | "week_id">>) => Promise<ReportRow>;
  getReportForWeek: (client: DbClient, weekId: string) => Promise<ReportRow | null>;
  createLongReport: (blocks: Block[], opts: CreateLongReportOptions) => Promise<CreateLongReportResult>;
  createReplyDraft: (court: Report["court"], driveUrl: string, thread: GmailThread, opts: CreateReplyDraftOptions) => Promise<CreateReplyDraftResult>;
  getGmailThread: (accessToken: string, threadId: string) => Promise<GmailThread>;
}

export interface RunWeeklyReportOpts {
  accessToken: string;
  llmProvider: LlmProvider;
}

export interface RunWeeklyReportResult {
  status: ReportStatus;
  skipped: boolean;
}

export async function runWeeklyReport(
  client: DbClient,
  week: WeekRow,
  deps: RunWeeklyReportDeps,
  opts: RunWeeklyReportOpts,
): Promise<RunWeeklyReportResult> {
  // 1. Vérifier si un rapport existe déjà
  const existing = await deps.getReportForWeek(client, week.id);
  if (existing?.status === "draft_created") {
    return { status: "draft_created", skipped: true };
  }

  // 2. Charger les notes
  const noteRows = await deps.listNotesForWeek(client, week.id);
  const notes: WeekNotes = rowsToWeekNotes(noteRows);
  const notesText = notesToPromptText(notes);

  if (notesText.length < MIN_NOTES_LENGTH) {
    throw new Error(
      `Les notes de la semaine sont trop courtes (${notesText.length} caractères, minimum ${MIN_NOTES_LENGTH}). Avez-vous bien renseigné vos notes ?`,
    );
  }

  // 3. Charger settings + projets
  const settings = await deps.getSettings(client);
  const projets = await deps.listActiveProjects(client);
  const projetContextes: ProjetContexte[] = projets.map((p) => ({
    nom: p.nom,
    role: p.role,
    description: p.description,
  }));

  // 4. Générer le rapport via IA
  const report = await deps.generateReport({
    notes,
    projets: projetContextes,
    nomPrenom: settings.nom_prenom,
    provider: opts.llmProvider,
  });

  // 5. Persister le JSON généré
  await deps.upsertReport(client, week.id, {
    long_json: report.long,
    short_json: report.court,
    status: "generated",
    generated_at: new Date().toISOString(),
  });

  // 6. Créer le Google Doc long
  const meta: LongReportMeta = {
    semaine: week.label_fr,
    nomPrenom: settings.nom_prenom,
    nomProjet: projets[0]?.nom ?? "Projet",
    dateRedaction: new Date(),
  };
  const blocks = buildLongReportBlocks(report.long, meta);
  const docResult = await deps.createLongReport(blocks, {
    accessToken: opts.accessToken,
    driveFolderId: settings.drive_folder_id ?? undefined,
    title: `Rapport — Semaine du ${week.label_fr}`,
  });

  // 7. Persister l'URL Drive
  await deps.upsertReport(client, week.id, { drive_url: docResult.url });

  // 8. Créer le brouillon Gmail threadé
  const thread = await deps.getGmailThread(opts.accessToken, settings.gmail_thread_id!);
  const draftResult = await deps.createReplyDraft(report.court, docResult.url, thread, {
    accessToken: opts.accessToken,
    me: settings.destinataires, // simplifié : mono-utilisateur
    to: settings.destinataires,
    cc: settings.cc || undefined,
    nomPrenom: settings.nom_prenom,
  });

  // 9. Persister le draft et marquer draft_created
  await deps.upsertReport(client, week.id, {
    gmail_draft_id: draftResult.draftId,
    status: "draft_created",
  });

  return { status: "draft_created", skipped: false };
}
