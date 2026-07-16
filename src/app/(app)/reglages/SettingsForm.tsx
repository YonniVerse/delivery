"use client";

/**
 * Réglages généraux : identité, destinataires de l'e-mail, fil Gmail, provider IA.
 * `save` arrive par les props (Server Action côté page).
 */
import { useState } from "react";
import type { SettingsRow, LlmProviderName } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Champs éditables depuis l'UI (le reste est géré par l'orchestration). */
export type SettingsPatch = Pick<
  SettingsRow,
  "nom_prenom" | "destinataires" | "cc" | "sujet_fil" | "llm_provider"
>;

export interface SettingsFormProps {
  initial: SettingsRow;
  save: (patch: SettingsPatch) => Promise<void>;
}

export function SettingsForm({ initial, save }: SettingsFormProps) {
  const [valeurs, setValeurs] = useState<SettingsPatch>({
    nom_prenom: initial.nom_prenom,
    destinataires: initial.destinataires,
    cc: initial.cc,
    sujet_fil: initial.sujet_fil,
    llm_provider: initial.llm_provider,
  });
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<{ ton: "ok" | "erreur"; texte: string } | null>(null);

  function champ<K extends keyof SettingsPatch>(cle: K, valeur: SettingsPatch[K]) {
    setValeurs((v) => ({ ...v, [cle]: valeur }));
    setMessage(null);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      await save(valeurs);
      setMessage({ ton: "ok", texte: "Enregistré" });
    } catch {
      setMessage({ ton: "erreur", texte: "Échec de l'enregistrement" });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={enregistrer} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nom_prenom">Nom et prénom</Label>
        <Input
          id="nom_prenom"
          value={valeurs.nom_prenom}
          onChange={(e) => champ("nom_prenom", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destinataires">Destinataires</Label>
        <Input
          id="destinataires"
          value={valeurs.destinataires}
          onChange={(e) => champ("destinataires", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Adresses séparées par des virgules.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cc">Copie (CC)</Label>
        <Input id="cc" value={valeurs.cc} onChange={(e) => champ("cc", e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sujet_fil">Sujet du fil Gmail</Label>
        <Input
          id="sujet_fil"
          value={valeurs.sujet_fil}
          onChange={(e) => champ("sujet_fil", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Sert à retrouver le fil auquel répondre — le brouillon reste threadé.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="llm_provider">Provider IA</Label>
        {/* `select` natif : deux options, accessible, et testable sans surcouche. */}
        <select
          id="llm_provider"
          value={valeurs.llm_provider}
          onChange={(e) => champ("llm_provider", e.target.value as LlmProviderName)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="gemini">Gemini 2.5 Flash</option>
          <option value="groq">Groq</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {message && (
          <span
            role={message.ton === "erreur" ? "alert" : "status"}
            className={
              message.ton === "erreur" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
            }
          >
            {message.texte}
          </span>
        )}
      </div>
    </form>
  );
}
