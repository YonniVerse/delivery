/**
 * Création d'un brouillon Gmail en réponse dans un fil (API REST Gmail).
 * Réutilise les helpers purs de gmailThread.ts et le corps HTML de emailHtml.ts.
 * Client mince basé sur `fetch` (injectable) — validé par mocks, runtime réel sur Vercel.
 */
import type { Report } from "@/domain/reportSchema";
import { buildEmailHtml } from "@/lib/report/emailHtml";
import {
  buildReplyHeaders,
  buildReplySubject,
  pickReplyReference,
  type GmailMessageRef,
} from "./gmailThread";
import type { FetchLike } from "./oauth";

const DRAFTS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export interface GmailThread {
  threadId: string;
  firstSubject: string;
  messages: GmailMessageRef[];
}

export interface CreateReplyDraftOptions {
  accessToken: string;
  /** Mon adresse (pour choisir le message de référence). */
  me: string;
  to: string;
  cc?: string;
  nomPrenom: string;
  fetchImpl?: FetchLike;
}

export interface CreateReplyDraftResult {
  draftId: string;
  threadId: string;
}

/** Encode une chaîne UTF-8 en base64url (format `raw` de l'API Gmail). */
function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Assemble le message MIME (en-têtes + corps HTML). */
export function buildMimeMessage(params: {
  to: string;
  cc?: string;
  subject: string;
  inReplyTo: string;
  references: string;
  html: string;
}): string {
  const headers = [
    `To: ${params.to}`,
    ...(params.cc ? [`Cc: ${params.cc}`] : []),
    `Subject: ${params.subject}`,
    `In-Reply-To: ${params.inReplyTo}`,
    `References: ${params.references}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ];
  return `${headers.join("\r\n")}\r\n\r\n${params.html}`;
}

export async function createReplyDraft(
  court: Report["court"],
  driveUrl: string,
  thread: GmailThread,
  opts: CreateReplyDraftOptions,
): Promise<CreateReplyDraftResult> {
  const doFetch = opts.fetchImpl ?? fetch;

  const ref = pickReplyReference(thread.messages, opts.me);
  const subject = buildReplySubject(thread.firstSubject);
  const { "In-Reply-To": inReplyTo, References: references } = buildReplyHeaders(ref.messageId);
  const html = buildEmailHtml({ court, driveUrl, nomPrenom: opts.nomPrenom });

  const mime = buildMimeMessage({
    to: opts.to,
    cc: opts.cc,
    subject,
    inReplyTo,
    references,
    html,
  });

  const res = await doFetch(DRAFTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: { raw: toBase64Url(mime), threadId: thread.threadId },
    }),
  });

  if (!res.ok) {
    throw new Error(`Création brouillon Gmail échouée (${res.status}) : ${await res.text()}`);
  }

  const data = (await res.json()) as { id: string; message?: { threadId?: string } };
  return { draftId: data.id, threadId: data.message?.threadId ?? thread.threadId };
}

// ─── getGmailThread ────────────────────────────────────────────────────────

const THREADS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/threads";

interface GmailApiHeader {
  name: string;
  value: string;
}

interface GmailApiMessage {
  id: string;
  payload?: { headers?: GmailApiHeader[] };
}

interface GmailApiThread {
  id: string;
  messages?: GmailApiMessage[];
}

function headerValue(headers: GmailApiHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/**
 * Récupère les métadonnées d'un fil Gmail (From, Message-ID, Subject de chaque
 * message) — nécessaire pour construire un brouillon threadé.
 */
export async function getGmailThread(
  accessToken: string,
  threadId: string,
  opts?: { fetchImpl?: FetchLike },
): Promise<GmailThread> {
  const doFetch = opts?.fetchImpl ?? fetch;

  const url =
    `${THREADS_URL}/${encodeURIComponent(threadId)}?` +
    new URLSearchParams({
      format: "metadata",
      metadataHeaders: ["From", "Message-ID", "Subject"].join(","),
    }).toString();

  const res = await doFetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Récupération thread Gmail échouée (${res.status}) : ${await res.text()}`);
  }

  const data = (await res.json()) as GmailApiThread;
  const messages = (data.messages ?? []).map((m) => {
    const headers = m.payload?.headers ?? [];
    return {
      from: headerValue(headers, "From"),
      messageId: headerValue(headers, "Message-ID"),
    };
  });

  const firstSubject =
    data.messages?.[0]?.payload?.headers
      ? headerValue(data.messages[0].payload.headers, "Subject")
      : "";

  return { threadId: data.id, firstSubject, messages };
}
