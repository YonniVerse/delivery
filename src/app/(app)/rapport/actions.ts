"use server";

/**
 * Génération manuelle du rapport depuis l'UI.
 *
 * L'opération est appelée en process : inutile de passer par HTTP sur notre
 * propre route `/api/actions/report`, ce qui exigerait une URL absolue et de
 * faire transiter `CRON_SECRET` jusqu'au navigateur.
 *
 * Tant que la Phase 8 (OAuth Google) n'est pas faite, `oauth_tokens` est vide et
 * cet appel échoue : l'erreur est remontée telle quelle à l'aperçu.
 */
import { revalidatePath } from "next/cache";
import { runReport } from "@/lib/api/operations";
import { buildReportCtx } from "@/lib/api/deps";

export async function generateReportAction(): Promise<{ ok: boolean; error?: string }> {
  let resultat;
  try {
    resultat = await runReport(buildReportCtx());
  } catch (err) {
    // `buildReportCtx` lit l'env : une clé absente lève avant toute opération.
    console.error("[rapport]", err);
    return { ok: false, error: "Configuration serveur incomplète. Voir les logs." };
  }

  if (!resultat.ok) return { ok: false, error: resultat.message };

  revalidatePath("/rapport");
  return { ok: true };
}
