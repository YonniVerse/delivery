/**
 * Dédoublonnage et formatage des commits pour la section « Commits GitHub » des notes.
 */
import type { Commit } from "./client";

export interface RepoCommits {
  repo: string;
  commits: Commit[];
}

/** Retire les commits en double par sha, en conservant la première occurrence. */
export function dedupeCommits(commits: Commit[]): Commit[] {
  const vus = new Set<string>();
  const res: Commit[] = [];
  for (const commit of commits) {
    if (vus.has(commit.sha)) continue;
    vus.add(commit.sha);
    res.push(commit);
  }
  return res;
}

/**
 * Produit le texte de la section notes, groupé par dépôt.
 * N'affiche que la première ligne du message ; ignore les dépôts sans commit.
 */
export function formatCommitsForNotes(groupes: RepoCommits[]): string {
  return groupes
    .filter((g) => g.commits.length > 0)
    .map((g) => {
      const lignes = g.commits
        .map((c) => `- [${c.sha}] ${c.message.split("\n")[0].trim()}`)
        .join("\n");
      return `📁 ${g.repo}\n${lignes}`;
    })
    .join("\n\n");
}
