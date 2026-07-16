"use client";

/**
 * Dépôts GitHub dont les commits sont importés chaque jour.
 * Le format attendu est `owner/repo` — c'est ce que l'API GitHub consomme.
 */
import { useState } from "react";
import type { RepoRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

/** `owner/repo`, sans schéma ni barre oblique finale. */
const FORMAT_DEPOT = /^[\w.-]+\/[\w.-]+$/;

export interface ReposEditorProps {
  initial: RepoRow[];
  onCreate: (fullName: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ReposEditor({ initial, onCreate, onToggle, onDelete }: ReposEditorProps) {
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    const valeur = nom.trim();
    if (!FORMAT_DEPOT.test(valeur)) {
      return setErreur("Format attendu : owner/repo (sans l'URL GitHub).");
    }

    setEnCours(true);
    try {
      await onCreate(valeur);
      setNom("");
    } catch {
      setErreur("Échec de l'ajout du dépôt.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Dépôts GitHub</h2>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun dépôt suivi. Ajoutez-en un pour importer les commits.
        </p>
      ) : (
        <ul className="space-y-2">
          {initial.map((depot) => (
            <li
              key={depot.id}
              data-testid={`depot-${depot.id}`}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{depot.full_name}</span>
                {!depot.active && <Badge variant="secondary">Inactif</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => onToggle(depot.id, !depot.active)}>
                  {depot.active ? "Désactiver" : "Activer"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(depot.id)}>
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={ajouter} className="space-y-3 rounded-md border p-4">
        <div className="space-y-2">
          <Label htmlFor="depot-nom">Dépôt à suivre</Label>
          <Input
            id="depot-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="owner/repo"
            className="font-mono"
          />
        </div>
        {erreur && (
          <p role="alert" className="text-sm text-destructive">
            {erreur}
          </p>
        )}
        <Button type="submit" disabled={enCours}>
          {enCours ? "Ajout…" : "Ajouter le dépôt"}
        </Button>
      </form>
    </section>
  );
}
