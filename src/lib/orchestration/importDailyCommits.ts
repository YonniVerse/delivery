/**
 * Orchestration — import quotidien des commits GitHub.
 * Pipeline : repos actifs → fetchCommits → dedupeCommits → insertCommits →
 * recompose la section notes « commits » depuis tous les commits de la semaine.
 * Porté de `recupererEtAjouterCommits` dans code.gs.
 */
import type { DbClient } from "@/lib/supabase/client";
import type { WeekRow, CommitRow, RepoRow } from "@/lib/supabase/types";
import type { Commit, FetchCommitsParams } from "@/lib/github/client";
import type { CommitInsert } from "@/lib/repositories/commitsRepo";
import type { NoteRow } from "@/lib/supabase/types";
import type { SectionKey } from "@/domain/notes";
import { dedupeCommits, formatCommitsForNotes } from "@/lib/github/importCommits";

export interface ImportDailyCommitsDeps {
  fetchCommits: (params: FetchCommitsParams) => Promise<Commit[]>;
  insertCommits: (client: DbClient, rows: CommitInsert[]) => Promise<CommitRow[]>;
  listCommitsForWeek: (client: DbClient, weekId: string) => Promise<CommitRow[]>;
  upsertSection: (client: DbClient, weekId: string, section: SectionKey, content: string) => Promise<NoteRow>;
}

export interface ImportDailyCommitsOpts {
  githubToken: string;
  githubAuthor: string;
  /** Date de référence (défaut : maintenant). */
  date?: Date;
}

export interface ImportDailyCommitsResult {
  inserted: number;
  sectionUpdated: boolean;
}

export async function importDailyCommits(
  client: DbClient,
  week: WeekRow,
  repos: RepoRow[],
  deps: ImportDailyCommitsDeps,
  opts: ImportDailyCommitsOpts,
): Promise<ImportDailyCommitsResult> {
  const now = opts.date ?? new Date();
  const debutJournee = new Date(now);
  debutJournee.setHours(0, 0, 0, 0);

  // 1. Récupérer les commits du jour pour chaque repo
  const allCommits: { repo: string; commits: Commit[] }[] = [];
  for (const repo of repos) {
    const commits = await deps.fetchCommits({
      repo: repo.full_name,
      since: debutJournee,
      until: now,
      author: opts.githubAuthor,
      token: opts.githubToken,
    });
    if (commits.length > 0) {
      allCommits.push({ repo: repo.full_name, commits: dedupeCommits(commits) });
    }
  }

  // 2. Rien de nouveau → ne pas toucher à la section notes
  const totalNew = allCommits.reduce((acc, g) => acc + g.commits.length, 0);
  if (totalNew === 0) {
    return { inserted: 0, sectionUpdated: false };
  }

  // 3. Mapper en CommitInsert et upsert idempotent
  const rows: CommitInsert[] = allCommits.flatMap((g) =>
    g.commits.map((c) => ({
      week_id: week.id,
      repo: g.repo,
      sha: c.sha,
      message: c.message,
      committed_at: c.date.toISOString(),
    })),
  );
  await deps.insertCommits(client, rows);

  // 4. Relire TOUS les commits de la semaine (pour avoir l'intégralité)
  const allWeekCommits = await deps.listCommitsForWeek(client, week.id);

  // 5. Grouper par repo et formater pour la section notes
  const groupes = groupByRepo(allWeekCommits);
  const texteSection = formatCommitsForNotes(groupes);

  // 6. Mettre à jour la section notes
  await deps.upsertSection(client, week.id, "commits", texteSection);

  return { inserted: rows.length, sectionUpdated: true };
}

/** Regroupe les commits en mémoire par repo (ordre stable). */
function groupByRepo(commits: CommitRow[]) {
  const map = new Map<string, Commit[]>();
  for (const c of commits) {
    if (!map.has(c.repo)) map.set(c.repo, []);
    map.get(c.repo)!.push({
      sha: c.sha,
      message: c.message,
      date: new Date(c.committed_at ?? c.created_at),
    });
  }
  return Array.from(map.entries()).map(([repo, commits]) => ({ repo, commits }));
}
