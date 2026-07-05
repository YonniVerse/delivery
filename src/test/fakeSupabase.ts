/**
 * Faux client Supabase pour les tests unitaires des repositories.
 * Simule le query builder chaînable et « thenable » de supabase-js : chaque appel
 * de méthode enregistre l'appel et renvoie le builder ; l'await final résout la
 * réponse scriptée pour la table (`{ data, error }`).
 *
 * `script[table]` peut être une réponse unique ou une file FIFO (une par await).
 */
import type { DbClient } from "@/lib/supabase/client";

export interface FakeCall {
  table: string;
  method: string;
  args: unknown[];
}

export interface FakeResult {
  data: unknown;
  error: { message: string } | null;
}

type Script = Record<string, FakeResult | FakeResult[]>;

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "in",
  "order",
  "limit",
] as const;

export function createFakeSupabase(script: Script = {}) {
  const calls: FakeCall[] = [];
  const queueIndex: Record<string, number> = {};

  function resolveFor(table: string): FakeResult {
    const entry = script[table] ?? { data: null, error: null };
    if (Array.isArray(entry)) {
      const i = queueIndex[table] ?? 0;
      queueIndex[table] = i + 1;
      return entry[Math.min(i, entry.length - 1)];
    }
    return entry;
  }

  function makeBuilder(table: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    const record = (method: string) => (...args: unknown[]) => {
      calls.push({ table, method, args });
      return builder;
    };
    for (const m of CHAIN_METHODS) builder[m] = record(m);
    builder.single = record("single");
    builder.maybeSingle = record("maybeSingle");
    builder.then = (
      resolve: (r: FakeResult) => unknown,
      reject?: (e: unknown) => unknown,
    ) => Promise.resolve(resolveFor(table)).then(resolve, reject);
    return builder;
  }

  const client = {
    from(table: string) {
      calls.push({ table, method: "from", args: [table] });
      return makeBuilder(table);
    },
  };

  return { client: client as unknown as DbClient, calls };
}

/** Retrouve les arguments du premier appel à `method` (toutes tables confondues). */
export function findCall(calls: FakeCall[], method: string): FakeCall | undefined {
  return calls.find((c) => c.method === method);
}
