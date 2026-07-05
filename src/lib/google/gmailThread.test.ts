import { describe, it, expect } from "vitest";
import {
  pickReplyReference,
  buildReplySubject,
  buildReplyHeaders,
  type GmailMessageRef,
} from "./gmailThread";

const moi = "yasserhamidullah@gmail.com";

const messages: GmailMessageRef[] = [
  { from: "assist-direction@mada-digital.net", messageId: "<m1@mada>" },
  { from: moi, messageId: "<m2@me>" },
  { from: "direction@mada-digital.net", messageId: "<m3@mada>" },
  { from: moi, messageId: "<m4@me>" },
];

describe("pickReplyReference", () => {
  it("choisit le dernier message qui ne vient pas de moi", () => {
    expect(pickReplyReference(messages, moi).messageId).toBe("<m3@mada>");
  });

  it("retombe sur le dernier message si tous viennent de moi", () => {
    const tous = [
      { from: moi, messageId: "<a@me>" },
      { from: moi, messageId: "<b@me>" },
    ];
    expect(pickReplyReference(tous, moi).messageId).toBe("<b@me>");
  });
});

describe("buildReplySubject", () => {
  it("préfixe par Re:", () => {
    expect(buildReplySubject("Rapport de stage")).toBe("Re: Rapport de stage");
  });

  it("ne double pas le préfixe Re:", () => {
    expect(buildReplySubject("Re: Rapport de stage")).toBe("Re: Rapport de stage");
  });
});

describe("buildReplyHeaders", () => {
  it("renseigne In-Reply-To et References avec le Message-ID", () => {
    expect(buildReplyHeaders("<m3@mada>")).toEqual({
      "In-Reply-To": "<m3@mada>",
      References: "<m3@mada>",
    });
  });
});
