import { describe, it, expect, vi } from "vitest";
import { createLongReport } from "./docs";
import type { Block } from "@/lib/report/longReport";

const blocks: Block[] = [
  { type: "heading1", text: "Rapport — Semaine du 30 juin" },
  { type: "heading2", text: "1. Objet" },
  { type: "paragraph", text: "Résumé de la semaine." },
  { type: "category", text: "Développement" },
  { type: "bullet", text: "Module réservation livré" },
];

/** fetch mocké : create → batchUpdate → drive move. */
function scriptedFetch() {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes(":batchUpdate")) return new Response("{}", { status: 200 });
    if (u.includes("/drive/v3/files/")) return new Response("{}", { status: 200 });
    // documents.create
    return new Response(JSON.stringify({ documentId: "doc-123" }), { status: 200 });
  });
  return { impl, calls };
}

describe("createLongReport", () => {
  it("crée le document, applique les blocs et renvoie l'URL", async () => {
    const { impl, calls } = scriptedFetch();
    const res = await createLongReport(blocks, {
      accessToken: "at",
      driveFolderId: "folder-1",
      fetchImpl: impl as unknown as typeof fetch,
      title: "Rapport 30 juin",
    });

    expect(res.documentId).toBe("doc-123");
    expect(res.url).toBe("https://docs.google.com/document/d/doc-123/edit");

    // 3 appels : create, batchUpdate, drive move
    expect(calls[0].url).toContain("https://docs.googleapis.com/v1/documents");
    expect(calls[1].url).toContain("doc-123:batchUpdate");
    expect(calls[2].url).toContain("/drive/v3/files/doc-123");

    // Authorization Bearer présent
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer at");

    // batchUpdate contient des requêtes insertText + le texte des titres
    const body = JSON.parse(String(calls[1].init?.body));
    expect(Array.isArray(body.requests)).toBe(true);
    const serialized = JSON.stringify(body.requests);
    expect(serialized).toContain("1. Objet");
    expect(serialized).toContain("HEADING_1");
    expect(serialized).toContain("createParagraphBullets");
  });

  it("sans dossier Drive, ne déplace pas le document", async () => {
    const { impl, calls } = scriptedFetch();
    await createLongReport(blocks, {
      accessToken: "at",
      fetchImpl: impl as unknown as typeof fetch,
    });
    expect(calls.some((c) => c.url.includes("/drive/v3/files/"))).toBe(false);
  });

  it("lève si la création échoue", async () => {
    const impl = vi.fn(async () => new Response("nope", { status: 403 }));
    await expect(
      createLongReport(blocks, { accessToken: "at", fetchImpl: impl as unknown as typeof fetch }),
    ).rejects.toThrow(/403/);
  });
});
