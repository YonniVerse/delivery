"use client";

/**
 * Projets suivis et rôle tenu sur chacun.
 *
 * Le rôle n'est pas décoratif : le prompt IA impose un respect strict des rôles
 * (dev ≠ testeur ≠ designer), donc il est obligatoire à la création.
 */
import { useState } from "react";
import type { ProjectRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface CreateProjectPayload {
  nom: string;
  role: string;
  description: string;
}

export interface ProjectsEditorProps {
  initial: ProjectRow[];
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectsEditor({ initial, onCreate, onDelete }: ProjectsEditorProps) {
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!nom.trim()) return setErreur("Le nom du projet est obligatoire.");
    if (!role.trim()) return setErreur("Le rôle tenu sur le projet est obligatoire.");

    setEnCours(true);
    try {
      await onCreate({ nom: nom.trim(), role: role.trim(), description: description.trim() });
      setNom("");
      setRole("");
      setDescription("");
    } catch {
      setErreur("Échec de l'ajout du projet.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Projets</h2>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun projet pour l&apos;instant. Ajoutez-en un ci-dessous.
        </p>
      ) : (
        <ul className="space-y-2">
          {initial.map((projet) => (
            <li
              key={projet.id}
              data-testid={`projet-${projet.id}`}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div className="space-y-0.5">
                <p className="font-medium">{projet.nom}</p>
                <p className="text-sm text-muted-foreground">{projet.role}</p>
                {projet.description && (
                  <p className="text-sm text-muted-foreground">{projet.description}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onDelete(projet.id)}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={ajouter} className="space-y-3 rounded-md border p-4">
        <div className="space-y-2">
          <Label htmlFor="projet-nom">Nom du projet</Label>
          <Input id="projet-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projet-role">Rôle tenu</Label>
          <Input
            id="projet-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ex : développeur, testeur, designer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projet-description">Description</Label>
          <Textarea
            id="projet-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {erreur && (
          <p role="alert" className="text-sm text-destructive">
            {erreur}
          </p>
        )}
        <Button type="submit" disabled={enCours}>
          {enCours ? "Ajout…" : "Ajouter le projet"}
        </Button>
      </form>
    </section>
  );
}
