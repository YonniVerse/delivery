/**
 * Fabriques de clients Supabase typés.
 * - `createBrowserSupabase` : clé anon, pour le navigateur (soumise à la RLS).
 * - `createServiceSupabase`  : clé service-role, serveur uniquement (Cron/orchestration,
 *   contourne la RLS). NE JAMAIS exposer la service-role au client.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getEnv } from "@/lib/env";

export type DbClient = SupabaseClient<Database>;

export function createBrowserSupabase(): DbClient {
  const env = getEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createServiceSupabase(): DbClient {
  const env = getEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
