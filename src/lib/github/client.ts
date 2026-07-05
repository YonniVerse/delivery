/**
 * Client GitHub — récupération des commits d'un dépôt.
 * Logique portée de code.gs (recupererCommitsDepot).
 */

export interface Commit {
  /** SHA court (7 caractères). */
  sha: string;
  /** Message complet, trimé. */
  message: string;
  date: Date;
}

export interface FetchCommitsParams {
  /** « owner/repo ». */
  repo: string;
  since: Date;
  until: Date;
  author: string;
  token: string;
}

interface ApiCommit {
  sha: string;
  commit: { message: string; author: { date: string } };
}

export async function fetchCommits(params: FetchCommitsParams): Promise<Commit[]> {
  const { repo, since, until, author, token } = params;

  const url =
    `https://api.github.com/repos/${repo}/commits?` +
    new URLSearchParams({
      author,
      since: since.toISOString(),
      until: until.toISOString(),
      per_page: "50",
    }).toString();

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (res.status === 401) {
    throw new Error("Token GitHub invalide ou expiré.");
  }
  if (!res.ok) {
    // 404 (dépôt introuvable) ou autre erreur → aucun commit.
    return [];
  }

  const data = (await res.json()) as ApiCommit[];
  return data.map((commit) => ({
    sha: commit.sha.substring(0, 7),
    message: commit.commit.message.trim(),
    date: new Date(commit.commit.author.date),
  }));
}
