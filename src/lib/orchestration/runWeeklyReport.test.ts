import { describe, it, expect, vi } from "vitest";
import { runWeeklyReport } from "./runWeeklyReport";
import type { WeekRow, NoteRow, SettingsRow, ProjectRow, ReportRow } from "@/lib/supabase/types";
import type { DbClient } from "@/lib/supabase/client";
import type { Report } from "@/domain/reportSchema";
import type { GmailThread } from "@/lib/google/gmail";

const week: WeekRow = {
  id: "w1",
  label_fr: "7 juillet 2026 au 11 juillet 2026",
  start_date: "2026-07-07",
  end_date: "2026-07-13",
  status: "active",
  created_at: "",
};

const noteRows: NoteRow[] = [
  { id: "n1", week_id: "w1", section: "tachesRealisees", content: "Développé le module X, refacto du service Y", updated_at: "" },
  { id: "n2", week_id: "w1", section: "pointsImportants", content: "Livraison du sitemap", updated_at: "" },
];

const settings: SettingsRow = {
  id: true,
  nom_prenom: "TINOGNY Yonni",
  destinataires: "dir@mada.net",
  cc: "",
  sujet_fil: "Rapport de stage",
  timezone: "Europe/Paris",
  llm_provider: "gemini",
  drive_folder_id: "folder-id",
  gmail_thread_id: "thread-99",
  updated_at: "",
};

const projets: ProjectRow[] = [
  { id: "p1", nom: "Delivery", role: "dev", description: "PWA rapports", active: true, created_at: "" },
];

const fakeReport: Report = {
  long: {
    objet: "Rapport de la semaine",
    activites_realisees: [{ categorie: "Dev", items: ["Module X"] }],
    livrables: ["Sitemap"],
    tests_effectues: [],
    difficultes: [],
    planification: ["Finir Y"],
    conclusion: "Bonne semaine.",
  },
  court: {
    intro: "Voici le résumé.",
    points_cles: [{ categorie: "Dev", description: "Module X livré" }],
    livrables: ["Sitemap"],
    objectifs: ["Finir Y"],
  },
};

const fakeThread: GmailThread = {
  threadId: "thread-99",
  firstSubject: "Rapport de stage",
  messages: [
    { from: "dir@mada.net", messageId: "<m1@mail>" },
  ],
};

function makeDeps(overrides: Partial<Parameters<typeof runWeeklyReport>[2]> = {}) {
  return {
    listNotesForWeek: vi.fn(async () => noteRows),
    getSettings: vi.fn(async () => settings),
    listActiveProjects: vi.fn(async () => projets),
    generateReport: vi.fn(async () => fakeReport),
    upsertReport: vi.fn(async () => ({}) as ReportRow),
    getReportForWeek: vi.fn(async () => null as ReportRow | null),
    createLongReport: vi.fn(async () => ({ documentId: "doc-1", url: "https://docs.google.com/document/d/doc-1/edit" })),
    createReplyDraft: vi.fn(async () => ({ draftId: "draft-1", threadId: "thread-99" })),
    getGmailThread: vi.fn(async () => fakeThread),
    ...overrides,
  };
}

const llmProvider = { generate: vi.fn(async () => "") };

describe("runWeeklyReport", () => {
  it("pipeline complet : notes → IA → Doc → Draft → draft_created", async () => {
    const deps = makeDeps();
    const result = await runWeeklyReport({} as DbClient, week, deps, {
      accessToken: "at",
      llmProvider,
    });

    expect(result.status).toBe("draft_created");
    expect(result.skipped).toBe(false);

    // generateReport appelé avec les bonnes notes & projets
    expect(deps.generateReport).toHaveBeenCalledTimes(1);
    const genInput = vi.mocked(deps.generateReport).mock.calls[0][0];
    expect(genInput.nomPrenom).toBe("TINOGNY Yonni");
    expect(genInput.projets).toHaveLength(1);

    // upsertReport appelé 3 fois (generated, drive_url, draft_created)
    expect(deps.upsertReport).toHaveBeenCalledTimes(3);

    // createLongReport appelé
    expect(deps.createLongReport).toHaveBeenCalledTimes(1);

    // createReplyDraft appelé avec le bon driveUrl
    expect(deps.createReplyDraft).toHaveBeenCalledTimes(1);
    const draftArgs = vi.mocked(deps.createReplyDraft).mock.calls[0];
    expect(draftArgs[1]).toContain("doc-1/edit"); // driveUrl
  });

  it("skip si rapport déjà draft_created", async () => {
    const deps = makeDeps({
      getReportForWeek: vi.fn(async () => ({ status: "draft_created" }) as ReportRow),
    });
    const result = await runWeeklyReport({} as DbClient, week, deps, {
      accessToken: "at",
      llmProvider,
    });

    expect(result.skipped).toBe(true);
    expect(deps.generateReport).not.toHaveBeenCalled();
  });

  it("erreur si notes trop courtes", async () => {
    const deps = makeDeps({
      listNotesForWeek: vi.fn(async () => [
        { id: "n1", week_id: "w1", section: "tachesRealisees" as const, content: "ab", updated_at: "" },
      ]),
    });
    await expect(
      runWeeklyReport({} as DbClient, week, deps, { accessToken: "at", llmProvider }),
    ).rejects.toThrow(/notes/i);
  });

  it("propage l'erreur si l'IA échoue", async () => {
    const deps = makeDeps({
      generateReport: vi.fn().mockRejectedValue(new Error("LLM timeout")),
    });
    await expect(
      runWeeklyReport({} as DbClient, week, deps, { accessToken: "at", llmProvider }),
    ).rejects.toThrow("LLM timeout");
  });
});
