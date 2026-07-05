/**
 * Création du rapport long en tant que Google Doc (API REST Docs + Drive).
 * Traduit les `Block[]` (src/lib/report/longReport.ts) en requêtes `batchUpdate`.
 * Client mince basé sur `fetch` (injectable) — validé par mocks, runtime réel sur Vercel.
 */
import type { Block } from "@/lib/report/longReport";
import type { FetchLike } from "./oauth";

const DOCS_URL = "https://docs.googleapis.com/v1/documents";
const DRIVE_URL = "https://www.googleapis.com/drive/v3/files";

export interface CreateLongReportOptions {
  accessToken: string;
  driveFolderId?: string;
  title?: string;
  fetchImpl?: FetchLike;
}

export interface CreateLongReportResult {
  documentId: string;
  url: string;
}

const NAMED_STYLE: Record<Block["type"], string> = {
  heading1: "HEADING_1",
  heading2: "HEADING_2",
  category: "HEADING_3",
  paragraph: "NORMAL_TEXT",
  bullet: "NORMAL_TEXT",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocsRequest = Record<string, any>;

/** Construit les requêtes batchUpdate en suivant l'index d'insertion. */
export function buildDocsRequests(blocks: Block[]): DocsRequest[] {
  const requests: DocsRequest[] = [];
  let index = 1; // le corps d'un Doc commence à l'index 1

  for (const block of blocks) {
    const text = `${block.text}\n`;
    const start = index;
    const end = index + text.length;

    requests.push({ insertText: { location: { index: start }, text } });
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: end },
        paragraphStyle: { namedStyleType: NAMED_STYLE[block.type] },
        fields: "namedStyleType",
      },
    });
    if (block.type === "bullet") {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: start, endIndex: end },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });
    }
    index = end;
  }
  return requests;
}

async function gfetch(
  doFetch: FetchLike,
  accessToken: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const res = await doFetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Google API ${url} → ${res.status} : ${await res.text()}`);
  }
  return res;
}

export async function createLongReport(
  blocks: Block[],
  opts: CreateLongReportOptions,
): Promise<CreateLongReportResult> {
  const doFetch = opts.fetchImpl ?? fetch;
  const title = opts.title ?? "Rapport de stage";

  // 1. Créer le document vide
  const created = await gfetch(doFetch, opts.accessToken, DOCS_URL, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  const { documentId } = (await created.json()) as { documentId: string };

  // 2. Insérer le contenu
  await gfetch(doFetch, opts.accessToken, `${DOCS_URL}/${documentId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: buildDocsRequests(blocks) }),
  });

  // 3. Déplacer dans le dossier Drive (optionnel)
  if (opts.driveFolderId) {
    await gfetch(
      doFetch,
      opts.accessToken,
      `${DRIVE_URL}/${documentId}?addParents=${encodeURIComponent(opts.driveFolderId)}&fields=id,parents`,
      { method: "PATCH", body: JSON.stringify({}) },
    );
  }

  return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` };
}
