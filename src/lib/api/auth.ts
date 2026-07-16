/**
 * Garde d'authentification des routes serveur.
 * Vercel Cron envoie `Authorization: Bearer $CRON_SECRET` ; les routes d'action
 * réutilisent le même garde en attendant la session Supabase (Phase 8).
 */
import { timingSafeEqual } from "node:crypto";

/** Comparaison à temps constant, insensible à la différence de longueur. */
function secretsEgaux(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual exige des longueurs identiques : on compare toujours des
  // buffers de même taille, puis on réintègre l'égalité des longueurs.
  const taille = Math.max(bufA.length, bufB.length, 1);
  const padA = Buffer.alloc(taille);
  const padB = Buffer.alloc(taille);
  bufA.copy(padA);
  bufB.copy(padB);
  return timingSafeEqual(padA, padB) && bufA.length === bufB.length;
}

export function isAuthorized(req: Request, secret: string): boolean {
  // Un secret vide signifie une configuration absente : ne jamais laisser passer.
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (!header) return false;

  const [schema, ...reste] = header.split(" ");
  if (schema.toLowerCase() !== "bearer") return false;

  return secretsEgaux(reste.join(" "), secret);
}

export function unauthorized(): Response {
  return Response.json({ ok: false, error: "Non autorisé" }, { status: 401 });
}
