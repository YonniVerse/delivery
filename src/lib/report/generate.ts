/**
 * Pipeline de génération : notes → prompt → IA → rapport validé.
 * Le provider IA est injecté (testable sans réseau).
 */
import { getLibelleSemaine } from "@/domain/dates";
import { notesToPromptText, type WeekNotes } from "@/domain/notes";
import { buildReportPrompt, type ProjetContexte } from "@/domain/prompt";
import { parseReportResponse, type Report } from "@/domain/reportSchema";
import type { LlmProvider } from "@/lib/llm";

export interface GenerateReportInput {
  notes: WeekNotes;
  projets: ProjetContexte[];
  nomPrenom: string;
  provider: LlmProvider;
  /** Date de référence pour le libellé de semaine (défaut : maintenant). */
  ref?: Date;
}

export async function generateReport(input: GenerateReportInput): Promise<Report> {
  const { notes, projets, nomPrenom, provider, ref } = input;

  const prompt = buildReportPrompt({
    nomPrenom,
    semaine: getLibelleSemaine(ref),
    projets,
    notesText: notesToPromptText(notes),
  });

  const brut = await provider.generate(prompt);
  return parseReportResponse(brut);
}
