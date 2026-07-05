/**
 * Helpers purs pour répondre dans un fil Gmail.
 * Portés de code.gs (creerBrouillonReponse) — la partie appel API viendra autour.
 */

export interface GmailMessageRef {
  /** En-tête « From » du message. */
  from: string;
  /** En-tête « Message-ID ». */
  messageId: string;
}

/**
 * Choisit le message auquel répondre : le dernier qui ne vient pas de moi
 * (pour éviter de se retrouver destinataire de sa propre réponse).
 * Repli : le dernier message du fil.
 */
export function pickReplyReference(
  messages: GmailMessageRef[],
  myEmail: string,
): GmailMessageRef {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].from.includes(myEmail)) {
      return messages[i];
    }
  }
  return messages[messages.length - 1];
}

/** Construit l'objet de réponse sans doubler le préfixe « Re: ». */
export function buildReplySubject(firstSubject: string): string {
  return /^re:/i.test(firstSubject.trim()) ? firstSubject : `Re: ${firstSubject}`;
}

/** En-têtes de threading pointant vers le Message-ID de référence. */
export function buildReplyHeaders(messageId: string): {
  "In-Reply-To": string;
  References: string;
} {
  return { "In-Reply-To": messageId, References: messageId };
}
