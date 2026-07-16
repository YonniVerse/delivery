/** Accès à la table `oauth_tokens` (mono-utilisateur : une ligne par provider). */
import type { DbClient } from "@/lib/supabase/client";
import type { OAuthTokenRow } from "@/lib/supabase/types";

export async function getOAuthToken(
  client: DbClient,
  provider = "google",
): Promise<OAuthTokenRow | null> {
  const { data, error } = await client
    .from("oauth_tokens")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(`getOAuthToken: ${error.message}`);
  return (data as OAuthTokenRow) ?? null;
}

export async function saveOAuthToken(
  client: DbClient,
  provider: string,
  patch: Partial<Omit<OAuthTokenRow, "provider" | "updated_at">>,
): Promise<OAuthTokenRow> {
  const { data, error } = await client
    .from("oauth_tokens")
    .upsert(
      { provider, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "provider" },
    )
    .select("*")
    .single();
  if (error) throw new Error(`saveOAuthToken: ${error.message}`);
  return data as OAuthTokenRow;
}
