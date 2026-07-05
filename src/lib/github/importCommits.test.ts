import { describe, it, expect } from "vitest";
import { dedupeCommits, formatCommitsForNotes } from "./importCommits";
import type { Commit } from "./client";

const c = (sha: string, message: string): Commit => ({
  sha,
  message,
  date: new Date("2026-07-06T14:30:00Z"),
});

describe("dedupeCommits", () => {
  it("supprime les doublons par sha en gardant le premier", () => {
    const res = dedupeCommits([c("aaa1111", "A"), c("bbb2222", "B"), c("aaa1111", "A bis")]);
    expect(res).toHaveLength(2);
    expect(res.map((x) => x.sha)).toEqual(["aaa1111", "bbb2222"]);
  });

  it("renvoie une liste vide pour une entrée vide", () => {
    expect(dedupeCommits([])).toEqual([]);
  });
});

describe("formatCommitsForNotes", () => {
  it("groupe par dépôt et n'affiche que la première ligne du message", () => {
    const texte = formatCommitsForNotes([
      { repo: "org/repoA", commits: [c("aaa1111", "Ajoute X\n\ndétails ignorés")] },
      { repo: "org/repoB", commits: [c("bbb2222", "Corrige Y")] },
    ]);
    expect(texte).toContain("org/repoA");
    expect(texte).toContain("[aaa1111] Ajoute X");
    expect(texte).not.toContain("détails ignorés");
    expect(texte).toContain("org/repoB");
    expect(texte).toContain("[bbb2222] Corrige Y");
  });

  it("ignore les dépôts sans commit", () => {
    const texte = formatCommitsForNotes([{ repo: "org/vide", commits: [] }]);
    expect(texte).toBe("");
  });
});
