import { describe, it, expect, vi } from "vitest";
import { createReplyDraft } from "./gmail";
import type { Report } from "@/domain/reportSchema";

const court: Report["court"] = {
  intro: "Voici le résumé de la semaine.",
  points_cles: [{ categorie: "Réservation", description: "module livré" }],
  livrables: ["Sitemap"],
  difficultes: [],
  objectifs: ["Finir le module A"],
};

const thread = {
  threadId: "thread-1",
  firstSubject: "Rapport de stage",
  messages: [
    { from: "moi@gmail.com", messageId: "<m1@mail>" },
    { from: "direction@mada.net", messageId: "<m2@mail>" },
    { from: "moi@gmail.com", messageId: "<m3@mail>" },
  ],
};

/** Décode le `raw` base64url d'un brouillon Gmail. */
function decodeRaw(raw: string): string {
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

describe("createReplyDraft", () => {
  it("crée un brouillon threadé avec en-têtes de réponse et corps HTML", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: "draft-9", message: { threadId: "thread-1" } }), {
        status: 200,
      }),
    );

    const res = await createReplyDraft(court, "https://docs.google.com/document/d/abc/edit", thread, {
      accessToken: "at",
      me: "moi@gmail.com",
      to: "direction@mada.net",
      cc: "cc@mada.net",
      nomPrenom: "TINOGNY Yonni",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(res.draftId).toBe("draft-9");
    expect(res.threadId).toBe("thread-1");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("gmail.googleapis.com/gmail/v1/users/me/drafts");
    const body = JSON.parse(String(init?.body));
    expect(body.message.threadId).toBe("thread-1");

    const mime = decodeRaw(body.message.raw);
    // Répond au dernier message qui n'est pas de moi (m2)
    expect(mime).toContain("In-Reply-To: <m2@mail>");
    expect(mime).toContain("References: <m2@mail>");
    // Sujet préfixé Re: sans doublon
    expect(mime).toContain("Subject: Re: Rapport de stage");
    expect(mime).toContain("To: direction@mada.net");
    expect(mime).toContain("Cc: cc@mada.net");
    expect(mime).toContain("Content-Type: text/html");
    expect(mime).toContain("Voici le résumé de la semaine.");
    expect(mime).toContain("abc/edit"); // lien Drive dans le corps
  });

  it("ne double pas le préfixe Re: si le sujet en a déjà un", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: "d", message: { threadId: "t" } }), { status: 200 }),
    );
    await createReplyDraft(court, "url", { ...thread, firstSubject: "Re: Rapport de stage" }, {
      accessToken: "at",
      me: "moi@gmail.com",
      to: "x@y.net",
      nomPrenom: "Y",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const mime = decodeRaw(JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)).message.raw);
    expect(mime).toContain("Subject: Re: Rapport de stage");
    expect(mime).not.toContain("Re: Re:");
  });

  it("lève sur erreur API", async () => {
    const fetchImpl = vi.fn(async () => new Response("bad", { status: 401 }));
    await expect(
      createReplyDraft(court, "url", thread, {
        accessToken: "at",
        me: "moi@gmail.com",
        to: "x@y.net",
        nomPrenom: "Y",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/401/);
  });
});
