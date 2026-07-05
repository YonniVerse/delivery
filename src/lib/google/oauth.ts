/**
 * Gestion des jetons OAuth Google (rafraîchissement).
 * Client mince basé sur `fetch` (injectable) — validé par mocks ici, runtime réel sur Vercel.
 */

export type FetchLike = typeof fetch;

const TOKEN_URL = "https://oauth2.googleapis.com/token";
/** Marge avant expiration : on rafraîchit un peu en avance. */
const EXPIRY_MARGIN_MS = 60_000;

export interface RefreshParams {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  fetchImpl?: FetchLike;
}

export interface RefreshResult {
  accessToken: string;
  /** ISO 8601 */
  expiry: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
}

export async function refreshAccessToken(params: RefreshParams): Promise<RefreshResult> {
  const doFetch = params.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const res = await doFetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Rafraîchissement OAuth Google échoué (${res.status}) : ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error("Réponse OAuth Google inattendue (access_token manquant).");
  }
  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  return {
    accessToken: data.access_token,
    expiry: new Date(Date.now() + expiresInMs).toISOString(),
  };
}

export interface StoredToken {
  access_token: string;
  refresh_token?: string | null;
  expiry?: string | null;
}

export interface ValidTokenResult {
  accessToken: string;
  /** Nouvelle expiry si rafraîchi, sinon l'existante. */
  expiry: string | null;
  refreshed: boolean;
}

/**
 * Renvoie un access token valide : réutilise l'existant s'il n'est pas expiré,
 * sinon le rafraîchit. L'appelant persiste le nouveau token si `refreshed`.
 */
export async function getValidAccessToken(
  token: StoredToken,
  opts: { clientId: string; clientSecret: string; fetchImpl?: FetchLike; now?: number },
): Promise<ValidTokenResult> {
  const now = opts.now ?? Date.now();
  const expiryMs = token.expiry ? new Date(token.expiry).getTime() : 0;
  const valide = expiryMs - EXPIRY_MARGIN_MS > now;

  if (valide) {
    return { accessToken: token.access_token, expiry: token.expiry ?? null, refreshed: false };
  }
  if (!token.refresh_token) {
    throw new Error("Access token expiré et aucun refresh_token disponible.");
  }

  const refreshed = await refreshAccessToken({
    refreshToken: token.refresh_token,
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    fetchImpl: opts.fetchImpl,
  });
  return { accessToken: refreshed.accessToken, expiry: refreshed.expiry, refreshed: true };
}
