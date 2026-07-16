/**
 * Résolution de l'access token Google côté serveur.
 * Le Cron n'a pas de session utilisateur : le jeton est lu en base (`oauth_tokens`),
 * rafraîchi si nécessaire, et re-persisté seulement s'il a changé.
 * La ligne `oauth_tokens` est alimentée par le flux OAuth (Phase 8).
 */
import type { DbClient } from "@/lib/supabase/client";
import type { FetchLike } from "@/lib/google/oauth";
import { getValidAccessToken } from "@/lib/google/oauth";
import { getOAuthToken, saveOAuthToken } from "@/lib/repositories/oauthTokensRepo";

const PROVIDER = "google";

export interface ResolveAccessTokenOptions {
  clientId: string;
  clientSecret: string;
  fetchImpl?: FetchLike;
  /** Instant de référence (défaut : maintenant) — pour les tests. */
  now?: number;
}

export async function resolveAccessToken(
  client: DbClient,
  opts: ResolveAccessTokenOptions,
): Promise<string> {
  const stored = await getOAuthToken(client, PROVIDER);
  if (!stored) {
    throw new Error(
      "Aucun jeton Google en base : connectez votre compte Google avant de générer un rapport.",
    );
  }

  const { accessToken, expiry, refreshed } = await getValidAccessToken(stored, opts);

  if (refreshed) {
    await saveOAuthToken(client, PROVIDER, { access_token: accessToken, expiry });
  }

  return accessToken;
}
